const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  // Add additional configurations for better reliability
  secure: true,
  connection_timeout: 600000, // 10 minutes
  socket_timeout: 600000, // 10 minutes
});


const uploadImage = async (fileInput, folder = 'job-images', fileName = null, retryCount = 0) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: 'image',
        folder: folder,
        transformation: [
          { width: 1200, height: 800, crop: 'fill' },
          { quality: 'auto:low' }, // Reduce quality for faster upload
          { format: 'jpeg' }
        ],
        timeout: 600000, // Increased to 10 minutes timeout
        chunk_size: 3000000, // Reduced chunk size for better reliability
        eager_async: true, // Process transformations asynchronously
        overwrite: true,
        invalidate: true
      };

      if (fileName) {
        uploadOptions.public_id = fileName;
      }

      // Handle both Buffer and file path inputs
      if (Buffer.isBuffer(fileInput)) {
        // Check file size and use appropriate method
        const fileSizeInMB = fileInput.length / (1024 * 1024);
        console.log(`Image size: ${fileSizeInMB.toFixed(2)}MB`);
        
        if (fileSizeInMB > 5) {
          // For large files, use chunked upload
          console.log('Using chunked upload for large image');
          uploadOptions.chunk_size = 2000000; // Even smaller chunks for images
        }
        
        // Upload from buffer
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary image upload error:', error);
              // Check for timeout and retry
              if ((error.name === 'TimeoutError' || error.http_code === 499 || error.message?.includes('timeout')) && retryCount < 3) {
                console.log(`Retrying image upload... (attempt ${retryCount + 1}/3)`);
                setTimeout(async () => {
                  try {
                    const retryResult = await uploadImage(fileInput, folder, fileName, retryCount + 1);
                    resolve(retryResult);
                  } catch (retryError) {
                    reject(retryError);
                  }
                }, 3000 * (retryCount + 1)); // Exponential backoff with longer delay
              } else {
                reject(error);
              }
            } else {
              console.log('Image upload successful:', result.public_id);
              resolve(result);
            }
          }
        );
        
        uploadStream.end(fileInput);
      } else {
        // Upload from file path
        cloudinary.uploader.upload(fileInput, uploadOptions, (error, result) => {
          if (error) {
            console.error('Cloudinary image upload error:', error);
            
            // Check for timeout and retry for file uploads too
            if ((error.name === 'TimeoutError' || error.http_code === 499 || error.message?.includes('timeout')) && retryCount < 3) {
              console.log(`Retrying image upload... (attempt ${retryCount + 1}/3)`);
              setTimeout(async () => {
                try {
                  const retryResult = await uploadImage(fileInput, folder, fileName, retryCount + 1);
                  resolve(retryResult);
                } catch (retryError) {
                  reject(retryError);
                }
              }, 3000 * (retryCount + 1)); // Exponential backoff
            } else {
              reject(error);
            }
          } else {
            console.log('Image upload successful:', result.public_id);
            resolve(result);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};



const uploadFile = async (fileInput, folder = 'resumes', resourceType = 'raw', originalName = '', retryCount = 0) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: resourceType,
        folder: folder,
        use_filename: true,
        unique_filename: true,
        timeout: 600000, // Increased to 10 minutes timeout
        chunk_size: 6000000, // 6MB chunks for large files
        overwrite: true,
        invalidate: true
      };

      if (originalName) {
        // Remove extension and use as public_id
        const nameWithoutExt = originalName.split('.')[0];
        uploadOptions.public_id = `${nameWithoutExt}-${Date.now()}`;
      }

      // Handle both Buffer and file path inputs
      if (Buffer.isBuffer(fileInput)) {
        // Check file size and use appropriate method
        const fileSizeInMB = fileInput.length / (1024 * 1024);
        console.log(`File size: ${fileSizeInMB.toFixed(2)}MB`);
        
        if (fileSizeInMB > 5) {
          // For files over 5MB, use chunked upload with smaller chunks
          console.log('Using chunked upload for large file');
          uploadOptions.chunk_size = 3000000; // Reduced chunk size for better reliability
        }
        
        // Upload from buffer
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary file upload error:', error);
              
              // Check for timeout and retry
              if ((error.name === 'TimeoutError' || error.http_code === 499 || error.message?.includes('timeout')) && retryCount < 3) {
                console.log(`Retrying file upload... (attempt ${retryCount + 1}/3)`);
                setTimeout(async () => {
                  try {
                    const retryResult = await uploadFile(fileInput, folder, resourceType, originalName, retryCount + 1);
                    resolve(retryResult);
                  } catch (retryError) {
                    reject(retryError);
                  }
                }, 3000 * (retryCount + 1)); // Exponential backoff with longer delay
              } else {
                reject(error);
              }
            } else {
              console.log('File upload successful:', result.public_id);
              resolve(result);
            }
          }
        );
        
        uploadStream.end(fileInput);
      } else {
        // Upload from file path
        cloudinary.uploader.upload(fileInput, uploadOptions, (error, result) => {
          if (error) {
            console.error('Cloudinary file upload error:', error);
            
            // Check for timeout and retry
            if ((error.name === 'TimeoutError' || error.http_code === 499 || error.message?.includes('timeout')) && retryCount < 3) {
              console.log(`Retrying file upload... (attempt ${retryCount + 1}/3)`);
              setTimeout(async () => {
                try {
                  const retryResult = await uploadFile(fileInput, folder, resourceType, originalName, retryCount + 1);
                  resolve(retryResult);
                } catch (retryError) {
                  reject(retryError);
                }
              }, 3000 * (retryCount + 1)); // Exponential backoff
            } else {
              reject(error);
            }
          } else {
            console.log('File upload successful:', result.public_id);
            resolve(result);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw error;
  }
};



const uploadQuestionFile = async (fileBuffer, folder = 'question-files', fileName = null, originalName = '', mimeType = '', retryCount = 0) => {
  try {
    return new Promise((resolve, reject) => {
      // Determine resource type based on MIME type
      let resourceType = 'raw';
      if (mimeType.startsWith('image/')) {
        resourceType = 'image';
      } else if (mimeType.startsWith('video/')) {
        resourceType = 'video';
      }

      const uploadOptions = {
        resource_type: resourceType,
        folder: folder,
        use_filename: true,
        unique_filename: true,
        timeout: 600000, // Increased to 10 minutes timeout
        chunk_size: 3000000, // Reduced chunk size for better reliability
        overwrite: true,
        invalidate: true
      };

      if (fileName) {
        uploadOptions.public_id = fileName;
      } else if (originalName) {
        // Remove extension and use as public_id
        const nameWithoutExt = originalName.split('.')[0];
        uploadOptions.public_id = `${nameWithoutExt}-${Date.now()}`;
      }

      // Add transformations for images
      if (resourceType === 'image') {
        uploadOptions.transformation = [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ];
      }

      // Check file size and use appropriate method
      const fileSizeInMB = fileBuffer.length / (1024 * 1024);
      console.log(`Question file size: ${fileSizeInMB.toFixed(2)}MB`);
      
      if (fileSizeInMB > 5) {
        // For large files, use chunked upload
        console.log('Using chunked upload for large question file');
        uploadOptions.chunk_size = 2000000; // Even smaller chunks for question files
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary question file upload error:', error);
            
            // Check for timeout and retry
            if ((error.name === 'TimeoutError' || error.http_code === 499 || error.message?.includes('timeout')) && retryCount < 3) {
              console.log(`Retrying question file upload... (attempt ${retryCount + 1}/3)`);
              setTimeout(async () => {
                try {
                  const retryResult = await uploadQuestionFile(fileBuffer, folder, fileName, originalName, mimeType, retryCount + 1);
                  resolve(retryResult);
                } catch (retryError) {
                  reject(retryError);
                }
              }, 3000 * (retryCount + 1)); // Exponential backoff
            } else {
              reject(error);
            }
          } else {
            console.log('Question file upload successful:', result.public_id);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Error uploading question file to Cloudinary:', error);
    throw error;
  }
};


const deleteFile = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};


const deleteImage = async (publicId) => {
  return deleteFile(publicId, 'image');
};


const extractPublicId = (url) => {
  try {
    if (!url) return null;
    
    // Handle different URL formats
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) return null;
    
    // Get everything after version (v1234567890)
    let pathAfterUpload = urlParts.slice(uploadIndex + 1);
    
    // Remove version if present
    if (pathAfterUpload[0] && pathAfterUpload[0].startsWith('v')) {
      pathAfterUpload = pathAfterUpload.slice(1);
    }
    
    // Join the remaining path and remove file extension
    const fullPath = pathAfterUpload.join('/');
    const publicId = fullPath.replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};


const getFileDetails = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error getting file details from Cloudinary:', error);
    throw error;
  }
};


const generateSignedUrl = (publicId, resourceType = 'image', expiresIn = 3600) => {
  try {
    const timestamp = Math.round(Date.now() / 1000) + expiresIn;
    
    return cloudinary.utils.private_download_url(publicId, 'jpg', {
      resource_type: resourceType,
      expires_at: timestamp
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};


const batchDeleteFiles = async (publicIds, resourceType = 'image') => {
  try {
    if (!publicIds || publicIds.length === 0) {
      return { deleted: {} };
    }

    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error batch deleting files from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadFile,
  uploadQuestionFile,
  deleteFile,
  deleteImage, // Keep for backward compatibility
  extractPublicId,
  getFileDetails,
  generateSignedUrl,
  batchDeleteFiles
};