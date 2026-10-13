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
    select: {
        id: true,
        slug: true,
        expiresAt: true,
        workspace: {
            select: {
                memberships: {
                    select: {
                        userId: true
                    }
                }
            }
        }
    }
});

let notificationsCreated = 0;
let notificationsSkipped = 0;

for (const link of expiredLinks) {
    for (const membership of link.workspace.memberships) {
        try {
            const created = await prisma.$transaction(async (tx) => {
                // Check whether this user has already received
                // an expiration notification for this link.
                const existingNotification =
                    await tx.notification.findFirst({
                        where: {
                            userId: membership.userId,
                            type: "LINK_EXPIRATION",
                            linkId: link.id
                        },
                        select: {
                            id: true
                        }
                    });

                if (existingNotification) {
                    return false;
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
                    },
                    linkId: link.id,
                    tx
                });

                return true;
            });

            if (created) {
                notificationsCreated++;
            } else {
                notificationsSkipped++;
            }
        } catch (error) {
            // P2002 means a unique constraint was violated.
            // Another worker may have created this notification
            // concurrently, so count it as skipped.
            if (error.code === "P2002") {
                notificationsSkipped++;
                continue;
            }

            // Log the failure and continue processing other users.
            console.error(
                `Failed to create expiration notification for user ${membership.userId}, link ${link.id}:`,
                error
            );
        }
    }
}

const result = {
    expiredLinksFound: expiredLinks.length,
    notificationsCreated,
    notificationsSkipped
};

console.log("Link expiration processing completed:", result);

return result;


}

module.exports = { processExpiredLinks };
