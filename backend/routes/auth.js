const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Validation rules

// Routes
router.post('/register',authController.register);
router.post('/login',  authController.login);
router.get('/verify-token', authMiddleware, authController.verifyToken);
// router.get('/profile', authMiddleware, authController.getProfile);
// router.put('/profile', authMiddleware, authController.updateProfile);

router.get('/verify-wallet', authController.verifyWallet);

module.exports = router;