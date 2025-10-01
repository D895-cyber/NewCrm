const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const ReportTemplate = require('../models/ReportTemplate');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only DOCX files are allowed'));
    }
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const templates = await ReportTemplate.find().sort({ updatedAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
  }
});

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'manager'),
  upload.single('template'),
  [
    body('name').notEmpty().withMessage('Template name is required'),
    body('reportType').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Template file is required' });
    }

    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'projectorcare/service-reports/templates',
            resource_type: 'raw'
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        stream.end(req.file.buffer);
      });

      if (req.body.isDefault) {
        await ReportTemplate.updateMany({ reportType: req.body.reportType }, { isDefault: false });
      }

      const template = await ReportTemplate.create({
        name: req.body.name,
        reportType: req.body.reportType,
        description: req.body.description,
        version: req.body.version,
        isDefault: req.body.isDefault || false,
        uploadedBy: req.user?.id || req.user?.name,
        storage: {
          cloudUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          bytes: uploadResult.bytes
        }
      });

      res.status(201).json({
        message: 'Template uploaded successfully',
        template
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload template', error: error.message });
    }
  }
);

router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const template = await ReportTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (template.storage?.publicId) {
      await cloudinary.uploader.destroy(template.storage.publicId, { resource_type: 'raw' });
    }

    await template.deleteOne();

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete template', error: error.message });
  }
});

router.get('/:id/field-map', authenticateToken, async (req, res) => {
  try {
    const template = await ReportTemplate.findById(req.params.id).select('fieldMappings');
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(template.fieldMappings || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch field mappings', error: error.message });
  }
});

router.put('/:id/field-map',
  authenticateToken,
  authorizeRoles('admin', 'manager'),
  [
    body('mappings').isArray().withMessage('Mappings must be an array')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const template = await ReportTemplate.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      template.fieldMappings = (req.body.mappings || []).map(map => ({
        token: map.token,
        dataPath: map.dataPath,
        defaultValue: map.defaultValue || ''
      }));

      await template.save();

      res.json({
        message: 'Field mappings updated successfully',
        fieldMappings: template.fieldMappings
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update field mappings', error: error.message });
    }
  }
);

module.exports = router;

