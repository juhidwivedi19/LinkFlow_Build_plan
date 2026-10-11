
const redis = require("../config/redis.config");

function rateLimit({
  limit = 100,
  windowSeconds = 60,
  keyPrefix = "rate-limit",
} = {}) {
  return async function (req, res, next) {
    try {
     const identifier = req.user?.id
  ? `user:${req.user.id}`
  : `ip:${req.ip}`;
     
  const key = `${keyPrefix}:${identifier}`;

 const results = await redis
  .multi()
  .incr(key)
  .expire(key, windowSeconds, "NX")
  .ttl(key)
  .exec();

const currentCount = results[0][1];
const remainingSeconds = results[2][1];
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, limit - currentCount)
      );

      res.setHeader(
  "X-RateLimit-Reset",
  Math.floor(Date.now() / 1000) + Math.max(0, remainingSeconds)
);

      if (currentCount > limit) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
        });
      }

      next();
    } catch (error) {
  console.error("Rate limiter Redis error:", error.message);
  return next();
}
  };
}

module.exports = rateLimit;
