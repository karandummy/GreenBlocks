const express = require('express');
const { body } = require('express-validator');
const verificationController = require('../controllers/verificationController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Validation rules
const inspectionValidation = [
  body('projectId').isMongoId().withMessage('Valid project ID is required'),
  body('inspectionDate').isISO8601().withMessage('Valid inspection date is required'),
  body('inspectorNotes').optional().trim().isLength({ max: 1000 }).withMessage('Inspector notes too long')
];

// Routes - Only for regulatory bodies
router.use(authMiddleware);
router.use(roleCheck(['regulatory_body']));

router.get('/pending', verificationController.getPendingVerifications);
router.get('/completed', verificationController.getCompletedVerifications);
router.get('/projects/:projectId', verificationController.getProjectVerification);

router.post('/projects/:projectId/review', verificationController.reviewProject);
router.post('/projects/:projectId/approve', verificationController.approveProject);
router.post('/projects/:projectId/reject', verificationController.rejectProject);
router.post('/inspections', inspectionValidation, verificationController.scheduleInspection);
router.put('/inspections/:inspectionId', verificationController.updateInspection);

module.exports = router;