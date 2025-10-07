// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title LovittiNFTMarketplace
 * @dev Comprehensive NFT marketplace for agricultural products, services, and equipment
 * @author Lovitti Agro Mart Team
 */
contract LovittiNFTMarketplace is ReentrancyGuard, Ownable, Pausable {
    using Counters for Counters.Counter;

    // Events
    event NFTListed(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        string category,
        uint256 listingTime
    );

    event NFTSold(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        uint256 price,
        uint256 saleTime
    );

    event NFTUnlisted(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller
    );

    event EscrowCreated(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint256 escrowTime
    );

    event EscrowReleased(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 amount
    );

    event EscrowDisputed(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed disputer,
        string reason
    );

    event AuctionCreated(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 endTime
    );

    event BidPlaced(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount,
        uint256 bidTime
    );

    event AuctionEnded(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed winner,
        uint256 winningBid
    );

    // Structs
    struct NFTListing {
        address nftContract;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 listingTime;
        string category;
        uint256 expiryTime;
        bool isAuction;
        uint256 auctionEndTime;
        uint256 reservePrice;
        uint256 currentBid;
        address currentBidder;
        uint256 bidCount;
    }

    struct EscrowTransaction {
        address buyer;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        bool isReleased;
        uint256 escrowTime;
        uint256 expiresAt;
        string deliveryStatus;
        bool isDisputed;
        string disputeReason;
    }

    struct RoyaltyInfo {
        address recipient;
        uint256 percentage; // Basis points (100 = 1%)
    }

    // State Variables
    Counters.Counter private _listingIds;
    Counters.Counter private _escrowIds;

    mapping(uint256 => NFTListing) public listings;
    mapping(address => mapping(uint256 => uint256)) public tokenToListingId;
    mapping(uint256 => EscrowTransaction) public escrows;
    mapping(bytes32 => uint256) public orderToEscrowId;
    
    mapping(address => mapping(uint256 => RoyaltyInfo)) public tokenRoyalties;
    mapping(address => bool) public authorizedNFTs;
    
    uint256 public platformFeePercentage = 250; // 2.5% in basis points
    address public platformFeeRecipient;
    uint256 public escrowDuration = 7 days;
    uint256 public auctionDuration = 3 days;
    
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10% max
    uint256 public constant MAX_ROYALTY = 1000; // 10% max
    uint256 public constant BASIS_POINTS = 10000;

    // Modifiers
    modifier onlyAuthorizedNFT(address nftContract) {
        require(authorizedNFTs[nftContract], "NFT contract not authorized");
        _;
    }

    modifier onlyNFTOwner(address nftContract, uint256 tokenId) {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not NFT owner");
        _;
    }

    modifier listingExists(uint256 listingId) {
        require(listingId > 0 && listingId <= _listingIds.current(), "Listing does not exist");
        _;
    }

    modifier escrowExists(uint256 escrowId) {
        require(escrowId > 0 && escrowId <= _escrowIds.current(), "Escrow does not exist");
        _;
    }

    // Constructor
    constructor(address _platformFeeRecipient) {
        platformFeeRecipient = _platformFeeRecipient;
    }

    // NFT Listing Functions
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price,
        string memory category,
        uint256 expiryTime,
        bool isAuction,
        uint256 reservePrice
    ) external 
        nonReentrant 
        whenNotPaused 
        onlyAuthorizedNFT(nftContract)
        onlyNFTOwner(nftContract, tokenId)
    {
        require(price > 0, "Price must be greater than 0");
        require(bytes(category).length > 0, "Category required");
        require(expiryTime > block.timestamp, "Invalid expiry time");
        
        if (isAuction) {
            require(reservePrice > 0 && reservePrice <= price, "Invalid reserve price");
        }

        // Check if already listed
        uint256 existingListingId = tokenToListingId[nftContract][tokenId];
        require(existingListingId == 0 || !listings[existingListingId].isActive, "Already listed");

        _listingIds.increment();
        uint256 listingId = _listingIds.current();

        listings[listingId] = NFTListing({
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true,
            listingTime: block.timestamp,
            category: category,
            expiryTime: expiryTime,
            isAuction: isAuction,
            auctionEndTime: isAuction ? block.timestamp + auctionDuration : 0,
            reservePrice: reservePrice,
            currentBid: 0,
            currentBidder: address(0),
            bidCount: 0
        });

        tokenToListingId[nftContract][tokenId] = listingId;

        emit NFTListed(nftContract, tokenId, msg.sender, price, category, block.timestamp);
    }

    function buyNFT(
        address nftContract,
        uint256 tokenId
    ) external payable nonReentrant whenNotPaused {
        uint256 listingId = tokenToListingId[nftContract][tokenId];
        require(listingId > 0, "NFT not listed");
        
        NFTListing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(!listing.isAuction, "Use placeBid for auctions");
        require(block.timestamp <= listing.expiryTime, "Listing expired");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own NFT");

        // Transfer NFT
        IERC721(nftContract).transferFrom(listing.seller, msg.sender, tokenId);

        // Process payment
        _processPayment(listing.seller, listing.price, nftContract, tokenId);

        // Update listing
        listing.isActive = false;

        emit NFTSold(nftContract, tokenId, msg.sender, listing.seller, listing.price, block.timestamp);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
    }

    function placeBid(
        address nftContract,
        uint256 tokenId
    ) external payable nonReentrant whenNotPaused {
        uint256 listingId = tokenToListingId[nftContract][tokenId];
        require(listingId > 0, "NFT not listed");
        
        NFTListing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.isAuction, "Not an auction");
        require(block.timestamp <= listing.auctionEndTime, "Auction ended");
        require(msg.value > listing.currentBid, "Bid too low");
        require(msg.sender != listing.seller, "Cannot bid on own NFT");

        // Refund previous bidder
        if (listing.currentBidder != address(0)) {
            payable(listing.currentBidder).transfer(listing.currentBid);
        }

        // Update bid
        listing.currentBid = msg.value;
        listing.currentBidder = msg.sender;
        listing.bidCount++;

        emit BidPlaced(nftContract, tokenId, msg.sender, msg.value, block.timestamp);
    }

    function endAuction(address nftContract, uint256 tokenId) external nonReentrant {
        uint256 listingId = tokenToListingId[nftContract][tokenId];
        require(listingId > 0, "NFT not listed");
        
        NFTListing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(listing.isAuction, "Not an auction");
        require(block.timestamp > listing.auctionEndTime, "Auction not ended");
        require(
            msg.sender == listing.seller || msg.sender == listing.currentBidder || msg.sender == owner(),
            "Not authorized"
        );

        if (listing.currentBid >= listing.reservePrice) {
            // Auction successful
            IERC721(nftContract).transferFrom(listing.seller, listing.currentBidder, tokenId);
            _processPayment(listing.seller, listing.currentBid, nftContract, tokenId);
            
            emit AuctionEnded(nftContract, tokenId, listing.currentBidder, listing.currentBid);
        } else {
            // Auction failed - refund bidder
            if (listing.currentBidder != address(0)) {
                payable(listing.currentBidder).transfer(listing.currentBid);
            }
        }

        listing.isActive = false;
    }

    // Escrow Functions
    function createEscrow(
        address nftContract,
        uint256 tokenId,
        address buyer
    ) external payable nonReentrant whenNotPaused {
        uint256 listingId = tokenToListingId[nftContract][tokenId];
        require(listingId > 0, "NFT not listed");
        
        NFTListing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(msg.sender == buyer, "Only buyer can create escrow");
        require(msg.value >= listing.price, "Insufficient payment");

        _escrowIds.increment();
        uint256 escrowId = _escrowIds.current();

        escrows[escrowId] = EscrowTransaction({
            buyer: buyer,
            seller: listing.seller,
            nftContract: nftContract,
            tokenId: tokenId,
            amount: listing.price,
            isReleased: false,
            escrowTime: block.timestamp,
            expiresAt: block.timestamp + escrowDuration,
            deliveryStatus: "PENDING_DELIVERY",
            isDisputed: false,
            disputeReason: ""
        });

        bytes32 orderHash = keccak256(abi.encodePacked(nftContract, tokenId, buyer, block.timestamp));
        orderToEscrowId[orderHash] = escrowId;

        // Deactivate listing
        listing.isActive = false;

        emit EscrowCreated(nftContract, tokenId, buyer, listing.seller, listing.price, block.timestamp);
    }

    function updateDeliveryStatus(
        uint256 escrowId,
        string memory status
    ) external escrowExists(escrowId) {
        EscrowTransaction storage escrow = escrows[escrowId];
        require(msg.sender == escrow.seller, "Only seller can update status");
        require(!escrow.isReleased, "Escrow already released");
        require(!escrow.isDisputed, "Escrow under dispute");

        escrow.deliveryStatus = status;
    }

    function confirmDelivery(uint256 escrowId) external escrowExists(escrowId) {
        EscrowTransaction storage escrow = escrows[escrowId];
        require(msg.sender == escrow.buyer, "Only buyer can confirm delivery");
        require(!escrow.isReleased, "Escrow already released");
        require(!escrow.isDisputed, "Escrow under dispute");

        escrow.deliveryStatus = "DELIVERED";
    }

    function releaseEscrow(uint256 escrowId) external escrowExists(escrowId) {
        EscrowTransaction storage escrow = escrows[escrowId];
        require(msg.sender == escrow.buyer || msg.sender == owner(), "Not authorized");
        require(!escrow.isReleased, "Escrow already released");
        require(!escrow.isDisputed, "Escrow under dispute");

        // Transfer NFT
        IERC721(escrow.nftContract).transferFrom(escrow.seller, escrow.buyer, escrow.tokenId);

        // Process payment
        _processPayment(escrow.seller, escrow.amount, escrow.nftContract, escrow.tokenId);

        escrow.isReleased = true;

        emit EscrowReleased(escrow.nftContract, escrow.tokenId, escrow.seller, escrow.amount);
    }

    function disputeEscrow(
        uint256 escrowId,
        string memory reason
    ) external escrowExists(escrowId) {
        EscrowTransaction storage escrow = escrows[escrowId];
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller,
            "Not party to escrow"
        );
        require(!escrow.isReleased, "Escrow already released");
        require(!escrow.isDisputed, "Already disputed");

        escrow.isDisputed = true;
        escrow.disputeReason = reason;

        emit EscrowDisputed(escrow.nftContract, escrow.tokenId, msg.sender, reason);
    }

    function resolveDispute(
        uint256 escrowId,
        bool favorSeller
    ) external escrowExists(escrowId) onlyOwner {
        EscrowTransaction storage escrow = escrows[escrowId];
        require(escrow.isDisputed, "Not disputed");
        require(!escrow.isReleased, "Already resolved");

        if (favorSeller) {
            // Release to seller
            _processPayment(escrow.seller, escrow.amount, escrow.nftContract, escrow.tokenId);
        } else {
            // Refund buyer
            payable(escrow.buyer).transfer(escrow.amount);
            IERC721(escrow.nftContract).transferFrom(escrow.buyer, escrow.seller, escrow.tokenId);
        }

        escrow.isReleased = true;
    }

    // Royalty Functions
    function setTokenRoyalty(
        address nftContract,
        uint256 tokenId,
        address recipient,
        uint256 percentage
    ) external onlyNFTOwner(nftContract, tokenId) {
        require(percentage <= MAX_ROYALTY, "Royalty too high");
        
        tokenRoyalties[nftContract][tokenId] = RoyaltyInfo({
            recipient: recipient,
            percentage: percentage
        });
    }

    // Internal Functions
    function _processPayment(
        address seller,
        uint256 amount,
        address nftContract,
        uint256 tokenId
    ) internal {
        uint256 platformFee = (amount * platformFeePercentage) / BASIS_POINTS;
        uint256 royaltyAmount = 0;
        
        // Calculate royalties
        RoyaltyInfo memory royalty = tokenRoyalties[nftContract][tokenId];
        if (royalty.recipient != address(0)) {
            royaltyAmount = (amount * royalty.percentage) / BASIS_POINTS;
        }

        uint256 sellerAmount = amount - platformFee - royaltyAmount;

        // Transfer payments
        if (platformFee > 0) {
            payable(platformFeeRecipient).transfer(platformFee);
        }
        
        if (royaltyAmount > 0) {
            payable(royalty.recipient).transfer(royaltyAmount);
        }
        
        payable(seller).transfer(sellerAmount);
    }

    // View Functions
    function getListing(uint256 listingId) external view returns (NFTListing memory) {
        require(listingId > 0 && listingId <= _listingIds.current(), "Invalid listing ID");
        return listings[listingId];
    }

    function getEscrow(uint256 escrowId) external view returns (EscrowTransaction memory) {
        require(escrowId > 0 && escrowId <= _escrowIds.current(), "Invalid escrow ID");
        return escrows[escrowId];
    }

    function getActiveListings() external view returns (NFTListing[] memory) {
        uint256 totalListings = _listingIds.current();
        uint256 activeCount = 0;

        // Count active listings
        for (uint256 i = 1; i <= totalListings; i++) {
            if (listings[i].isActive) {
                activeCount++;
            }
        }

        // Create array
        NFTListing[] memory activeListings = new NFTListing[](activeCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= totalListings; i++) {
            if (listings[i].isActive) {
                activeListings[index] = listings[i];
                index++;
            }
        }

        return activeListings;
    }

    // Admin Functions
    function authorizeNFT(address nftContract) external onlyOwner {
        authorizedNFTs[nftContract] = true;
    }

    function deauthorizeNFT(address nftContract) external onlyOwner {
        authorizedNFTs[nftContract] = false;
    }

    function setPlatformFee(uint256 _platformFeePercentage) external onlyOwner {
        require(_platformFeePercentage <= MAX_PLATFORM_FEE, "Fee too high");
        platformFeePercentage = _platformFeePercentage;
    }

    function setEscrowDuration(uint256 _escrowDuration) external onlyOwner {
        escrowDuration = _escrowDuration;
    }

    function setAuctionDuration(uint256 _auctionDuration) external onlyOwner {
        auctionDuration = _auctionDuration;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency Functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function emergencyPause() external onlyOwner {
        _pause();
    }
}

// Interface for ERC721
interface IERC721 {
    function ownerOf(uint256 tokenId) external view returns (address);
    function transferFrom(address from, address to, uint256 tokenId) external;
}
