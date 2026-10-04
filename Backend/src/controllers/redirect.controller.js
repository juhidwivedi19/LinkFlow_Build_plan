const prisma = require("../config/db.config.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    getRedis,
    setRedis,
} = require("../services/redis.service.js");

const { createAnalyticsEvent } = require("../services/analytics.service.js");

// Redirect short link
async function redirectController(req, res) {
    try {
        const { slug } = req.params;

        // Validate slug before using it
        if (!slug || !slug.trim()) {
            return res.status(400).json({
                message: "Slug is required",
                status: "failed"
            });
        }

        const normalizedSlug = slug.trim().toLowerCase();
        const cacheKey = `link:${normalizedSlug}`;
        // Each short link gets its own Redis cache key
       let cachedLink = null;

try {
    cachedLink = await getRedis(cacheKey);
} catch (error) {
    console.error("Redis GET error:", error);
}

        let link;

        if (cachedLink) {
            // Redis stores JSON as a string
            link = JSON.parse(cachedLink);
        } else {
            // Cache miss → fetch the link from PostgreSQL
            link = await prisma.link.findUnique({
                where: {
                    slug: normalizedSlug
                }
            });

         if (link) {
    try {
        await setRedis(
            cacheKey,
            JSON.stringify(link),
            300
        );
    } catch (error) {
        console.error("Redis SET error:", error);
    }
}
        }

        // Link does not exist
        if (!link) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }

        // Expired links cannot be accessed
        if (
            link.expiresAt &&
            new Date(link.expiresAt) <= new Date()
        ) {
            return res.status(410).json({
                message: "This link has expired",
                status: "failed"
            });
        }

        // Disabled links cannot redirect visitors
        if (link.status === "DISABLED") {
            return res.status(403).json({
                message: "This link is disabled",
                status: "failed"
            });
        }

        // Password-protected links require temporary access token
        if (link.passwordHash) {
            const accessToken = req.cookies.linkAccessToken;

            if (!accessToken) {
                return res.status(401).json({
                    message: "Password required",
                    status: "failed"
                });
            }

            try {
                // Verify temporary link-access token
                const decoded = jwt.verify(
                    accessToken,
                    process.env.JWT_SECRET
                );

                // Make sure token belongs to this link
                if (
                    decoded.linkId !== link.id ||
                    decoded.purpose !== "link-access"
                ) {
                    return res.status(401).json({
                        message: "Invalid link access",
                        status: "failed"
                    });
                }

            } catch (error) {
                // Token expired, invalid, or tampered with
                return res.status(401).json({
                    message: "Password verification required",
                    status: "failed"
                });
            }
        }
    
     createAnalyticsEvent({
    linkId: link.id,
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    referrer: req.get("referer") || null
});

return res.redirect(302, link.url);
    } catch (error) {
        console.error("Error in redirect controller:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}


// Verify password for password-protected link
async function verifyLinkPasswordController(req, res) {
    try {
        const { slug } = req.params;
        const { password } = req.body;

        // Validate slug
        if (!slug || !slug.trim()) {
            return res.status(400).json({
                message: "Slug is required",
                status: "failed"
            });
        }

        // Password is required
        if (!password) {
            return res.status(400).json({
                message: "Password is required",
                status: "failed"
            });
        }

        const normalizedSlug = slug.trim().toLowerCase();

        // Find link using slug
        const link = await prisma.link.findUnique({
            where: {
                slug: normalizedSlug
            }
        });

        // Link does not exist
        if (!link) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }

        // Expired links cannot be unlocked
        if (
            link.expiresAt &&
            new Date(link.expiresAt) <= new Date()
        ) {
            return res.status(410).json({
                message: "This link has expired",
                status: "failed"
            });
        }

        // Disabled links cannot be unlocked
        if (link.status === "DISABLED") {
            return res.status(403).json({
                message: "This link is disabled",
                status: "failed"
            });
        }

        // This endpoint is only for password-protected links
        if (!link.passwordHash) {
            return res.status(400).json({
                message: "This link is not password protected",
                status: "failed"
            });
        }

        // Compare provided password with bcrypt hash
        const isPasswordValid = await bcrypt.compare(
            password,
            link.passwordHash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid password",
                status: "failed"
            });
        }

        // Create temporary access token
        const accessToken = jwt.sign(
            {
                linkId: link.id,
                purpose: "link-access"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "10m"
            }
        );

        // Store token in httpOnly cookie
        res.cookie("linkAccessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 10 * 60 * 1000
        });

        return res.status(200).json({
            message: "Password verified successfully",
            status: "success"
        });

    } catch (error) {
        console.error("Verify link password error:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}


module.exports = {
    redirectController,
    verifyLinkPasswordController
};