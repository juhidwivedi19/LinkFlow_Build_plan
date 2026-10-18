const prisma = require("../config/db.config.js");
const { createNotification } = require("./notification.service.js");

async function processExpiredLinks() {
  const now = new Date();

  const expiredLinks = await prisma.link.findMany({
    where: {
      expiresAt: {
        lte: now,
      },
      status: "ACTIVE",
    },
    select: {
      id: true,
      slug: true,
      expiresAt: true,
      workspaceId: true,
      workspace: {
        select: {
          memberships: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  let notificationsCreated = 0;
  let notificationsSkipped = 0;
  let linksMarkedExpired = 0;
  let errors = 0;

  for (const link of expiredLinks) {
    let linkProcessingSucceeded = true;

    for (const membership of link.workspace.memberships) {
      try {
        const created = await prisma.$transaction(async (tx) => {
          const existingNotification = await tx.notification.findFirst({
            where: {
              userId: membership.userId,
              type: "LINK_EXPIRATION",
              linkId: link.id,
            },
            select: {
              id: true,
            },
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
              expiresAt: link.expiresAt.toISOString(),
            },
            linkId: link.id,
            tx,
          });

          return true;
        });

        if (created) {
          notificationsCreated++;
        } else {
          notificationsSkipped++;
        }
      } catch (error) {
        if (error.code === "P2002") {
          notificationsSkipped++;
          continue;
        }

        linkProcessingSucceeded = false;
        errors++;

        console.error(
          `Failed to create expiration notification for user ${membership.userId}, link ${link.id}:`,
          error
        );
      }
    }

    // Mark the link expired only if notification processing had no errors.
    if (linkProcessingSucceeded) {
      try {
        const updated = await prisma.link.updateMany({
          where: {
            id: link.id,
            status: "ACTIVE",
          },
          data: {
            status: "EXPIRED",
          },
        });

        linksMarkedExpired += updated.count;
      } catch (error) {
        errors++;

        console.error(
          `Failed to mark link ${link.id} as expired:`,
          error
        );
      }
    }
  }

  const result = {
    expiredLinksFound: expiredLinks.length,
    linksMarkedExpired,
    notificationsCreated,
    notificationsSkipped,
    errors,
  };

  console.log("Link expiration processing completed:", result);

  return result;
}

module.exports = { processExpiredLinks };