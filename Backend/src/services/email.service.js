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

async function sendRegistrationEmail(email, name) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Welcome to ATS Project",
        text: `Hello ${name}, your account has been successfully created.`
    });
}

async function sendVerificationEmail(email, name, verificationToken) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Your Email",
        text: `Hello ${name}, your email verification token is: ${verificationToken}`
    });
}

//for forgot password
async function sendPasswordResetEmail(email, name, resetToken) {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset Your Password",
        text: `Hello ${name}, your password reset token is: ${resetToken}`
    });
}



module.exports = {
    sendRegistrationEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
   
};

