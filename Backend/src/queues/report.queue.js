const { Queue } = require("bullmq");
const redis = require("../config/redis.config.js");

const reportQueue = new Queue("report-generation", {
  connection: redis,
});

module.exports = reportQueue;