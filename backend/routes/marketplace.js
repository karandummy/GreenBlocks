// routes/marketplace.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const marketplaceController = require('../controllers/marketplaceController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// List credits for sale (Project Developer only)
router.post('/list',
  authMiddleware,
  roleCheck(['project_developer']),
  [
    body('claimId').notEmpty().withMessage('Claim ID is required'),
    body('creditsToSell').isNumeric().withMessage('Credits to sell must be a number')
      .isFloat({ min: 0.01 }).withMessage('Credits to sell must be greater than 0')
  ],
  marketplaceController.listCredits
);

// Get all marketplace listings (Anyone authenticated)
router.get('/listings',
  authMiddleware,
  marketplaceController.getMarketplaceListings
);

// Get my listings (Project Developer only)
router.get('/my-listings',
  authMiddleware,
  roleCheck(['project_developer']),
  marketplaceController.getMyListings
);

// Buy credits (Credit Buyer only)
router.post('/buy',
  authMiddleware,
  roleCheck(['credit_buyer']),
  [
    body('listingId').notEmpty().withMessage('Listing ID is required'),
    body('creditsToBuy').isNumeric().withMessage('Credits to buy must be a number')
      .isFloat({ min: 1 }).withMessage('Must buy at least 1 credit'),
    body('transactionHash').optional().isString()
  ],
  marketplaceController.buyCredits
);

// Get single listing details (Anyone authenticated)
router.get('/:id',
  authMiddleware,
  marketplaceController.getListingById
);

// Cancel listing (Project Developer only - must be owner)
router.patch('/:id/cancel',
  authMiddleware,
  roleCheck(['project_developer']),
  marketplaceController.cancelListing
);

// Update listing price (if you want this feature later)
router.patch('/:id/update-price',
  authMiddleware,
  roleCheck(['project_developer']),
  [
    body('pricePerCredit').isNumeric().withMessage('Price must be a number')
      .isFloat({ min: 0.0001 }).withMessage('Price must be greater than 0')
  ],
  marketplaceController.updateListingPrice
);

module.exports = router;