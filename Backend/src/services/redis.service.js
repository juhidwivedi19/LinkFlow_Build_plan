const redis = require("../config/redis.config.js");

//GET A VALUE FROM REDIS
async function getRedis(key) {
    return await redis.get(key);
}

//store a value in redis
async function setRedis(key,CSSMathValue,expiryInSeconds) {
    if(expiryInSeconds) {
        return await redis.set(key,CSSMathValue, "EX", expiryInSeconds);
    }

    return await redis.set(key, value);
}

//DELETE A VALUE FROM REDIS
async function deleteRedis(key) {
    return await redis.del(key);
}

module.exports = {
    getRedis,
    setRedis,
    deleteRedis
};