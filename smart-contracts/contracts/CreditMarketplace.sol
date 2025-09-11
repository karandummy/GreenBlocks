// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./CarbonCreditToken.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CreditMarketplace is ReentrancyGuard, Ownable {
    CarbonCreditToken public carbonCreditToken;
    
    struct Listing {
        uint256 tokenId;
        uint256 amount;
        uint256 pricePerCredit;
        address seller;
        bool active;
        uint256 listedAt;
    }
    
    mapping(uint256 => Listing) public listings;
    uint256 public nextListingId;
    
    uint256 public platformFeePercent = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    event CreditListed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 pricePerCredit,
        address indexed seller
    );
    
    event CreditSold(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 totalPrice,
        address indexed seller,
        address indexed buyer
    );
    
    event ListingCanceled(uint256 indexed listingId);
    
    constructor(address _carbonCreditToken) {
        carbonCreditToken = CarbonCreditToken(_carbonCreditToken);
    }
    
    function listCredit(
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerCredit
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(pricePerCredit > 0, "Price must be greater than 0");
        require(
            carbonCreditToken.balanceOf(msg.sender, tokenId) >= amount,
            "Insufficient balance"
        );
        
        uint256 listingId = nextListingId++;
        
        listings[listingId] = Listing({
            tokenId: tokenId,
            amount: amount,
            pricePerCredit: pricePerCredit,
            seller: msg.sender,
            active: true,
            listedAt: block.timestamp
        });
        
        emit CreditListed(listingId, tokenId, amount, pricePerCredit, msg.sender);
    }
    
    function buyCredit(uint256 listingId, uint256 amount) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.active, "Listing not active");
        require(amount > 0 && amount <= listing.amount, "Invalid amount");
        require(msg.sender != listing.seller, "Cannot buy own listing");
        
        uint256 totalPrice = amount * listing.pricePerCredit;
        require(msg.value >= totalPrice, "Insufficient payment");
        
        // Calculate platform fee
        uint256 platformFee = (totalPrice * platformFeePercent) / FEE_DENOMINATOR;
        uint256 sellerAmount = totalPrice - platformFee;
        
        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }
        
        // Transfer tokens
        carbonCreditToken.safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId,
            amount,
            ""
        );
        
        // Transfer payments
        payable(listing.seller).transfer(sellerAmount);
        
        // Refund excess payment
        if (msg.value > totalPrice) {
            payable(msg.sender).transfer(msg.value - totalPrice);
        }
        
        emit CreditSold(
            listingId,
            listing.tokenId,
            amount,
            totalPrice,
            listing.seller,
            msg.sender
        );
    }
    
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Listing not active");
        
        listing.active = false;
        
        emit ListingCanceled(listingId);
    }
    
    function getActiveListing(uint256 listingId) external view returns (Listing memory) {
        Listing memory listing = listings[listingId];
        require(listing.active, "Listing not active");
        return listing;
    }
    
    function setPlatformFee(uint256 _platformFeePercent) external onlyOwner {
        require(_platformFeePercent <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = _platformFeePercent;
    }
    
    function withdrawPlatformFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}