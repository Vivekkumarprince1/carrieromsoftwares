/**
 * Utility functions for handling images throughout the application
 */

/**
 * Constructs the proper URL for an image path from the backend
 * @param {string} imagePath - The image path (Cloudinary URL or relative path from backend)
 * @returns {string} The complete URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a complete URL (Cloudinary URL), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log(`Direct URL: ${imagePath}`);
    return imagePath;
  }
  
  // For legacy local images, use API_BASE_URL from environment if available
  const baseUrl = import.meta.env.VITE_BASE_URL || '';
  console.log(baseUrl);
  
  // Make sure path starts with slash if it doesn't already
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  console.log(`Legacy image URL: ${baseUrl}${normalizedPath}`);
  
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Gets the first letter for a fallback display when no image is available
 * @param {string} text - The text to extract the first letter from (typically job title)
 * @returns {string} The uppercase first letter or a default if text is empty
 */
export const getFirstLetterFallback = (text) => {
  if (!text || typeof text !== 'string' || text.length === 0) {
    return 'J'; // Default fallback for "Job"
  }
  return text.charAt(0).toUpperCase();
};