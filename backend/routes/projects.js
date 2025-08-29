const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const multer = require('multer');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/csv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Validation rules
const projectValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Project name must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('type').isIn(['renewable_energy', 'afforestation', 'energy_efficiency', 'waste_management', 'transportation', 'industrial']).withMessage('Invalid project type'),
  body('location.country').notEmpty().withMessage('Country is required'),
  body('location.state').notEmpty().withMessage('State is required'),
  body('projectDetails.startDate').isISO8601().withMessage('Valid start date is required'),
  body('projectDetails.endDate').isISO8601().withMessage('Valid end date is required'),
  body('projectDetails.expectedCredits').isNumeric().withMessage('Expected credits must be a number')
];

// Routes
router.get('/', authMiddleware, projectController.getAllProjects);
router.get('/my-projects', authMiddleware, roleCheck(['project_developer']), projectController.getMyProjects);
router.get('/:id', authMiddleware, projectController.getProjectById);
router.post('/', authMiddleware, roleCheck(['project_developer']), projectValidation, projectController.createProject);
router.put('/:id', authMiddleware, roleCheck(['project_developer']), projectController.updateProject);
router.delete('/:id', authMiddleware, roleCheck(['project_developer']), projectController.deleteProject);
router.post('/:id/documents', authMiddleware, roleCheck(['project_developer']), upload.array('documents', 10), projectController.uploadDocuments);
router.post('/:id/mrv-data', authMiddleware, roleCheck(['project_developer']), projectController.submitMRVData);

module.exports = router;