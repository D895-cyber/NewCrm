/**
 * Google Drive Service
 * Handles downloading files from Google Drive links
 */

const axios = require('axios');
const { Readable } = require('stream');

class GoogleDriveService {
  /**
   * Extract file ID from various Google Drive URL formats
   * @param {string} url - Google Drive URL
   * @returns {string|null} - File ID or null if invalid
   */
  static extractFileId(url) {
    if (!url) return null;
    
    // Handle different Drive URL formats:
    // 1. https://drive.google.com/file/d/FILE_ID/view
    // 2. https://drive.google.com/open?id=FILE_ID
    // 3. https://drive.google.com/uc?id=FILE_ID
    
    try {
      // Pattern 1: /file/d/FILE_ID/
      let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
      
      // Pattern 2: id=FILE_ID or ?id=FILE_ID
      match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
      
      // Pattern 3: /d/FILE_ID (older format)
      match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
      
      return null;
    } catch (error) {
      console.error('Error extracting file ID from URL:', error);
      return null;
    }
  }

  /**
   * Convert Google Drive sharing link to direct download link
   * @param {string} fileId - Google Drive file ID
   * @returns {string} - Direct download URL
   */
  static getDirectDownloadUrl(fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  /**
   * Download file from Google Drive
   * @param {string} driveUrl - Google Drive sharing URL
   * @returns {Promise<Buffer>} - File buffer
   */
  static async downloadFile(driveUrl) {
    try {
      const fileId = this.extractFileId(driveUrl);
      
      if (!fileId) {
        throw new Error('Invalid Google Drive URL: Could not extract file ID');
      }

      console.log(`📥 Downloading file from Google Drive: ${fileId}`);
      
      // Get direct download URL
      const downloadUrl = this.getDirectDownloadUrl(fileId);
      
      // Download the file with redirect handling
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        maxRedirects: 5,
        timeout: 60000, // 60 seconds timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Check if we got a "confirmation" page instead of the file
      const contentType = response.headers['content-type'];
      
      if (contentType && contentType.includes('text/html')) {
        // This might be a large file requiring confirmation
        // Try to extract the confirmation token and download again
        const html = response.data.toString();
        const confirmMatch = html.match(/confirm=([^&"]+)/);
        
        if (confirmMatch) {
          const confirmToken = confirmMatch[1];
          const confirmedUrl = `${downloadUrl}&confirm=${confirmToken}`;
          
          console.log('📥 Large file detected, using confirmation token...');
          
          const confirmedResponse = await axios.get(confirmedUrl, {
            responseType: 'arraybuffer',
            maxRedirects: 5,
            timeout: 120000, // 2 minutes for large files
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          return Buffer.from(confirmedResponse.data);
        }
        
        throw new Error('Failed to download file: Got HTML page instead of file (file may be private or too large)');
      }

      console.log(`✅ Downloaded file: ${response.data.byteLength} bytes`);
      
      return Buffer.from(response.data);
      
    } catch (error) {
      console.error('❌ Error downloading from Google Drive:', error.message);
      
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('File not found or not accessible. Please check the Drive link permissions.');
        } else if (error.response.status === 403) {
          throw new Error('Access denied. Please ensure the file is publicly accessible or shared with the service.');
        }
      }
      
      throw new Error(`Failed to download from Google Drive: ${error.message}`);
    }
  }

  /**
   * Download file and get metadata
   * @param {string} driveUrl - Google Drive sharing URL
   * @returns {Promise<{buffer: Buffer, metadata: Object}>}
   */
  static async downloadFileWithMetadata(driveUrl) {
    try {
      const buffer = await this.downloadFile(driveUrl);
      
      // Try to determine file type from buffer
      const metadata = {
        size: buffer.length,
        mimeType: this.detectMimeType(buffer),
        source: 'google_drive',
        originalUrl: driveUrl
      };
      
      return { buffer, metadata };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Detect MIME type from buffer (basic detection)
   * @param {Buffer} buffer - File buffer
   * @returns {string} - MIME type
   */
  static detectMimeType(buffer) {
    // PDF signature
    if (buffer.length >= 4 && 
        buffer[0] === 0x25 && buffer[1] === 0x50 && 
        buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'application/pdf';
    }
    
    // Default
    return 'application/octet-stream';
  }

  /**
   * Validate if URL is a Google Drive link
   * @param {string} url - URL to validate
   * @returns {boolean}
   */
  static isGoogleDriveUrl(url) {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  }
}

module.exports = GoogleDriveService;









