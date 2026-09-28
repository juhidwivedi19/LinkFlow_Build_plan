const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const emailService = require("../services/email.service")
const prisma = require("../config/db.config.js");


//UserregisterController

async function UserRegisterController(req, res) {
    try {

        const { email, password, name } = req.body;

        // Check if user already exists

        const isExists = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (isExists) {
            return res.status(422).json({
                message: "User already exists with this email.",
                status: "failed"
            });
        }

        // Hash Password

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User

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

        // Send Registration Email

        await emailService.sendRegistrationEmail(
            user.email,
            user.name
        );

        // Send Response

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

async function UserLoginController(req, res) {
    try {

        const { email, password } = req.body;

        // Find User

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(401).json({
                message: "Email or Password is Invalid",
                status: "failed"
            });
        }

        // Compare Password

        const isValidPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Email or Password is Invalid",
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

        // Send Response

        return res.status(200).json({
            message: "Login successful",
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

module.exports={
    UserRegisterController,
    UserLoginController
}