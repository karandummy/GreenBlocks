const express = require('express');
const { body } = require('express-validator');
const creditController = require('../controllers/creditController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// Validation rules
const creditClaimValidation = [
  body('projectId').isMongoId().withMessage('Valid project ID is required'),
  body('amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('vintage').isNumeric().isInt({ min: 2020, max: 2030 }).withMessage('Valid vintage year is required')
];

const creditPurchaseValidation = [
  body('creditId').isMongoId().withMessage('Valid credit ID is required'),
  body('amount').isNumeric().isFloat({ min: 0 }).withMessage('Amount must be a positive number')
];

// Routes
router.get('/', authMiddleware, creditController.getAllCredits);
router.get('/marketplace', authMiddleware, creditController.getMarketplaceCredits);
router.get('/my-credits', authMiddleware, creditController.getMyCredits);
router.get('/:id', authMiddleware, creditController.getCreditById);

// Project Developer routes
router.post('/claim', authMiddleware, roleCheck(['project_developer']), creditClaimValidation, creditController.claimCredits);

// Credit Buyer routes
router.post('/purchase', authMiddleware, roleCheck(['credit_buyer']), creditPurchaseValidation, creditController.purchaseCredits);
router.post('/retire', authMiddleware, roleCheck(['credit_buyer']), creditController.retireCredits);

// Regulatory routes
router.post('/:id/verify', authMiddleware, roleCheck(['regulatory_body']), creditController.verifyCredits);
router.post('/:id/approve', authMiddleware, roleCheck(['regulatory_body']), creditController.approveCredits);
router.post('/:id/reject', authMiddleware, roleCheck(['regulatory_body']), creditController.rejectCredits);

module.exports = router;