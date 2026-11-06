const cloudinary = require('cloudinary').v2;

// Support both CLOUDINARY_URL and discrete environment variables
if (process.env.CLOUDINARY_URL) {
  // Cloudinary automatically picks up CLOUDINARY_URL, but we ensure config is invoked
  cloudinary.config();
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * Checks whether Cloudinary credentials are configured
 * @returns {boolean}
 */
const isConfigured = () => {
  const config = cloudinary.config();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
};

/**
 * Uploads an image buffer directly to Cloudinary using upload_stream
 * @param {Buffer} buffer - Raw file buffer from Multer
 * @param {string} folder - Target Cloudinary folder (default: 'animeverse/pulses')
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadImageBuffer = (buffer, folder = 'animeverse/pulses') => {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      return reject(new Error('Cloudinary credentials are not configured. Please set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'));
    }

    if (!buffer || !Buffer.isBuffer(buffer)) {
      return reject(new Error('Invalid image buffer provided for upload.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload_stream error:', error);
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Deletes an image from Cloudinary by its public ID
 * @param {string} publicId - The Cloudinary asset public ID
 * @returns {Promise<void>}
 */
const deleteImageByPublicId = async (publicId) => {
  if (!publicId) return;
  if (!isConfigured()) {
    console.warn('Cloudinary not configured, skipping deletion of asset:', publicId);
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error('Failed to delete Cloudinary asset:', err.message);
  }
};

/**
 * Scans an HTML string for embedded Cloudinary image URLs and extracts their public IDs
 * Matches patterns like:
 *   https://res.cloudinary.com/<cloud>/image/upload/.../animeverse/pulses/<id>.(jpg|png|webp)
 * @param {string} html
 * @returns {Set<string>} - Set of unique public IDs (e.g. 'animeverse/pulses/abc123')
 */
const extractCloudinaryPublicIds = (html) => {
  if (!html || typeof html !== 'string') return new Set();
  const publicIds = new Set();
  // Match Cloudinary images stored in animeverse/pulses/
  const regex = /res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:[a-zA-Z0-9_,-]+\/)*(?:v\d+\/)?(animeverse\/pulses\/[a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      publicIds.add(match[1]);
    }
  }
  return publicIds;
};

/**
 * Deletes multiple images from Cloudinary concurrently
 * @param {Array<string>|Set<string>} publicIds
 * @returns {Promise<Array>}
 */
const deleteMultipleImages = async (publicIds) => {
  if (!publicIds) return [];
  const ids = Array.isArray(publicIds) ? publicIds : Array.from(publicIds);
  const validIds = ids.filter(Boolean);
  if (validIds.length === 0) return [];

  return Promise.allSettled(validIds.map(id => deleteImageByPublicId(id)));
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadImageBuffer,
  deleteImageByPublicId,
  extractCloudinaryPublicIds,
  deleteMultipleImages
};
