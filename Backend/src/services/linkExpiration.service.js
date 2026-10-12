const prisma = require("../config/db.config.js");
const { createNotification } = require("./notification.service.js");

async function processExpiredLinks() {
    const now = new Date();

    const expiredLinks = await prisma.link.findMany({
        where: {
            expiresAt: {
                lte: now
            }
        },
        include: {
            workspace: {
                include: {
                    memberships: {
                        select: {
                            userId: true
                        }
                    }
                }
            }
        }
    });

    for (const link of expiredLinks) {
        for (const membership of link.workspace.memberships) {
            const existingNotification = await prisma.notification.findFirst({
                where: {
                    userId: membership.userId,
                    type: "LINK_EXPIRATION",
                    metadata: {
                        path: ["linkId"],
                        equals: link.id
                    }
                }
            });

            if (existingNotification) {
                continue;
            }

            await createNotification({
                userId: membership.userId,
                type: "LINK_EXPIRATION",
                title: "Link expired",
                message: `Your short link "${link.slug}" has expired.`,
                metadata: {
                    linkId: link.id,
                    slug: link.slug,
                    expiresAt: link.expiresAt.toISOString()
                }
            });
        }
    }

    return expiredLinks.length;
}

module.exports = { processExpiredLinks };