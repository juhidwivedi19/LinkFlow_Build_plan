
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

// Verify Gmail connection
async function verifyEmailConnection() {
    try {
        await transporter.verify();
        console.log("Gmail SMTP authentication successful");
        return true;
    } catch (error) {
        console.error("Gmail SMTP authentication failed:", error.message);
        return false;
    }
}

// Common email sender
async function sendEmail({ to, subject, text, html }) {
    if (!to || typeof to !== "string") {
        throw new Error("A valid recipient email address is required.");
    }

    if (!process.env.EMAIL_USER) {
        throw new Error("EMAIL_USER is missing from the environment.");
    }

    try {
        console.log("Sending email:", {
            from: process.env.EMAIL_USER,
            to,
            subject,
        });

        const info = await transporter.sendMail({
            from: `"LinkFlow" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log("Email sent successfully:", {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
        });

        if (!info.accepted || info.accepted.length === 0) {
            throw new Error("The email server did not accept the recipient.");
        }

        return info;
    } catch (error) {
        console.error("Email sending failed:", {
            code: error.code,
            responseCode: error.responseCode,
            message: error.message,
        });

        throw error;
    }
}

// Registration welcome email
async function sendRegistrationEmail(email, name) {
    return sendEmail({
        to: email,
        subject: "Welcome to LinkFlow",
        text: `Hello ${name},

Welcome to LinkFlow! Your account has been created successfully.

If email verification is required, please verify your email before logging in.

Thank you,
The LinkFlow Team`,
    });
}

// Email verification
async function sendVerificationEmail(email, name, verificationUrl) {
    if (!verificationUrl) {
        throw new Error("The email verification URL is missing.");
    }

    return sendEmail({
        to: email,
        subject: "Verify Your LinkFlow Email",
        text: `Hello ${name},

Please verify your email address by opening the following link:

${verificationUrl}

This link expires in 15 minutes.

If you did not create a LinkFlow account, you can ignore this email.

Thank you,
The LinkFlow Team`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Verify your LinkFlow email</h2>
                <p>Hello ${escapeHtml(name)},</p>
                <p>Please click the button below to verify your email address.</p>
                <p>
                    <a
                        href="${escapeHtml(verificationUrl)}"
                        style="
                            display: inline-block;
                            padding: 12px 20px;
                            background: #635bff;
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 6px;
                        "
                    >
                        Verify Email
                    </a>
                </p>
                <p>This link expires in 15 minutes.</p>
                <p>If you did not create a LinkFlow account, you can ignore this email.</p>
                <p>Thank you,<br>The LinkFlow Team</p>
            </div>
        `,
    });
}

// Password-reset email
async function sendPasswordResetEmail(email, name, resetUrl) {
    if (!resetUrl) {
        throw new Error("The password-reset URL is missing.");
    }

    return sendEmail({
        to: email,
        subject: "Reset Your LinkFlow Password",
        text: `Hello ${name},

We received a request to reset your LinkFlow password.

Open this link to reset your password:

${resetUrl}

If you did not request a password reset, you can ignore this email.

Thank you,
The LinkFlow Team`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Reset your LinkFlow password</h2>
                <p>Hello ${escapeHtml(name)},</p>
                <p>We received a request to reset your password.</p>
                <p>
                    <a
                        href="${escapeHtml(resetUrl)}"
                        style="
                            display: inline-block;
                            padding: 12px 20px;
                            background: #635bff;
                            color: #ffffff;
                            text-decoration: none;
                            border-radius: 6px;
                        "
                    >
                        Reset Password
                    </a>
                </p>
                <p>If you did not request this, you can ignore this email.</p>
                <p>Thank you,<br>The LinkFlow Team</p>
            </div>
        `,
    });
}

// Escape values inserted into HTML
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };

        return entities[character];
    });
}

module.exports = {
    transporter,
    verifyEmailConnection,
    sendEmail,
    sendRegistrationEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
};
