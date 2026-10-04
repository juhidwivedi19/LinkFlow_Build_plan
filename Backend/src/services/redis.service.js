const redis = require("../config/redis.config.js");

async function getRedis(key) {
    return await redis.get(key);
}

async function setRedis(key, value, expiryInSeconds) {
    if (expiryInSeconds) {
        return await redis.set(key, value, "EX", expiryInSeconds);
    }

    return await redis.set(key, value);
}

async function deleteRedis(key) {
    return await redis.del(key);
}

async function deleteDashboardCache(workspaceId) {
    // Dashboard cache contains different keys for different
    // date ranges, so we remove every dashboard cache entry
    // belonging to this workspace.
    const keys = await redis.keys(`dashboard:${workspaceId}:*`);

    if (keys.length > 0) {
        await redis.del(...keys);
    }
}

module.exports = {
    getRedis,
    setRedis,
    deleteRedis,
    deleteDashboardCache
};