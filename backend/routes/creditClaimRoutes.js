// routes/creditClaimRoutes.js
const express = require('express');
const { body } = require('express-validator');
const creditClaimController = require('../controllers/creditClaimController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Validation rules
const claimValidation = [
  body('projectId').notEmpty().withMessage('Project ID is required'),
  body('creditsRequested').isNumeric().withMessage('Credits requested must be a number'),
  body('reportingPeriod.startDate').isISO8601().withMessage('Valid start date is required'),
  body('reportingPeriod.endDate').isISO8601().withMessage('Valid end date is required')
];

const inspectionValidation = [
  body('inspectionDate').isISO8601().withMessage('Valid inspection date is required')
];

const completeInspectionValidation = [
  body('findings').notEmpty().withMessage('Findings are required'),
  body('inspectionResult').isIn(['passed', 'failed', 'partial']).withMessage('Invalid inspection result')
];

const issueCreditsValidation = [
  body('approvedCredits').isNumeric().withMessage('Approved credits must be a number')
];

const rejectValidation = [
  body('reason').notEmpty().withMessage('Rejection reason is required')
];

// Project Developer Routes
router.post(
  '/', 
  authMiddleware, 
  roleCheck(['project_developer']), 
  claimValidation, 
  creditClaimController.createClaim
);

router.get(
  '/my-claims', 
  authMiddleware, 
  roleCheck(['project_developer']), 
  creditClaimController.getMyClaims
);

// Regulatory Body Routes
router.get(
  '/', 
  authMiddleware, 
  roleCheck(['regulatory_body']), 
  creditClaimController.getAllClaims
);

router.get(
  '/:id', 
  authMiddleware, 
  creditClaimController.getClaimById
);

router.post(
  '/:id/schedule-inspection', 
  authMiddleware, 
  roleCheck(['regulatory_body']),
  inspectionValidation,
  creditClaimController.scheduleInspection
);

router.post(
  '/:id/complete-inspection', 
  authMiddleware, 
  roleCheck(['regulatory_body']),
  completeInspectionValidation,
  creditClaimController.completeInspection
);

router.post(
  '/:id/issue-credits', 
  authMiddleware, 
  roleCheck(['regulatory_body']),
  issueCreditsValidation,
  creditClaimController.issueCredits
);

router.post(
  '/:id/reject', 
  authMiddleware, 
  roleCheck(['regulatory_body']),
  rejectValidation,
  creditClaimController.rejectClaim
);

module.exports = router;