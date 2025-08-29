const express = require('express');
const blockchainController = require('../controllers/blockchainController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Routes
router.get('/transactions', authMiddleware, blockchainController.getTransactions);
router.get('/transactions/:hash', authMiddleware, blockchainController.getTransactionByHash);
router.get('/blocks/:blockNumber', authMiddleware, blockchainController.getBlockInfo);
router.get('/contracts/carbon-credit', authMiddleware, blockchainController.getCarbonCreditContract);
router.get('/wallet/:address/balance', authMiddleware, blockchainController.getWalletBalance);

// Blockchain interaction routes
router.post('/deploy-contract', authMiddleware, blockchainController.deployContract);
router.post('/mint-tokens', authMiddleware, blockchainController.mintTokens);
router.post('/transfer-tokens', authMiddleware, blockchainController.transferTokens);
router.post('/burn-tokens', authMiddleware, blockchainController.burnTokens);

module.exports = router;