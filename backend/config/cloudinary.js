const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Warning: Missing Cloudinary config: ${missing.join(', ')}`);
    return false;
  }

  return true;
};

// Upload image to Cloudinary
const uploadImage = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'whatsapp-automation',
      resource_type: 'auto',
      transformation: options.transformation || [],
      ...options
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

// Upload video to Cloudinary
const uploadVideo = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'whatsapp-automation/videos',
      resource_type: 'video',
      ...options
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      duration: result.duration,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    throw new Error('Failed to upload video to Cloudinary');
  }
};

// Upload audio to Cloudinary
const uploadAudio = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'whatsapp-automation/audio',
      resource_type: 'video', // Cloudinary treats audio as video
      ...options
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      duration: result.duration,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary audio upload error:', error);
    throw new Error('Failed to upload audio to Cloudinary');
  }
};

// Upload document to Cloudinary
const uploadDocument = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'whatsapp-automation/documents',
      resource_type: 'raw',
      ...options
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary document upload error:', error);
    throw new Error('Failed to upload document to Cloudinary');
  }
};

// Delete file from Cloudinary
const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
};

// Get optimized image URL
const getOptimizedImageUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      ...(options.transformation || [])
    ],
    ...options
  });
};

// Generate thumbnail
const generateThumbnail = (publicId, width = 200, height = 200) => {
  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
};

// Multer storage configuration for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'whatsapp-automation';
    let resourceType = 'auto';

    // Determine folder and resource type based on file mimetype
    if (file.mimetype.startsWith('image/')) {
      folder = 'whatsapp-automation/images';
      resourceType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'whatsapp-automation/videos';
      resourceType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      folder = 'whatsapp-automation/audio';
      resourceType = 'video';
    } else {
      folder = 'whatsapp-automation/documents';
      resourceType = 'raw';
    }

    return {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'mp3', 'doc', 'docx', 'xls', 'xlsx'],
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
    };
  }
});

// Create multer upload instance with Cloudinary storage
const cloudinaryUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'video/mp4', 'video/mpeg',
      'audio/mpeg', 'audio/mp3', 'audio/ogg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, audio, and documents are allowed.'));
    }
  }
});

module.exports = {
  cloudinary,
  validateCloudinaryConfig,
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadDocument,
  deleteFile,
  getOptimizedImageUrl,
  generateThumbnail,
  cloudinaryUpload
};