const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const WordTemplateService = require('../services/WordTemplateService');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Only accept .docx files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * @route   POST /api/word-templates/upload
 * @desc    Upload a new Word template (Admin only)
 * @access  Private/Admin
 */
router.post('/upload', authenticateToken, authorizeRoles('admin', 'manager'), upload.single('template'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { templateName } = req.body;
    if (!templateName) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    console.log(`📤 Uploading Word template: ${templateName}`);
    
    const templatePath = await WordTemplateService.saveTemplate(req.file.buffer, templateName);
    
    res.json({
      message: 'Template uploaded successfully',
      templateName,
      templatePath,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ 
      message: 'Failed to upload template', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/word-templates
 * @desc    List all available templates
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const templates = WordTemplateService.listTemplates();
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
 * @route   DELETE /api/word-templates/:templateName
 * @desc    Delete a template (Admin only)
 * @access  Private/Admin
 */
router.delete('/:templateName', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { templateName } = req.params;
    
    const deleted = WordTemplateService.deleteTemplate(templateName);
    
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
 * @route   POST /api/word-templates/generate
 * @desc    Generate a Word document from template and report data
 * @access  Private
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { templateName, reportData } = req.body;
    
    if (!templateName) {
      return res.status(400).json({ message: 'Template name is required' });
    }
    
    if (!reportData) {
      return res.status(400).json({ message: 'Report data is required' });
    }

    console.log(`📝 Generating Word document from template: ${templateName}`);
    console.log(`📊 Report data: ${reportData.reportNumber || 'N/A'}`);
    
    const documentBuffer = await WordTemplateService.generateDocument(templateName, reportData);
    
    // Set headers for file download
    const filename = `${reportData.reportNumber || 'Report'}_${Date.now()}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', documentBuffer.length);
    
    res.send(documentBuffer);
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ 
      message: 'Failed to generate document', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/word-templates/generate/:reportId
 * @desc    Generate Word document for an existing ASCOMP report
 * @access  Private
 */
router.post('/generate/:reportId', authenticateToken, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { templateName } = req.body;
    
    if (!templateName) {
      return res.status(400).json({ message: 'Template name is required' });
    }

    // Get the report data from database
    const ASCOMPReport = require('../models/ASCOMPReport');
    const report = await ASCOMPReport.findById(reportId).lean();
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    console.log(`📝 Generating Word document for report: ${report.reportNumber}`);
    
    const documentBuffer = await WordTemplateService.generateDocument(templateName, report);
    
    // Set headers for file download
    const filename = `${report.reportNumber}_${Date.now()}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', documentBuffer.length);
    
    res.send(documentBuffer);
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ 
      message: 'Failed to generate document', 
      error: error.message 
    });
  }
});

module.exports = router;







