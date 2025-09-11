const Project = require('../models/Project');
const User = require('../models/User');
const emailService = require('./emailService');

class VerificationService {
  async submitProjectForVerification(projectId, userId) {
    try {
      const project = await Project.findById(projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      if (project.developer.toString() !== userId) {
        throw new Error('Not authorized to submit this project');
      }
      
      if (project.status !== 'draft') {
        throw new Error('Project can only be submitted from draft status');
      }
      
      // Update project status
      project.status = 'submitted';
      project.verification.submittedAt = new Date();
      
      await project.save();
      
      // Notify regulatory bodies
      await this.notifyRegulatoryBodies(project);
      
      return project;
    } catch (error) {
      throw error;
    }
  }
  
  async reviewProject(projectId, reviewerId, reviewData) {
    try {
      const project = await Project.findById(projectId)
        .populate('developer', 'name email');
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      const { status, comments, inspectionRequired } = reviewData;
      
      project.status = status;
      project.verification.reviewedBy = reviewerId;
      project.verification.reviewedAt = new Date();
      project.verification.comments = comments;
      
      if (inspectionRequired) {
        project.verification.inspectionRequired = true;
      }
      
      await project.save();
      
      // Send notification email to developer
      if (status === 'approved') {
        await emailService.sendProjectApprovalEmail(
          project.developer,
          project
        );
      } else if (status === 'rejected') {
        await emailService.sendProjectRejectionEmail(
          project.developer,
          project,
          comments
        );
      }
      
      return project;
    } catch (error) {
      throw error;
    }
  }
  
  async scheduleInspection(projectId, inspectionData) {
    try {
      const project = await Project.findById(projectId)
        .populate('developer', 'name email');
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      const { inspectionDate, inspector, notes } = inspectionData;
      
      project.verification.inspectionDate = new Date(inspectionDate);
      project.verification.inspector = inspector;
      project.verification.inspectionNotes = notes;
      
      await project.save();
      
      // Send notification to developer
      await this.sendInspectionNotification(project);
      
      return project;
    } catch (error) {
      throw error;
    }
  }
  
  async completeInspection(projectId, inspectionResult) {
    try {
      const project = await Project.findById(projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      const { report, recommendations, status } = inspectionResult;
      
      project.verification.inspectionReport = report;
      project.verification.inspectionRecommendations = recommendations;
      project.verification.inspectionCompletedAt = new Date();
      
      if (status) {
        project.status = status;
      }
      
      await project.save();
      
      return project;
    } catch (error) {
      throw error;
    }
  }
  
  async getVerificationStats(userId, userRole) {
    try {
      let query = {};
      
      if (userRole === 'project_developer') {
        query.developer = userId;
      }
      
      const stats = await Project.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      const formatted = {
        total: 0,
        draft: 0,
        submitted: 0,
        under_review: 0,
        approved: 0,
        rejected: 0,
        active: 0,
        completed: 0
      };
      
      stats.forEach(stat => {
        formatted[stat._id] = stat.count;
        formatted.total += stat.count;
      });
      
      return formatted;
    } catch (error) {
      throw error;
    }
  }
  
  async getPendingVerifications(regulatorId) {
    try {
      const projects = await Project.find({
        status: { $in: ['submitted', 'under_review'] }
      })
      .populate('developer', 'name organization email')
      .sort({ 'verification.submittedAt': 1 }); // Oldest first
      
      return projects;
    } catch (error) {
      throw error;
    }
  }
  
  async getVerificationHistory(regulatorId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      
      let query = {
        'verification.reviewedBy': regulatorId
      };
      
      if (status) {
        query.status = status;
      }
      
      const projects = await Project.find(query)
        .populate('developer', 'name organization')
        .sort({ 'verification.reviewedAt': -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Project.countDocuments(query);
      
      return {
        projects,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      };
    } catch (error) {
      throw error;
    }
  }
  
  async notifyRegulatoryBodies(project) {
    try {
      // Find all regulatory body users
      const regulators = await User.find({ 
        role: 'regulatory_body',
        isActive: true 
      });
      
      // Send notification emails (simplified)
      for (const regulator of regulators) {
        await this.sendVerificationNotification(regulator, project);
      }
    } catch (error) {
      console.error('Error notifying regulatory bodies:', error);
    }
  }
  
  async sendVerificationNotification(regulator, project) {
    try {
      const subject = `New Project Submitted for Verification: ${project.name}`;
      const html = `
        <h2>New Project Verification Request</h2>
        <p>A new project has been submitted for verification:</p>
        <ul>
          <li><strong>Project:</strong> ${project.name}</li>
          <li><strong>Type:</strong> ${project.type.replace('_', ' ')}</li>
          <li><strong>Developer:</strong> ${project.developer.name}</li>
          <li><strong>Expected Credits:</strong> ${project.projectDetails.expectedCredits}</li>
        </ul>
        <p>Please review this project in your dashboard.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Project</a>
      `;
      
      await emailService.sendEmail(regulator.email, subject, html);
    } catch (error) {
      console.error('Error sending verification notification:', error);
    }
  }
  
  async sendInspectionNotification(project) {
    try {
      const subject = `Inspection Scheduled for Project: ${project.name}`;
      const html = `
        <h2>Inspection Scheduled</h2>
        <p>An inspection has been scheduled for your project:</p>
        <ul>
          <li><strong>Project:</strong> ${project.name}</li>
          <li><strong>Inspection Date:</strong> ${project.verification.inspectionDate.toDateString()}</li>
          <li><strong>Notes:</strong> ${project.verification.inspectionNotes || 'None'}</li>
        </ul>
        <p>Please ensure all project documentation and site access are ready for the inspection.</p>
        <a href="${process.env.FRONTEND_URL}/projects/${project._id}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Project</a>
      `;
      
      await emailService.sendEmail(project.developer.email, subject, html);
    } catch (error) {
      console.error('Error sending inspection notification:', error);
    }
  }
}

module.exports = new VerificationService();