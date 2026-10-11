const express = require("express");
const authController = require("../controllers/auth.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
const router = express.Router();

const rateLimit = require("../middlewares/rateLimit.middleware.js");
router.get(
    "/me",
    authMiddleware.authMiddleware,
    authController.getCurrentUserController
);

// User Register route
router.post(
  "/register",
  rateLimit({ limit: 5, windowSeconds: 60 }),
  authController.UserRegisterController
);

// User Login route
router.post(
  "/login",
  rateLimit({ limit: 5, windowSeconds: 60 }),
  authController.UserLoginController
);

// Forgot Password route
router.post(
  "/forgot-password",
  rateLimit({ limit: 3, windowSeconds: 60 }),
  authController.ForgotPasswordController
);


//Refresh Token Route

router.post(
  "/refresh-token",
  rateLimit({ limit: 10, windowSeconds: 60 }),
  authController.RefreshTokenController
);


//Reset password
router.post(
    "/reset-password",
    rateLimit({ limit:5, windowSeconds:60}),
    authController.ResetPasswordController
)

//Email verification
router.post(
  "/emailverification",
  rateLimit({ limit: 5, windowSeconds: 60 }),
  authController.EmailVerificationController
);


router.post(
  "/Logout",
  rateLimit({
    limit: 10,
    windowSeconds: 60,
    keyPrefix: "rate-limit:logout",
  }),
  authController.UserLogoutController
);


module.exports = router;