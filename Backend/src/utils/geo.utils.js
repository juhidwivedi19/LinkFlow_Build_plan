const geoip = require("geoip-lite");

function getLocation(ipAddress) {
    if (!ipAddress) {
        return {
            country: "unknown",
            city: "unknown"
        };
    }

    const normalizedIp = ipAddress.replace("::ffff:", "");
    const location = geoip.lookup(normalizedIp);

    if (!location) {
        return {
            country: "unknown",
            city: "unknown"
        };
    }

    return {
        country: location.country || "unknown",
        city: location.city || "unknown"
    };
}

module.exports = {
    getLocation
};