const express = require('express');
const router = express.Router();
const PartComment = require('../models/PartComment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/part-comments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only documents and images are allowed'));
    }
  }
});

// Get comments for a specific part at a site
router.get('/part/:partName/:partNumber/site/:siteId', async (req, res) => {
  try {
    const { partName, partNumber, siteId } = req.params;
    const { limit = 50, skip = 0, includeInternal = false } = req.query;

    const comments = await PartComment.getPartSiteComments(
      decodeURIComponent(partName),
      decodeURIComponent(partNumber),
      siteId,
      {
        limit: parseInt(limit),
        skip: parseInt(skip),
        includeInternal: includeInternal === 'true'
      }
    );

    res.json({
      success: true,
      data: comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Error fetching part site comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
});

// Get latest comment for a specific part at a site
router.get('/part/:partName/:partNumber/site/:siteId/latest', async (req, res) => {
  try {
    const { partName, partNumber, siteId } = req.params;

    const comment = await PartComment.getLatestPartSiteComment(
      decodeURIComponent(partName),
      decodeURIComponent(partNumber),
      siteId
    );

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error fetching latest comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest comment',
      error: error.message
    });
  }
});

// Add a new comment for a part at a site
router.post('/part/:partName/:partNumber/site/:siteId', upload.array('attachments', 5), async (req, res) => {
  try {
    const { partName, partNumber, siteId } = req.params;
    const {
      comment,
      commentType = 'general',
      priority = 'medium',
      authorName,
      authorRole,
      userId,
      isInternal = false,
      tags = [],
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!comment || !authorName || !authorRole) {
      return res.status(400).json({
        success: false,
        message: 'Comment, author name, and author role are required'
      });
    }

    // Process uploaded files
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/part-comments/${file.filename}`,
      size: file.size,
      uploadedAt: new Date()
    })) : [];

    // Get site name from request or use siteId as fallback
    const siteName = req.body.siteName || siteId;

    const newComment = new PartComment({
      partName: decodeURIComponent(partName),
      partNumber: decodeURIComponent(partNumber),
      siteId,
      siteName,
      rmaId: req.body.rmaId,
      comment,
      commentType,
      priority,
      author: {
        name: authorName,
        role: authorRole,
        userId: userId
      },
      isInternal: isInternal === 'true' || isInternal === true,
      attachments,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
      metadata
    });

    await newComment.save();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

// Update a comment
router.put('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const updatedComment = await PartComment.findByIdAndUpdate(
      commentId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
});

// Delete a comment (soft delete)
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;

    const deletedComment = await PartComment.findByIdAndUpdate(
      commentId,
      { status: 'deleted' },
      { new: true }
    );

    if (!deletedComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
});

// Get comment statistics
router.get('/stats', async (req, res) => {
  try {
    const filters = req.query;
    const stats = await PartComment.getCommentStats(filters);

    res.json({
      success: true,
      data: stats[0] || {
        totalComments: 0,
        byType: [],
        byPriority: [],
        latestComment: null
      }
    });
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comment statistics',
      error: error.message
    });
  }
});

// Search comments
router.get('/search', async (req, res) => {
  try {
    const {
      query,
      partName,
      siteId,
      commentType,
      priority,
      authorUserId,
      dateFrom,
      dateTo,
      limit = 50,
      skip = 0
    } = req.query;

    const searchQuery = { status: 'active' };

    if (query) {
      searchQuery.$or = [
        { comment: { $regex: query, $options: 'i' } },
        { partName: { $regex: query, $options: 'i' } },
        { partNumber: { $regex: query, $options: 'i' } },
        { siteName: { $regex: query, $options: 'i' } },
        { 'author.name': { $regex: query, $options: 'i' } }
      ];
    }

    if (partName) searchQuery.partName = partName;
    if (siteId) searchQuery.siteId = siteId;
    if (commentType) searchQuery.commentType = commentType;
    if (priority) searchQuery.priority = priority;
    if (authorUserId) searchQuery['author.userId'] = authorUserId;

    if (dateFrom || dateTo) {
      searchQuery.createdAt = {};
      if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
    }

    const comments = await PartComment.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalCount = await PartComment.countDocuments(searchQuery);

    res.json({
      success: true,
      data: comments,
      count: comments.length,
      totalCount,
      hasMore: (parseInt(skip) + comments.length) < totalCount
    });
  } catch (error) {
    console.error('Error searching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search comments',
      error: error.message
    });
  }
});

// Get all comments for a specific part across all sites
router.get('/part/:partName/:partNumber', async (req, res) => {
  try {
    const { partName, partNumber } = req.params;
    const { limit = 100, skip = 0, includeInternal = false } = req.query;

    const query = {
      partName: decodeURIComponent(partName),
      partNumber: decodeURIComponent(partNumber),
      status: 'active'
    };

    if (includeInternal !== 'true') {
      query.isInternal = false;
    }

    const comments = await PartComment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({
      success: true,
      data: comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Error fetching part comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch part comments',
      error: error.message
    });
  }
});

// Get all comments for a specific site across all parts
router.get('/site/:siteId', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { limit = 100, skip = 0, includeInternal = false } = req.query;

    const query = {
      siteId,
      status: 'active'
    };

    if (includeInternal !== 'true') {
      query.isInternal = false;
    }

    const comments = await PartComment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({
      success: true,
      data: comments,
      count: comments.length
    });
  } catch (error) {
    console.error('Error fetching site comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site comments',
      error: error.message
    });
  }
});

module.exports = router;




