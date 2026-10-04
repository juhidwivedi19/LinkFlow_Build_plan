function getDevice(userAgent) {
    if (!userAgent) return "unknown";

    if (/mobile/i.test(userAgent)) {
        return "mobile";
    }

    if (/tablet|ipad/i.test(userAgent)) {
        return "tablet";
    }

    return "desktop";
}

function getBrowser(userAgent) {
    if (!userAgent) return "unknown";

    if (/edg/i.test(userAgent)) return "Edge";
    if (/chrome/i.test(userAgent)) return "Chrome";
    if (/firefox/i.test(userAgent)) return "Firefox";
    if (/safari/i.test(userAgent)) return "Safari";
    if (/opr|opera/i.test(userAgent)) return "Opera";

    return "unknown";
}

function getOS(userAgent) {
    if (!userAgent) return "unknown";

    if (/windows/i.test(userAgent)) return "Windows";
    if (/android/i.test(userAgent)) return "Android";
    if (/iphone|ipad|ios/i.test(userAgent)) return "iOS";
    if (/mac os/i.test(userAgent)) return "macOS";
    if (/linux/i.test(userAgent)) return "Linux";

    return "unknown";
}

module.exports = {
    getDevice,
    getBrowser,
    getOS
};