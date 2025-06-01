/**
 * Utility functions for handling images throughout the application
 */

/**
 * Constructs the proper URL for an image path from the backend
 * @param {string} imagePath - The relative image path from the backend (e.g. "/uploads/jobs/image.jpg")
 * @returns {string} The complete URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // Use API_BASE_URL from environment if available, otherwise assume same origin
  const baseUrl = import.meta.env.VITE_BASE_URL || '';
  console.log(baseUrl);
  
  // Make sure path starts with slash if it doesn't already
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  console.log(`Image URL: ${baseUrl}${normalizedPath}`);
  
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