const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const emailService = require("../services/email.service.js");

const prisma = require("../config/db.config.js");

// User Register Controller
async function UserRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;

        const isExists = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (isExists) {
            return res.status(400).json({
                message: "User already exists",
                status: "failed"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                name: name
            }
        });

        // Generate Access Token
        const token = jwt.sign(
            {
                userId: user.id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // Generate Refresh Token
        const refreshToken = jwt.sign(
            {
                userId: user.id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Save refresh token in DB
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000
                )
            }
        });

        // Store access token in cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000
        });

        // Store refresh token in cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Send registration email
        await emailService.sendRegistrationEmail(
            user.email,
            user.name
        );

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: "failed"
        });
    }
}


//User Login Controller
async function UserLoginController(req,res){
    try{
        const {email,password} = req.body;

        const user = await prisma.user.findUnique({
            where: {
                email:email
            }
        });

        if(!user){
            return res.status(401).json({
                message: "Invalid email or password",
                status: "failed"
            });
        }

        const isValidPassword = await bcrypt.compare(
            password,
            user.password
        );
        if (!isValidPassword) {
            return res.status(401).json({
                message: "Invalid email or password",
                status: "failed"
            });
        }

         // Generate Access Token

        const token = jwt.sign(
            {
                userId: user.id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // Generate Refresh Token

        const refreshToken = jwt.sign(
            {
                userId: user.id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // Save Refresh Token in Database

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000
                )
            }
        });

        // Store Access Token in Cookie

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000
        });

        // Store Refresh Token in Cookie

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
    return res.status(200).json({
       message: "Login successful",
       user:{
        id: user.id,
        email:user.email,
        name:user.name
       }
    });
    }catch(error){
        return res.status(500).json({
            message: error.message,
            status:"failed"
        });
    }
}


//Refresh token Controller
async function RefreshTokenController(req,res){
    try{

     const refreshToken = req.cookies.refreshToken;

     if(!refreshToken) {
        return res.status(401).json({
            message: "Refresh token is required",
            status: "failed"
        });
     }

     const decoded = jwt.verify(
     refreshToken,
     process.env.JWT_REFRESH_SECRET
     );

     const storedRefreshToken = await prisma.refreshToken.findFirst({
        where: {
            token: refreshToken
        }
     });

     if(!storedRefreshToken) {
        return res.status(401).json({
            message: "Invalid refresh token",
            status: "failed"
        });
     }
     
     if(storedRefreshToken.expiresAt < new Date()){
         await prisma.refreshToken.delete({
            where:{
                id: storedRefreshToken.id
            }
         });

         return res.status(401).json({
            message: "Refresh token has expired",
            status: "failed"
         });
     }

     const user = await prisma.user.findUnique({
        where:{
            id:decoded.userId
        }
     });


     
        // Generate new access token

        const newAccessToken = jwt.sign(
            {
                userId: user.id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );


        // Store new access token in cookie

        res.cookie("token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000
        });


       


        return res.status(200).json({
            message:"Token refreshed successfully",
            token: newAccessToken,
            status:"success"
        })
    }catch (error) {

        return res.status(401).json({
            message: "Invalid or expired refresh token",
            status: "failed"
        });

    }
}

async function ForgotPasswordController(req, res) {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
                status: "failed"
            });
        }

        // Find User

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: "failed"
            });
        }


        const resetToken = crypto
            .randomBytes(32)
            .toString("hex");

        const resetPasswordExpires = new Date(
            Date.now() + 15 * 60 * 1000
        );

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetPasswordExpires
            }
        });

        // Send Reset Password Email

        await emailService.sendPasswordResetEmail(
            user.email,
            resetToken
        );

        return res.status(200).json({
            message: "Password reset link sent successfully",
            status: "success"
        });

    } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
        message: error.message,
        status: "failed"
    });
}
}

async function ResetPasswordController(req, res) {
    try {

        const { resetToken, newPassword } = req.body;


        // Check Required Fields

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                message: "Reset token and new password are required",
                status: "failed"
            });
        }


        // Find User Using Reset Token

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: resetToken
            }
        });


        if (!user) {
            return res.status(400).json({
                message: "Invalid reset token",
                status: "failed"
            });
        }


        // Check Reset Token Expiry

        if (
            !user.resetPasswordExpires ||
            user.resetPasswordExpires < new Date()
        ) {

            return res.status(400).json({
                message: "Reset token has expired",
                status: "failed"
            });
        }


        // Hash New Password

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );


        // Update Password

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: hashedPassword,

                // Remove Reset Token After Password Reset

                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        });


        // Send Response

        return res.status(200).json({
            message: "Password reset successfully",
            status: "success"
        });


    } catch (error) {

        return res.status(500).json({
            message: "Something went wrong",
            status: "failed"
        });

    }
}

async function EmailVerificationController(req, res) {
    try {

        const { email, verificationToken } = req.body;


        // STEP 1: SEND VERIFICATION EMAIL

        if (!verificationToken) {

            // Check Email

            if (!email) {
                return res.status(400).json({
                    message: "Email is required",
                    status: "failed"
                });
            }

            const user = await prisma.user.findUnique({
                where: {
                    email: email
                }
            });


            if (!user) {
                return res.status(404).json({
                    message: "User not found",
                    status: "failed"
                });
            }

            if (user.emailVerified) {
                return res.status(400).json({
                    message: "Email is already verified",
                    status: "failed"
                });
            }


            // Generate Verification Token

            const emailVerificationToken =
                crypto.randomBytes(32).toString("hex");


            // Token Expiry - 15 Minutes

            const emailVerificationExpires = new Date(
                Date.now() + 15 * 60 * 1000
            );


            // Save Token in Database

            await prisma.user.update({
                where: {
                    id: user.id
                },
                data: {
                    emailVerificationToken: emailVerificationToken,
                    emailVerificationExpires: emailVerificationExpires
                }
            });

            await emailService.sendVerificationEmail(
                user.email,
                user.name,
                emailVerificationToken
            );


            return res.status(200).json({
                message: "Verification email sent successfully",
                status: "success"
            });
        }


        // STEP 2: VERIFY EMAIL

        const user = await prisma.user.findFirst({
            where: {
                emailVerificationToken: verificationToken
            }
        });


        // Check Token

        if (!user) {
            return res.status(400).json({
                message: "Invalid verification token",
                status: "failed"
            });
        }

        if (
            !user.emailVerificationExpires ||
            user.emailVerificationExpires < new Date()
        ) {

            return res.status(400).json({
                message: "Verification token has expired",
                status: "failed"
            });
        }


        // Verify Email

        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                emailVerified: true,

                emailVerificationToken: null,
                emailVerificationExpires: null
            }
        });


        return res.status(200).json({
            message: "Email verified successfully",
            status: "success"
        });


    } catch (error) {

        return res.status(500).json({
            message: "Something went wrong",
            status: "failed"
        });

    }
}

async function UserLogoutController(req, res) {
    try {

        // Get Refresh Token

        const refreshToken = req.cookies.refreshToken;


        // Delete Refresh Token from Database

        if (refreshToken) {

            await prisma.refreshToken.deleteMany({
                where: {
                    token: refreshToken
                }
            });

        }


        // Clear Access Token Cookie

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        return res.status(200).json({
            message: "User logged out successfully",
            status: "success"
        });


    } catch (error) {

        return res.status(500).json({
            message: "Something went wrong",
            status: "failed"
        });

    }
}

//frontend know about cookies relaated to login
async function getCurrentUserController(req, res) {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: "failed"
            });
        }

        return res.status(200).json({
            message: "Current user fetched successfully",
            status: "success",
            user
        });

    } catch (error) {
        console.error("Error fetching current user:", error);

        return res.status(500).json({
            message: "Internal server error",
            status: "failed"
        });
    }
}

module.exports = {
    UserRegisterController,
    UserLoginController,
    RefreshTokenController,
    ForgotPasswordController,
    ResetPasswordController,
    EmailVerificationController,
    UserLogoutController,
    getCurrentUserController
};