// this utility has two responsibility:
  /*
Generate: Create a cryptographically secure random API key and return both the complete key and its prefix.
Hash: Accept a plaintext API key and return its SHA-256 hash.  */

const crypto = require("crypto");

function generateApiKey(){
    const secret = crypto.randomBytes(32).toString("hex");
    const apiKey = `lf_live_${secret}`;
    const Prefix = apiKey.slice(0,16);

    return {apiKey, keyPrefix};

}

function hashApiKey(apiKey){
    return crypto.createHash("sha256").update(apiKey).digest("hex");
}

module.exports = {
    generateApiKey,
    hashApiKey
}