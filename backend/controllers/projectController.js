const Project = require('../models/Project');
const MRVData = require('../models/MRVData');
const { validationResult } = require('express-validator');
const ipfsService = require('../services/ipfsService');

exports.getAllProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    
    let query = {};
    
    // Add filters
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('developer', 'name organization')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    console.log('Projects fetched:', projects);
    const total = await Project.countDocuments(query);
    console.log('Total projects count:', total);
    res.json({
      success: true,
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching projects' 
    });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ developer: req.user.userId })
      .populate('mrvData')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching projects' 
    });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    console.log('Fetching project with ID:', req);
    const project = await Project.findById(req.params.id)
      .populate('developer', 'name organization email')
      .populate('verification.reviewedBy', 'name organization')
      .populate('mrvData');
    console.log('Project fetched by ID:', project);
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
    console.error('Get project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching project' 
    });
  }
};

exports.createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    console.log('Validation errors:', errors.array());
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const projectData = {
      ...req.body,
      developer: req.user.userId
    };

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating project' 
    });
  }
};

exports.updateProject = async (req, res) => {
  try {
    console.log('Project to update:', req.user.userId);
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    console.log("project.developer.toString()",project.developer.toString())
    // Check if user owns the project
    if (project.developer.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this project' 
      });
    }

    // Don't allow updates if project is under review or approved
    if (['under_review', 'approved', 'active'].includes(project.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot update project in current status' 
      });
    }

    Object.assign(project, req.body);
    await project.save();
    console.log('Updated project:', project);

    res.json({
      success: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating project' 
    });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Check if user owns the project
    if (project.developer.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to delete this project' 
      });
    }

    // Don't allow deletion if project is approved or active
    if (['approved', 'active'].includes(project.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete approved or active project' 
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting project' 
    });
  }
};

exports.uploadDocuments = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Check if user owns the project
    if (project.developer.toString() !== req.user.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to upload documents for this project' 
      });
    }

    const uploadedDocs = [];

    for (const file of req.files) {
      // Upload to IPFS
      const ipfsResult = await ipfsService.uploadFile(file.buffer, file.originalname);
      
      uploadedDocs.push({
        fileName: file.originalname,
        fileHash: ipfsResult.hash,
        fileType: file.mimetype,
        uploadDate: new Date()
      });
    }

    project.documentation.push(...uploadedDocs);
    await project.save();

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      documents: uploadedDocs
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while uploading documents' 
    });
  }
};

exports.submitMRVData = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }
    console.log('Project for MRV submission:', project.developer.toString(),  req.user.userId.toString());
    // Check if user owns the project
    if (project.developer.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to submit MRV data for this project' 
      });
    }

    const mrvData = new MRVData({
      project: project._id,
      ...req.body,
      submittedBy: req.user.userId
    });

    await mrvData.save();

    // Add MRV data reference to project
    project.mrvData.push(mrvData._id);
    await project.save();

    res.json({
      success: true,
      message: 'MRV data submitted successfully',
      mrvData
    });
  } catch (error) {
    console.error('Submit MRV data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while submitting MRV data' 
    });
  }
};