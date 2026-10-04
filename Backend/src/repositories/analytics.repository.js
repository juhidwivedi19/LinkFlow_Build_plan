const prisma = require("../config/db.config.js");
const { Prisma } = require("@prisma/client");

async function getAnalyticsEventsByLink(
    linkId,
    skip,
    limit
) {
    // Fetch only the required number of events.
    // This prevents loading a huge analytics dataset into memory.
    return await prisma.analyticsEvent.findMany({
        where: {
            linkId
        },
        orderBy: {
            occurredAt: "desc"
        },
        skip,
        take: limit
    });
}

async function countAnalyticsEventsByLink(linkId) {
    // Count is kept separate so the API can tell the client
    // how many analytics events exist in total.
    return await prisma.analyticsEvent.count({
        where: {
            linkId
        }
    });
}

async function getTotalClicksByLink(linkId) {
    // count() is much cheaper than fetching every analytics event
    // when we only need the total number of clicks.
    return await prisma.analyticsEvent.count({
        where: {
            linkId
        }
    });
}

async function getClicksByCountry(linkId) {
    // groupBy lets PostgreSQL calculate the aggregation
    // without loading every event into Node.js memory.
    return await prisma.analyticsEvent.groupBy({
        by: ["country"],
        where: {
            linkId
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

async function getClicksByCity(linkId) {
    return await prisma.analyticsEvent.groupBy({
        by: ["city"],
        where: {
            linkId
        },
        _count: {
            _all: true
        },
        orderBy: {
            _count: {
                city: "desc"
            }
        }
    });
}

async function getClicksByBrowser(linkId) {
    return await prisma.analyticsEvent.groupBy({
        by: ["browser"],
        where: {
            linkId
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

async function getClicksByDevice(linkId) {
    return await prisma.analyticsEvent.groupBy({
        by: ["device"],
        where: {
            linkId
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

async function getClicksByOS(linkId) {
    return await prisma.analyticsEvent.groupBy({
        by: ["os"],
        where: {
            linkId
        },
        _count: {
            _all: true
        },
        orderBy: {
            _count: {
                os: "desc"
            }
        }
    });
}

async function getClicksByReferrer(linkId) {
    return await prisma.analyticsEvent.groupBy({
        by: ["referrer"],
        where: {
            linkId
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

async function getClicksOverTime(linkId, dateFilter = {}) {
    // PostgreSQL performs the grouping so we don't load
    // every analytics event into Node.js memory.
    return await prisma.$queryRaw`
        SELECT
            DATE("occurredAt") AS date,
            COUNT(*)::int AS clicks
        FROM "AnalyticsEvent"
        WHERE "linkId" = ${linkId}
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

module.exports = {
    getAnalyticsEventsByLink,
    countAnalyticsEventsByLink,
    getTotalClicksByLink,
    getClicksByCountry,
    getClicksByCity,
    getClicksByBrowser,
    getClicksByDevice,
    getClicksByOS,
    getClicksByReferrer,
    getClicksOverTime
};