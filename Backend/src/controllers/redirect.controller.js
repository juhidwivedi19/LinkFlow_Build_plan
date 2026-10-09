const prisma = require("../config/db.config.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    getRedis,
    setRedis,
} = require("../services/redis.service.js");

const { createAnalyticsEvent } = require("../services/analytics.service.js");

// Normalize hostname to avoid differences caused by case or a trailing dot.
function normalizeHostname(hostname) {
    return hostname
        .trim()
        .toLowerCase()
        .replace(/\.$/, "");
}

// Redirect short link
async function redirectController(req, res) {
    try {
        const { slug } = req.params;

        if (!slug || !slug.trim()) {
            return res.status(400).json({
                message: "Slug is required",
                status: "failed"
            });
        }

        const normalizedSlug = slug.trim().toLowerCase();
        const hostname = normalizeHostname(req.hostname);

        // Domain-aware keys prevent different domains from sharing cached links.
        const cacheKey = `link:${hostname}:${normalizedSlug}`;

        let link = null;

        try {
            const cachedLink = await getRedis(cacheKey);

            if (cachedLink) {
                link = JSON.parse(cachedLink);
            }
        } catch (error) {
            console.error("Redis GET error:", error);
        }

        if (!link) {
            // Resolve whether the request uses a registered custom domain.
            let customDomain = null;

            try {
                customDomain = await prisma.customDomain.findUnique({
                    where: {
                        domain: hostname
                    },
                    select: {
                        id: true,
                        verified: true
                    }
                });
            } catch (error) {
                console.error("Custom domain lookup error:", error);
                return res.status(500).json({
                    message: "Unable to resolve domain",
                    status: "failed"
                });
            }

            if (customDomain && !customDomain.verified) {
                return res.status(404).json({
                    message: "Domain is not verified",
                    status: "failed"
                });
            }

            // Custom domains can only resolve links assigned to that domain.
            // Requests to other hosts resolve links without a custom domain.
            const where = customDomain
                ? {
                    slug: normalizedSlug,
                    customDomainId: customDomain.id
                }
                : {
                    slug: normalizedSlug,
                    customDomainId: null
                };

            link = await prisma.link.findFirst({
                where
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

        if (!link) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }

        if (
            link.expiresAt &&
            new Date(link.expiresAt) <= new Date()
        ) {
            return res.status(410).json({
                message: "This link has expired",
                status: "failed"
            });
        }

        if (link.status === "DISABLED") {
            return res.status(403).json({
                message: "This link is disabled",
                status: "failed"
            });
        }

        // Password-protected links require a valid temporary access token.
        if (link.passwordHash) {
            const accessToken = req.cookies?.linkAccessToken;

            if (!accessToken) {
                return res.status(401).json({
                    message: "Password required",
                    status: "failed"
                });
            }

            try {
                const decoded = jwt.verify(
                    accessToken,
                    process.env.JWT_SECRET
                );

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
                return res.status(401).json({
                    message: "Password verification required",
                    status: "failed"
                });
            }
        }

        // Preserve the analytics pipeline without delaying the redirect.
        createAnalyticsEvent({
            linkId: link.id,
            ipAddress: req.ip,
            userAgent: req.get("user-agent"),
            referrer: req.get("referer") || null
        }).catch(error => {
            console.error("Analytics event error:", error);
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
        const hostname = normalizeHostname(req.hostname);

        if (!slug || !slug.trim()) {
            return res.status(400).json({
                message: "Slug is required",
                status: "failed"
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "Password is required",
                status: "failed"
            });
        }

        const normalizedSlug = slug.trim().toLowerCase();

        const customDomain = await prisma.customDomain.findUnique({
            where: {
                domain: hostname
            },
            select: {
                id: true,
                verified: true
            }
        });

        if (customDomain && !customDomain.verified) {
            return res.status(404).json({
                message: "Domain is not verified",
                status: "failed"
            });
        }

        const where = customDomain
            ? {
                slug: normalizedSlug,
                customDomainId: customDomain.id
            }
            : {
                slug: normalizedSlug,
                customDomainId: null
            };

        const link = await prisma.link.findFirst({ where });

        if (!link) {
            return res.status(404).json({
                message: "Link not found",
                status: "failed"
            });
        }

        if (
            link.expiresAt &&
            new Date(link.expiresAt) <= new Date()
        ) {
            return res.status(410).json({
                message: "This link has expired",
                status: "failed"
            });
        }

        if (link.status === "DISABLED") {
            return res.status(403).json({
                message: "This link is disabled",
                status: "failed"
            });
        }

        if (!link.passwordHash) {
            return res.status(400).json({
                message: "This link is not password protected",
                status: "failed"
            });
        }

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