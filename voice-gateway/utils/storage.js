const AWS = require('aws-sdk');

/**
 * Cloudflare R2 Storage Utility
 * Requirement 68: Store user audio in S3-compatible storage
 */
const s3 = new AWS.S3({
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
});

/**
 * Upload audio buffer to R2
 * @param {Buffer} buffer - Audio file buffer
 * @param {string} filename - Destination filename
 */
async function uploadAudio(buffer, filename) {
    const params = {
        Bucket: process.env.R2_BUCKET_NAME || 'survey-log',
        Key: `recordings/${filename}`,
        Body: buffer,
        ContentType: 'audio/wav',
        // Requirement 9.2: Metadata for 90-day retention
        Metadata: {
            'retention-days': '90',
            'uploaded-at': new Date().toISOString()
        }
    };

    return s3.upload(params).promise();
}

module.exports = { uploadAudio };
