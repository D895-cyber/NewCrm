const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const HtmlToPdfService = require('../services/HtmlToPdfService');
const ASCOMPReport = require('../models/ASCOMPReport');

/**
 * @route   POST /api/html-to-pdf/upload-template
 * @desc    Upload HTML template (Admin only)
 * @access  Private/Admin
 */
router.post('/upload-template', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { templateName, htmlContent } = req.body;

    if (!templateName || !htmlContent) {
      return res.status(400).json({ message: 'Template name and HTML content are required' });
    }

    console.log(`📤 Uploading HTML template: ${templateName}`);
    
    const templatePath = await HtmlToPdfService.saveHtmlTemplate(htmlContent, templateName);
    
    res.json({
      message: 'HTML template uploaded successfully',
      templateName,
      templatePath
    });
  } catch (error) {
    console.error('Error uploading HTML template:', error);
    res.status(500).json({ 
      message: 'Failed to upload template', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/html-to-pdf/templates
 * @desc    List all HTML templates
 * @access  Private
 */
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    const templates = HtmlToPdfService.listHtmlTemplates();
    res.json({ templates });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ 
      message: 'Failed to list templates', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/html-to-pdf/template/:templateName
 * @desc    Get HTML template content
 * @access  Private
 */
router.get('/template/:templateName', authenticateToken, async (req, res) => {
  try {
    const { templateName } = req.params;
    const content = HtmlToPdfService.getTemplateContent(templateName);
    res.json({ templateName, content });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(404).json({ 
      message: 'Template not found', 
      error: error.message 
    });
  }
});

/**
 * @route   DELETE /api/html-to-pdf/template/:templateName
 * @desc    Delete HTML template (Admin only)
 * @access  Private/Admin
 */
router.delete('/template/:templateName', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { templateName } = req.params;
    
    const deleted = HtmlToPdfService.deleteHtmlTemplate(templateName);
    
    if (deleted) {
      res.json({ message: 'Template deleted successfully' });
    } else {
      res.status(404).json({ message: 'Template not found' });
    }
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ 
      message: 'Failed to delete template', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/html-to-pdf/generate/:reportId
 * @desc    Generate PDF from HTML template for an ASCOMP report
 * @access  Private
 */
router.post('/generate/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { templateName, pdfOptions } = req.body;

    if (!templateName) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    // Try ASCOMPReport first
    let report = await ASCOMPReport.findById(reportId).lean();
    
    // If not found, try ServiceReport (for reports with ASCOMP- prefix)
    if (!report) {
      const ServiceReport = require('../models/ServiceReport');
      const serviceReport = await ServiceReport.findById(reportId).lean();
      if (serviceReport && serviceReport.reportNumber?.startsWith('ASCOMP-')) {
        // Transform ServiceReport to ASCOMPReport format
        report = {
          ...serviceReport,
          cinemaName: serviceReport.siteName,
          address: serviceReport.siteAddress || '',
          location: serviceReport.siteName || '',
          contactDetails: serviceReport.siteIncharge?.contact || '',
          // Map inspection sections
          opticals: serviceReport.inspectionSections?.opticals || [],
          electronics: serviceReport.inspectionSections?.electronics || [],
          mechanical: serviceReport.inspectionSections?.mechanical || [],
          serialNumberVerified: serviceReport.inspectionSections?.serialNumberVerified || {},
          disposableConsumables: serviceReport.inspectionSections?.disposableConsumables || [],
          coolant: serviceReport.inspectionSections?.coolant || {},
          lightEngineTestPatterns: serviceReport.inspectionSections?.lightEngineTestPatterns || []
        };
        console.log(`📝 Found ServiceReport with ASCOMP- prefix: ${serviceReport.reportNumber}`);
      }
    }
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    console.log(`📝 Generating PDF for report: ${report.reportNumber}`);
    
    // Prepare data for template (add any additional formatting)
    const templateData = {
      ...report,
      // Format date
      formattedDate: report.date ? new Date(report.date).toLocaleDateString('en-GB') : '',
      // Ensure cinemaName exists (use siteName if needed)
      cinemaName: report.cinemaName || report.siteName || '',
      // Add any other computed fields
    };

    // Generate PDF
    const pdfBuffer = await HtmlToPdfService.generatePdfFromTemplate(
      templateName, 
      templateData,
      pdfOptions || {}
    );
    
    // Send PDF
    const filename = `${report.reportNumber}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      message: 'Failed to generate PDF', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/html-to-pdf/preview/:reportId
 * @desc    Preview HTML template with report data (returns HTML)
 * @access  Private
 */
router.post('/preview/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { templateName } = req.body;

    if (!templateName) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    // Get report data
    const report = await ASCOMPReport.findById(reportId).lean();
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Get template content
    const templateContent = HtmlToPdfService.getTemplateContent(templateName);
    
    // Compile with Handlebars
    const Handlebars = require('handlebars');
    const template = Handlebars.compile(templateContent);
    
    // Render HTML
    const html = template({
      ...report,
      formattedDate: report.date ? new Date(report.date).toLocaleDateString('en-GB') : ''
    });
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ 
      message: 'Failed to preview template', 
      error: error.message 
    });
  }
});

module.exports = router;







