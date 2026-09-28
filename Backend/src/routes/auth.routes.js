const express = require("express");
const authController = require("../controllers/auth.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");
const router = express.Router();


router.get(
    "/me",
    authMiddleware.authMiddleware,
    authController.getCurrentUserController
);
//User Register route
router.post("/register",authController.UserRegisterController);

//User Login Routes
router.post("/login",authController.UserLoginController);

//Refresh Token Route
router.post("/refresh-token",authController.RefreshTokenController);
router.post("/forgot-password",authController.ForgotPasswordController);
router.post("/reset-password",authController.ResetPasswordController);
router.post("/emailverification",authController.EmailVerificationController);
router.post("/Logout",authController.UserLogoutController);

module.exports = router;