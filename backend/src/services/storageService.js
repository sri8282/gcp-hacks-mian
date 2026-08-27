const { Storage } = require('@google-cloud/storage');

const storage = new Storage();
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'hirehub-resumes-hrie-506616';

/**
 * Generates a V4 signed URL for uploading a resume directly to GCS via PUT method.
 * @param {string} fileName - Sanitized unique filename
 * @param {string} contentType - Content-Type header of the file (e.g. application/pdf)
 * @returns {Promise<{ uploadUrl: string, filePath: string }>}
 */
async function generateUploadUrl(fileName, contentType = 'application/pdf') {
  const bucket = storage.bucket(BUCKET_NAME);
  const gcsPath = `resumes/${fileName}`;
  const file = bucket.file(gcsPath);

  const options = {
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // Valid for 15 minutes
    contentType: contentType,
  };

  const [uploadUrl] = await file.getSignedUrl(options);
  const filePath = `https://storage.googleapis.com/${BUCKET_NAME}/${gcsPath}`;

  return { uploadUrl, filePath };
}

module.exports = {
  generateUploadUrl,
};
