const dotenv = require("dotenv");
dotenv.config();

const {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = require("../config/storage.config.js");


async function uploadFile(buffer, key, contentType) {
    if (!buffer) {
        throw new Error("File buffer is required");
    }

    if (!key) {
        throw new Error("Storage key is required");
    }

    if (!contentType) {
        throw new Error("Content type is required");
    }

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType
    });

    await s3Client.send(command);

    return {
        key
    };
}


async function deleteFile(key) {
    if (!key) {
        throw new Error("Storage key is required");
    }

    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key
    });

    await s3Client.send(command);

    return true;
}


// Generates a temporary URL for downloading a private S3 object.
async function getDownloadUrl(key) {
    if (!key) {
        throw new Error("Storage key is required");
    }

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key
    });

    // URL remains valid for 15 minutes.
    const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 900
    });

    return signedUrl;
}


module.exports = {
    uploadFile,
    deleteFile,
    getDownloadUrl
};