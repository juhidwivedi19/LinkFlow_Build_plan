const prisma = require("../config/db.config.js");
const { Prisma } = require("@prisma/client");

async function getTotalClicksByWorkspace(workspaceId, dateFilter = {}) {
    return await prisma.analyticsEvent.count({
        where: {
            link: {
                workspaceId
            },
            ...dateFilter
        }
    });
}

async function getDailyClicksByWorkspace(workspaceId, dateFilter = {}) {
    // PostgreSQL groups events by calendar day.
    return await prisma.$queryRaw`
        SELECT
            DATE("occurredAt") AS date,
            COUNT(*)::int AS clicks
        FROM "AnalyticsEvent"
        WHERE "linkId" IN (
            SELECT "id"
            FROM "Link"
            WHERE "workspaceId" = ${workspaceId}
        )

        ${
            dateFilter.occurredAt?.gte
                ? Prisma.sql`AND "occurredAt" >= ${dateFilter.occurredAt.gte}`
                : Prisma.empty
        }

        ${
            dateFilter.occurredAt?.lte
                ? Prisma.sql`AND "occurredAt" <= ${dateFilter.occurredAt.lte}`
                : Prisma.empty
        }

        GROUP BY DATE("occurredAt")
        ORDER BY DATE("occurredAt") ASC
    `;
}

async function getWeeklyClicksByWorkspace(workspaceId, dateFilter = {}) {
    // DATE_TRUNC('week') groups events into Monday-Sunday weeks.
    return await prisma.$queryRaw`
        SELECT
            DATE_TRUNC('week', "occurredAt") AS week,
            COUNT(*)::int AS clicks
        FROM "AnalyticsEvent"
        WHERE "linkId" IN (
            SELECT "id"
            FROM "Link"
            WHERE "workspaceId" = ${workspaceId}
        )

        ${
            dateFilter.occurredAt?.gte
                ? Prisma.sql`AND "occurredAt" >= ${dateFilter.occurredAt.gte}`
                : Prisma.empty
        }

        ${
            dateFilter.occurredAt?.lte
                ? Prisma.sql`AND "occurredAt" <= ${dateFilter.occurredAt.lte}`
                : Prisma.empty
        }

        GROUP BY DATE_TRUNC('week', "occurredAt")
        ORDER BY DATE_TRUNC('week', "occurredAt") ASC
    `;
}

async function getMonthlyClicksByWorkspace(workspaceId, dateFilter = {}) {
    // DATE_TRUNC('month') groups events by calendar month.
    return await prisma.$queryRaw`
        SELECT
            DATE_TRUNC('month', "occurredAt") AS month,
            COUNT(*)::int AS clicks
        FROM "AnalyticsEvent"
        WHERE "linkId" IN (
            SELECT "id"
            FROM "Link"
            WHERE "workspaceId" = ${workspaceId}
        )

        ${
            dateFilter.occurredAt?.gte
                ? Prisma.sql`AND "occurredAt" >= ${dateFilter.occurredAt.gte}`
                : Prisma.empty
        }

        ${
            dateFilter.occurredAt?.lte
                ? Prisma.sql`AND "occurredAt" <= ${dateFilter.occurredAt.lte}`
                : Prisma.empty
        }

        GROUP BY DATE_TRUNC('month', "occurredAt")
        ORDER BY DATE_TRUNC('month', "occurredAt") ASC
    `;
}

async function getTopLinksByWorkspace(workspaceId, dateFilter = {}) {
    const events = await prisma.analyticsEvent.groupBy({
        by: ["linkId"],
        where: {
            link: {
                workspaceId
            },
            ...dateFilter
        },
        _count: {
            linkId: true
        },
        orderBy: {
            _count: {
                linkId: "desc"
            }
        },
        take: 10
    });

    // Get actual link details for the aggregated link IDs
    const linkIds = events.map((event) => event.linkId);

    const links = await prisma.link.findMany({
        where: {
            id: {
                in: linkIds
            }
        },
        select: {
            id: true,
            slug: true,
            title: true
        }
    });

    // Merge click counts with link information
    return events.map((event) => {
        const link = links.find(
            (item) => item.id === event.linkId
        );

        return {
            id: event.linkId,
            slug: link?.slug || null,
            title: link?.title || null,
            clicks: event._count.linkId
        };
    });
}

async function getClicksByCountryByWorkspace(
    workspaceId,
    dateFilter = {}
) {
    // GROUP BY lets PostgreSQL calculate country totals
    // without loading every analytics event into Node.js.
    return await prisma.analyticsEvent.groupBy({
        by: ["country"],

        where: {
            link: {
                workspaceId
            },
            ...dateFilter
        },

        _count: {
            _all: true
        },

        orderBy: {
            _count: {
                country: "desc"
            }
        }
    });
}
async function getClicksByBrowserByWorkspace(
    workspaceId,
    dateFilter = {}
) {
    // PostgreSQL groups browser values and counts clicks directly.
    return await prisma.analyticsEvent.groupBy({
        by: ["browser"],

        where: {
            link: {
                workspaceId
            },
            ...dateFilter
        },

        _count: {
            _all: true
        },

        orderBy: {
            _count: {
                browser: "desc"
            }
        }
    });
}

async function getClicksByDeviceByWorkspace(
    workspaceId,
    dateFilter = {}
) {
    // PostgreSQL groups device types and counts clicks directly.
    return await prisma.analyticsEvent.groupBy({
        by: ["device"],

        where: {
            link: {
                workspaceId
            },
            ...dateFilter
        },

        _count: {
            _all: true
        },

        orderBy: {
            _count: {
                device: "desc"
            }
        }
    });
}

async function getClicksByReferrerByWorkspace(
    workspaceId,
    dateFilter = {}
) {
    // Group clicks by the page/source that referred the visitor.
    return await prisma.analyticsEvent.groupBy({
        by: ["referrer"],

        where: {
            link: {
                workspaceId
            },
            ...dateFilter
        },

        _count: {
            _all: true
        },

        orderBy: {
            _count: {
                referrer: "desc"
            }
        }
    });
}

module.exports = {
    getTotalClicksByWorkspace,
    getDailyClicksByWorkspace,
    getWeeklyClicksByWorkspace,
    getMonthlyClicksByWorkspace,
     getTopLinksByWorkspace,
      getClicksByCountryByWorkspace,
       getClicksByBrowserByWorkspace,
       getClicksByDeviceByWorkspace,
       getClicksByReferrerByWorkspace
};