const express = require("express");

const {
    redirectController,
    verifyLinkPasswordController
} = require("../controllers/redirect.controller.js");

const router = express.Router();

router.get("/:slug", redirectController);
// Public endpoint used to verify the password of a protected link
router.post(
    "/:slug/verify-password",
    verifyLinkPasswordController
);
module.exports = router;