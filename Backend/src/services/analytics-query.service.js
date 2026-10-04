const {
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
} = require("../repositories/analytics.repository.js");

async function getLinkAnalytics(linkId, page = 1, limit = 50,from,to) {
    
    // Keep pagination values safe so clients cannot request huge datasets.
    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(Math.max(Number(limit) || 50, 1), 100);

    const skip = (page - 1) * limit;


    // Build the time filter only when the client provides dates.
    const occurredAt = {};

   if (from) {
    const fromDate = new Date(from);

    if (isNaN(fromDate.getTime())) {
        throw new Error("Invalid from date");
    }

    // Start of the requested day.
    fromDate.setHours(0, 0, 0, 0);

    occurredAt.gte = fromDate;
}

if (to) {
    const toDate = new Date(to);

    if (isNaN(toDate.getTime())) {
        throw new Error("Invalid to date");
    }

    // Include the complete 'to' day.
    toDate.setHours(23, 59, 59, 999);

    occurredAt.lte = toDate;
}

// Prevent an invalid range such as from=Oct 10 and to=Oct 5.
if (
    occurredAt.gte &&
    occurredAt.lte &&
    occurredAt.gte > occurredAt.lte
) {
    throw new Error("Invalid date range");
}

const dateFilter = Object.keys(occurredAt).length > 0
    ? { occurredAt }
    : {};
    

    const [events, total,totalClicks,
        byCountry,
        byCity,
        byBrowser,
        byDevice,
        byOS,
        byReferrer,
         overTime    ] = await Promise.all([
        getAnalyticsEventsByLink(linkId, skip, limit, dateFilter),
    countAnalyticsEventsByLink(linkId, dateFilter),
    getTotalClicksByLink(linkId, dateFilter),
    getClicksByCountry(linkId, dateFilter),
    getClicksByCity(linkId, dateFilter),
    getClicksByBrowser(linkId, dateFilter),
    getClicksByDevice(linkId, dateFilter),
    getClicksByOS(linkId, dateFilter),
    getClicksByReferrer(linkId, dateFilter),
    getClicksOverTime(linkId, dateFilter)
    ]);

    return {
        totalClicks,

        breakdown:{
            country: byCountry,
            city: byCity,
            browser: byBrowser,
            device: byDevice,
            os: byOS,
            referer: byReferer
        },
        overTime,
        events,

        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

module.exports = {
    getLinkAnalytics
};