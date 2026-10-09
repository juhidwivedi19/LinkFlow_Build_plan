const dns = require("dns").promises;

// Check whether the expected verification token exists
// in the domain's TXT records.
async function verifyDomainOwnership(domain, verificationToken) {
    const verificationDomain =
        `_linkflow-verification.${domain}`;

    try {
        const records = await dns.resolveTxt(verificationDomain);

        // DNS TXT records are returned as arrays of strings.
        const txtValues = records.flat();

        return txtValues.includes(verificationToken);
    } catch (error) {
        // DNS lookup can fail when the TXT record does not exist
        // or has not propagated yet.
        return false;
    }
}

module.exports = {
    verifyDomainOwnership
};