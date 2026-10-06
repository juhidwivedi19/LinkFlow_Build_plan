const QRCode = require("qrcode");

// Converts a URL into a PNG image buffer.
async function generateQrCode(url) {
    if (!url || typeof url !== "string" || !url.trim()) {
        throw new Error("URL is required");
    }

    const qrBuffer = await QRCode.toBuffer(url.trim(), {
        type: "png",
        errorCorrectionLevel: "M"
    });

    return qrBuffer;
}

module.exports = {
    generateQrCode
};