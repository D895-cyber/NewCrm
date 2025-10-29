/**
 * HTML to PDF Service
 * Converts HTML templates with placeholders to PDF
 * Uses Handlebars for template rendering and Puppeteer for PDF generation
 */

const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

class HtmlToPdfService {
  constructor() {
    this.templateDir = path.join(__dirname, '../templates/html');
    this.ensureTemplateDir();
    this.registerHelpers();
  }

  ensureTemplateDir() {
    if (!fs.existsSync(this.templateDir)) {
      fs.mkdirSync(this.templateDir, { recursive: true });
    }
  }

  /**
   * Register Handlebars helpers for common operations
   */
  registerHelpers() {
    // Helper for conditional display
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    // Helper for date formatting
    Handlebars.registerHelper('formatDate', function(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-GB');
    });

    // Helper for default values
    Handlebars.registerHelper('default', function(value, defaultValue) {
      return value || defaultValue || '';
    });

    // Helper for embedding photos as base64
    Handlebars.registerHelper('embedPhoto', function(photoUrl, altText = 'Photo') {
      if (!photoUrl) return '';
      
      // If it's already a base64 data URL, return as is
      if (photoUrl.startsWith('data:image/')) {
        return photoUrl;
      }
      
      // For now, return the URL - in production, you'd convert to base64 here
      return photoUrl;
    });

    // Helper for embedding signatures
    Handlebars.registerHelper('embedSignature', function(signatureData, altText = 'Signature') {
      if (!signatureData) return '';
      
      // If it's already a base64 data URL, return as is
      if (signatureData.startsWith('data:image/')) {
        return signatureData;
      }
      
      return signatureData;
    });

    // Helper for photo gallery
    Handlebars.registerHelper('eachPhoto', function(photos, options) {
      if (!photos || !Array.isArray(photos)) return '';
      
      let result = '';
      photos.forEach((photo, index) => {
        if (photo && (photo.cloudUrl || photo.path || photo.dataURI)) {
          const photoUrl = photo.cloudUrl || photo.path || photo.dataURI;
          result += options.fn({
            ...photo,
            index: index + 1,
            photoUrl: photoUrl,
            description: photo.description || `Photo ${index + 1}`,
            category: photo.category || photo.beforeAfter || 'Service Photo'
          });
        }
      });
      return result;
    });
  }

  /**
   * Save HTML template
   * @param {string} htmlContent - The HTML template content
   * @param {string} templateName - Name for the template
   */
  async saveHtmlTemplate(htmlContent, templateName) {
    try {
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      fs.writeFileSync(templatePath, htmlContent, 'utf8');
      console.log(`✅ HTML template saved: ${templatePath}`);
      return templatePath;
    } catch (error) {
      console.error('❌ Error saving HTML template:', error);
      throw new Error(`Failed to save HTML template: ${error.message}`);
    }
  }

  /**
   * Generate PDF from HTML template
   * @param {string} templateName - Name of the template to use
   * @param {Object} data - Data to fill in the template
   * @param {Object} options - PDF generation options
   * @returns {Promise<Buffer>} Generated PDF as buffer
   */
  async generatePdfFromTemplate(templateName, data, options = {}) {
    let browser;
    try {
      // Load template
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templateName}`);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf8');

      // Compile template with Handlebars
      const template = Handlebars.compile(templateContent);
      
      // Render HTML with data
      const html = template(data);

      // Launch Puppeteer
      console.log('🚀 Launching browser for PDF generation...');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();

      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF
      const pdfOptions = {
        format: options.format || 'A4',
        printBackground: true,
        margin: options.margin || {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        ...options
      };

      console.log('📄 Generating PDF...');
      const pdfBuffer = await page.pdf(pdfOptions);

      console.log('✅ PDF generated successfully');
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate PDF from HTML string directly
   * @param {string} htmlContent - HTML content with placeholders
   * @param {Object} data - Data to fill in
   * @param {Object} options - PDF options
   */
  async generatePdfFromHtml(htmlContent, data, options = {}) {
    let browser;
    try {
      // Compile template
      const template = Handlebars.compile(htmlContent);
      const html = template(data);

      // Launch browser
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // PDF options
      const pdfOptions = {
        format: options.format || 'A4',
        printBackground: true,
        margin: options.margin || {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Error generating PDF from HTML:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * List all HTML templates
   */
  listHtmlTemplates() {
    try {
      const files = fs.readdirSync(this.templateDir);
      return files
        .filter(file => file.endsWith('.html'))
        .map(file => ({
          name: file.replace('.html', ''),
          path: path.join(this.templateDir, file),
          size: fs.statSync(path.join(this.templateDir, file)).size,
          modified: fs.statSync(path.join(this.templateDir, file)).mtime
        }));
    } catch (error) {
      console.error('Error listing HTML templates:', error);
      return [];
    }
  }

  /**
   * Delete an HTML template
   */
  deleteHtmlTemplate(templateName) {
    try {
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      if (fs.existsSync(templatePath)) {
        fs.unlinkSync(templatePath);
        console.log(`✅ HTML template deleted: ${templateName}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting HTML template:', error);
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  /**
   * Get template content
   */
  getTemplateContent(templateName) {
    try {
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf8');
      }
      throw new Error('Template not found');
    } catch (error) {
      throw new Error(`Failed to read template: ${error.message}`);
    }
  }
}

module.exports = new HtmlToPdfService();







