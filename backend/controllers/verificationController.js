const Project = require('../models/Project');
const CarbonCredit = require('../models/CarbonCredit');
const User = require('../models/User');
const { validationResult } = require('express-validator');

exports.getPendingVerifications = async (req, res) => {
  try {
    const projects = await Project.find({ 
      status: { $in: ['submitted', 'under_review'] }
    })
    .populate('developer', 'name organization email')
    .sort({ 'verification.submittedAt': -1 });

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching pending verifications' 
    });
  }
};
exports.getCompletedVerifications = async (req, res) => {
  try {
    const projects = await Project.find({ 
      status: { $in: ['approved', 'rejected'] }
    })
    .populate('developer', 'name organization email')
    .populate('verification.reviewedBy', 'name organization')
    .sort({ 'verification.reviewedAt': -1 });

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Get completed verifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching completed verifications' 
    });
  }
};

exports.getProjectVerification = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('developer', 'name organization email')
      .populate('verification.reviewedBy', 'name organization')
      .populate('mrvData');

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Get project verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching project verification' 
    });
  }
};

exports.reviewProject = async (req, res) => {
  try {
    const { comments, inspectionRequired } = req.body;
    
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    project.status = 'under_review';
    project.verification = {
      ...project.verification,
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
      comments: comments
    };

    await project.save();

    res.json({
      success: true,
      message: 'Project review updated successfully',
      project
    });
  } catch (error) {
    console.error('Review project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while reviewing project' 
    });
  }
};

exports.approveProject = async (req, res) => {
  try {
    const { comments } = req.body;
    
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    project.status = 'approved';
    project.verification = {
      ...project.verification,
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
      comments: comments
    };

    await project.save();

    res.json({
      success: true,
      message: 'Project approved successfully',
      project
    });
  } catch (error) {
    console.error('Approve project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while approving project' 
    });
  }
};

exports.rejectProject = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    project.status = 'rejected';
    project.verification = {
      ...project.verification,
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
      comments: reason
    };

    await project.save();

    res.json({
      success: true,
      message: 'Project rejected successfully',
      project
    });
  } catch (error) {
    console.error('Reject project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while rejecting project' 
    });
  }
};

exports.scheduleInspection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { projectId, inspectionDate, inspectorNotes } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    project.verification = {
      ...project.verification,
      inspectionDate: new Date(inspectionDate),
      inspectionReport: inspectorNotes,
      reviewedBy: req.user.userId
    };

    await project.save();

    res.json({
      success: true,
      message: 'Inspection scheduled successfully',
      project
    });
  } catch (error) {
    console.error('Schedule inspection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while scheduling inspection' 
    });
  }
};

exports.updateInspection = async (req, res) => {
  try {
    const { inspectionReport, status } = req.body;
    
    // This would typically find an inspection record
    // For now, we'll update the project's verification
    const project = await Project.findOne({ 
      'verification.inspectionDate': { $exists: true }
    });

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inspection not found' 
      });
    }

    project.verification.inspectionReport = inspectionReport;
    if (status) {
      project.status = status;
    }

    await project.save();

    res.json({
      success: true,
      message: 'Inspection updated successfully',
      project
    });
  } catch (error) {
    console.error('Update inspection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating inspection' 
    });
  }
};