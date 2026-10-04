const geoip = require("geoip-lite");

function getCountry(ipAddress) {
    if (!ipAddress) {
        return "unknown";
    }

    // Handle IPv4-mapped IPv6 addresses
    const normalizedIp = ipAddress.replace("::ffff:", "");

    const location = geoip.lookup(normalizedIp);

    if (!location || !location.country) {
        return "unknown";
    }

    return location.country;
}

module.exports = {
    getCountry
};