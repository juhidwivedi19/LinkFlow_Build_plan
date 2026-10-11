
const redis = require("../config/redis.config");

function rateLimit({
  limit = 100,
  windowSeconds = 60,
  keyPrefix = "rate-limit",
} = {}) {
  return async function (req, res, next) {
    try {
         const identifier = req.apiKey?.id 
         ? `api-key:${req.apiKey.id}` 
         : req.user?.id 
         ? `user:${req.user.id}` 
         : `ip:${req.ip}`;
     
  const key = `${keyPrefix}:${identifier}`;

 const results = await redis
  .multi()
  .incr(key)
  .expire(key, windowSeconds, "NX")
  .ttl(key)
  .exec();

// If the transaction failed or returned an unexpected result, fail open.
if (
  !results ||
  results.length !== 3 ||
  results.some(([error]) => error)
) {
  console.error("Rate limiter Redis transaction failed");
  return next();
}

const currentCount = results[0][1];
const remainingSeconds = results[2][1];

if (
  typeof currentCount !== "number" ||
  typeof remainingSeconds !== "number"
) {
  console.error("Rate limiter returned invalid results");
  return next();
}
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, limit - currentCount)
      );

      res.setHeader(
  "X-RateLimit-Reset",
  Math.floor(Date.now() / 1000) + Math.max(0, remainingSeconds)
);

     if (currentCount > limit) { if (remainingSeconds > 0)
         { res.setHeader("Retry-After", remainingSeconds); 

         } return res.status(429).json({ success: false, message: "Too many requests. Please try again later.", }); }

      return next();
    } catch (error) {
  console.error("Rate limiter Redis error:", error.message);
  return next();
}
  };
}

module.exports = rateLimit;
