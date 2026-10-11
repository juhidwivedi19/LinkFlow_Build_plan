
const express = require("express");

const {
  redirectController,
  verifyLinkPasswordController,
} = require("../controllers/redirect.controller.js");

const rateLimit = require("../middlewares/rateLimit.middleware.js");

const router = express.Router();

// Public short-link redirect
router.get(
  "/:slug",
  rateLimit({
    limit: 60,
    windowSeconds: 60,
    keyPrefix: "rate-limit:redirect",
  }),
  redirectController
);

// Public endpoint used to verify the password of a protected link
router.post(
  "/:slug/verify-password",
  rateLimit({
    limit: 5,
    windowSeconds: 60,
    keyPrefix: "rate-limit:redirect:password",
  }),
  verifyLinkPasswordController
);

module.exports = router;
