const {
    getTotalClicksByWorkspace,
    getDailyClicksByWorkspace,
    getWeeklyClicksByWorkspace,
    getMonthlyClicksByWorkspace,
    getTopLinksByWorkspace,
    getClicksByCountryByWorkspace,
    getClicksByBrowserByWorkspace,
    getClicksByDeviceByWorkspace,
    getClicksByReferrerByWorkspace
} = require("../repositories/dashboard.repository.js");

const {
    getRedis,
    setRedis
} = require("./redis.service.js");

async function getWorkspaceDashboard(
    workspaceId,
    from,
    to
) {
    const occurredAt = {};

    if (from) {
        const fromDate = new Date(from);

        if (isNaN(fromDate.getTime())) {
            throw new Error("Invalid from date");
        }

        fromDate.setHours(0, 0, 0, 0);
        occurredAt.gte = fromDate;
    }

    if (to) {
        const toDate = new Date(to);

        if (isNaN(toDate.getTime())) {
            throw new Error("Invalid to date");
        }

        toDate.setHours(23, 59, 59, 999);
        occurredAt.lte = toDate;
    }

    if (
        occurredAt.gte &&
        occurredAt.lte &&
        occurredAt.gte > occurredAt.lte
    ) {
        throw new Error("Invalid date range");
    }

    /*
     * The date range is part of the cache key.
     * Otherwise a cached result for one date range could
     * accidentally be returned for another date range.
     */
    const normalizedFrom = from || "all";
const normalizedTo = to || "all";

const cacheKey =
    `dashboard:${workspaceId}:${normalizedFrom}:${normalizedTo}`;
    // Redis failure should never break the dashboard.
    let cachedDashboard = null;

    try {
        cachedDashboard = await getRedis(cacheKey);
    } catch (error) {
        console.error("Dashboard Redis GET error:", error);
    }

    if (cachedDashboard) {
        // Cache hit — avoid running the expensive aggregation queries.
        return JSON.parse(cachedDashboard);
    }

    const dateFilter = Object.keys(occurredAt).length > 0
        ? { occurredAt }
        : {};

    // Cache miss — calculate the dashboard from PostgreSQL.
    const [
        totalClicks,
        dailyClicks,
        weeklyClicks,
        monthlyClicks,
        topLinks,
        countries,
        browsers,
        devices,
        referrers
    ] = await Promise.all([
        getTotalClicksByWorkspace(workspaceId, dateFilter),
        getDailyClicksByWorkspace(workspaceId, dateFilter),
        getWeeklyClicksByWorkspace(workspaceId, dateFilter),
        getMonthlyClicksByWorkspace(workspaceId, dateFilter),
        getTopLinksByWorkspace(workspaceId, dateFilter),
        getClicksByCountryByWorkspace(workspaceId, dateFilter),
        getClicksByBrowserByWorkspace(workspaceId, dateFilter),
        getClicksByDeviceByWorkspace(workspaceId, dateFilter),
        getClicksByReferrerByWorkspace(workspaceId, dateFilter)
    ]);

    const dashboard = {
        totalClicks,

        dailyClicks,
        weeklyClicks,
        monthlyClicks,

        topLinks,

        breakdown: {
            countries,
            browsers,
            devices,
            referrers
        }
    };

    /*
     * Cache the complete dashboard for 60 seconds.
     * A short TTL keeps the dashboard reasonably fresh
     * while reducing repeated PostgreSQL aggregation work.
     */
    try {
        await setRedis(
            cacheKey,
            JSON.stringify(dashboard),
            60
        );
    } catch (error) {
        console.error("Dashboard Redis SET error:", error);
    }

    return dashboard;
}

module.exports = {
    getWorkspaceDashboard
};
