// routes/buyer.routes.js
const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication and credit_buyer role
router.use(authMiddleware);
router.use(roleCheck(['credit_buyer']));

// Get buyer statistics (dashboard stats)
router.get('/stats', buyerController.getBuyerStats);

// Get buyer's credit holdings
router.get('/holdings', buyerController.getMyHoldings);

// Get buyer's transaction history
router.get('/transactions', buyerController.getMyTransactions);

// Get wallet balance from blockchain
router.get('/wallet-balance', buyerController.getWalletBalance);

// Get holdings grouped by project
router.get('/holdings-by-project', buyerController.getHoldingsByProject);

module.exports = router;