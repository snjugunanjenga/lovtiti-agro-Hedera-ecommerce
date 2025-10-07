// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SupplyChainNFT
 * @dev Smart contract for tracking agricultural product supply chain with NFT integration
 * @author Lovitti Agro Mart Team
 */
contract SupplyChainNFT is Ownable, Pausable {
    using Counters for Counters.Counter;

    // Events
    event SupplyChainStepAdded(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 indexed stepIndex,
        string action,
        string location,
        address actor,
        uint256 timestamp
    );

    event StepVerified(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 indexed stepIndex,
        address verifier,
        bool verified,
        uint256 timestamp
    );

    event QualityCheckPerformed(
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 indexed stepIndex,
        string checkType,
        bool passed,
        string notes,
        address inspector
    );

    // Structs
    struct SupplyChainStep {
        uint256 stepIndex;
        string action;
        string location;
        address actor;
        uint256 timestamp;
        string metadata; // JSON string with additional data
        bool verified;
        address verifier;
        uint256 verifiedAt;
        string verificationNotes;
    }

    struct QualityCheck {
        string checkType;
        bool passed;
        uint256 score;
        string notes;
        address inspector;
        uint256 timestamp;
        string[] evidence; // IPFS hashes
    }

    struct SustainabilityMetrics {
        uint256 waterUsage; // liters
        uint256 carbonFootprint; // kg CO2
        bool pesticideFree;
        bool organicCertified;
        string energySource;
        uint256 wasteReduction; // percentage
        uint256 timestamp;
    }

    // State Variables
    mapping(address => mapping(uint256 => SupplyChainStep[])) public supplyChainHistory;
    mapping(address => mapping(uint256 => QualityCheck[])) public qualityChecks;
    mapping(address => mapping(uint256 => SustainabilityMetrics)) public sustainabilityData;
    
    mapping(address => bool) public authorizedNFTs;
    mapping(address => bool) public authorizedActors;
    
    Counters.Counter private _stepCounter;
    
    uint256 public constant MAX_STEPS = 1000;
    uint256 public constant MAX_METADATA_LENGTH = 1000;

    // Modifiers
    modifier onlyAuthorizedNFT(address nftContract) {
        require(authorizedNFTs[nftContract], "NFT contract not authorized");
        _;
    }

    modifier onlyAuthorizedActor() {
        require(authorizedActors[msg.sender] || msg.sender == owner(), "Not authorized actor");
        _;
    }

    modifier validStepIndex(address nftContract, uint256 tokenId, uint256 stepIndex) {
        require(stepIndex < supplyChainHistory[nftContract][tokenId].length, "Invalid step index");
        _;
    }

    // Constructor
    constructor() {
        // Initialize with deployer as authorized actor
        authorizedActors[msg.sender] = true;
    }

    // Supply Chain Step Functions
    function addSupplyChainStep(
        address nftContract,
        uint256 tokenId,
        string memory action,
        string memory location,
        string memory metadata
    ) external 
        onlyAuthorizedActor
        onlyAuthorizedNFT(nftContract)
        whenNotPaused
    {
        require(bytes(action).length > 0, "Action required");
        require(bytes(location).length > 0, "Location required");
        require(bytes(metadata).length <= MAX_METADATA_LENGTH, "Metadata too long");
        
        SupplyChainStep[] storage history = supplyChainHistory[nftContract][tokenId];
        require(history.length < MAX_STEPS, "Maximum steps reached");

        uint256 stepIndex = history.length;
        
        history.push(SupplyChainStep({
            stepIndex: stepIndex,
            action: action,
            location: location,
            actor: msg.sender,
            timestamp: block.timestamp,
            metadata: metadata,
            verified: false,
            verifier: address(0),
            verifiedAt: 0,
            verificationNotes: ""
        }));

        _stepCounter.increment();

        emit SupplyChainStepAdded(
            nftContract,
            tokenId,
            stepIndex,
            action,
            location,
            msg.sender,
            block.timestamp
        );
    }

    function verifyStep(
        address nftContract,
        uint256 tokenId,
        uint256 stepIndex,
        bool verified,
        string memory notes
    ) external 
        onlyAuthorizedActor
        validStepIndex(nftContract, tokenId, stepIndex)
        whenNotPaused
    {
        SupplyChainStep storage step = supplyChainHistory[nftContract][tokenId][stepIndex];
        require(!step.verified, "Step already verified");

        step.verified = verified;
        step.verifier = msg.sender;
        step.verifiedAt = block.timestamp;
        step.verificationNotes = notes;

        emit StepVerified(
            nftContract,
            tokenId,
            stepIndex,
            msg.sender,
            verified,
            block.timestamp
        );
    }

    function performQualityCheck(
        address nftContract,
        uint256 tokenId,
        string memory checkType,
        bool passed,
        uint256 score,
        string memory notes,
        string[] memory evidence
    ) external 
        onlyAuthorizedActor
        onlyAuthorizedNFT(nftContract)
        whenNotPaused
    {
        require(bytes(checkType).length > 0, "Check type required");
        require(score <= 100, "Score must be <= 100");
        require(evidence.length <= 10, "Too many evidence files");

        qualityChecks[nftContract][tokenId].push(QualityCheck({
            checkType: checkType,
            passed: passed,
            score: score,
            notes: notes,
            inspector: msg.sender,
            timestamp: block.timestamp,
            evidence: evidence
        }));

        emit QualityCheckPerformed(
            nftContract,
            tokenId,
            qualityChecks[nftContract][tokenId].length - 1,
            checkType,
            passed,
            notes,
            msg.sender
        );
    }

    function updateSustainabilityMetrics(
        address nftContract,
        uint256 tokenId,
        uint256 waterUsage,
        uint256 carbonFootprint,
        bool pesticideFree,
        bool organicCertified,
        string memory energySource,
        uint256 wasteReduction
    ) external 
        onlyAuthorizedActor
        onlyAuthorizedNFT(nftContract)
        whenNotPaused
    {
        require(wasteReduction <= 100, "Waste reduction must be <= 100%");
        require(bytes(energySource).length > 0, "Energy source required");

        sustainabilityData[nftContract][tokenId] = SustainabilityMetrics({
            waterUsage: waterUsage,
            carbonFootprint: carbonFootprint,
            pesticideFree: pesticideFree,
            organicCertified: organicCertified,
            energySource: energySource,
            wasteReduction: wasteReduction,
            timestamp: block.timestamp
        });
    }

    // Batch Operations
    function addMultipleSteps(
        address nftContract,
        uint256 tokenId,
        string[] memory actions,
        string[] memory locations,
        string[] memory metadata
    ) external 
        onlyAuthorizedActor
        onlyAuthorizedNFT(nftContract)
        whenNotPaused
    {
        require(
            actions.length == locations.length && 
            locations.length == metadata.length,
            "Arrays length mismatch"
        );
        require(actions.length <= 10, "Too many steps at once");

        for (uint256 i = 0; i < actions.length; i++) {
            addSupplyChainStep(nftContract, tokenId, actions[i], locations[i], metadata[i]);
        }
    }

    // View Functions
    function getSupplyChainHistory(
        address nftContract,
        uint256 tokenId
    ) external view returns (SupplyChainStep[] memory) {
        return supplyChainHistory[nftContract][tokenId];
    }

    function getQualityChecks(
        address nftContract,
        uint256 tokenId
    ) external view returns (QualityCheck[] memory) {
        return qualityChecks[nftContract][tokenId];
    }

    function getSustainabilityMetrics(
        address nftContract,
        uint256 tokenId
    ) external view returns (SustainabilityMetrics memory) {
        return sustainabilityData[nftContract][tokenId];
    }

    function getStepCount(
        address nftContract,
        uint256 tokenId
    ) external view returns (uint256) {
        return supplyChainHistory[nftContract][tokenId].length;
    }

    function getVerificationRate(
        address nftContract,
        uint256 tokenId
    ) external view returns (uint256) {
        SupplyChainStep[] memory history = supplyChainHistory[nftContract][tokenId];
        if (history.length == 0) return 0;

        uint256 verifiedCount = 0;
        for (uint256 i = 0; i < history.length; i++) {
            if (history[i].verified) {
                verifiedCount++;
            }
        }

        return (verifiedCount * 100) / history.length;
    }

    function getQualityScore(
        address nftContract,
        uint256 tokenId
    ) external view returns (uint256) {
        QualityCheck[] memory checks = qualityChecks[nftContract][tokenId];
        if (checks.length == 0) return 0;

        uint256 totalScore = 0;
        for (uint256 i = 0; i < checks.length; i++) {
            totalScore += checks[i].score;
        }

        return totalScore / checks.length;
    }

    function getLatestStep(
        address nftContract,
        uint256 tokenId
    ) external view returns (SupplyChainStep memory) {
        SupplyChainStep[] memory history = supplyChainHistory[nftContract][tokenId];
        require(history.length > 0, "No steps found");
        return history[history.length - 1];
    }

    function getStepsByActor(
        address nftContract,
        uint256 tokenId,
        address actor
    ) external view returns (SupplyChainStep[] memory) {
        SupplyChainStep[] memory history = supplyChainHistory[nftContract][tokenId];
        uint256 count = 0;

        // Count steps by actor
        for (uint256 i = 0; i < history.length; i++) {
            if (history[i].actor == actor) {
                count++;
            }
        }

        // Create filtered array
        SupplyChainStep[] memory actorSteps = new SupplyChainStep[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < history.length; i++) {
            if (history[i].actor == actor) {
                actorSteps[index] = history[i];
                index++;
            }
        }

        return actorSteps;
    }

    function getStepsByAction(
        address nftContract,
        uint256 tokenId,
        string memory action
    ) external view returns (SupplyChainStep[] memory) {
        SupplyChainStep[] memory history = supplyChainHistory[nftContract][tokenId];
        uint256 count = 0;

        // Count steps by action
        for (uint256 i = 0; i < history.length; i++) {
            if (keccak256(bytes(history[i].action)) == keccak256(bytes(action))) {
                count++;
            }
        }

        // Create filtered array
        SupplyChainStep[] memory actionSteps = new SupplyChainStep[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < history.length; i++) {
            if (keccak256(bytes(history[i].action)) == keccak256(bytes(action))) {
                actionSteps[index] = history[i];
                index++;
            }
        }

        return actionSteps;
    }

    // Admin Functions
    function authorizeNFT(address nftContract) external onlyOwner {
        authorizedNFTs[nftContract] = true;
    }

    function deauthorizeNFT(address nftContract) external onlyOwner {
        authorizedNFTs[nftContract] = false;
    }

    function authorizeActor(address actor) external onlyOwner {
        authorizedActors[actor] = true;
    }

    function deauthorizeActor(address actor) external onlyOwner {
        authorizedActors[actor] = false;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency Functions
    function emergencyUpdateStep(
        address nftContract,
        uint256 tokenId,
        uint256 stepIndex,
        string memory newAction,
        string memory newLocation
    ) external onlyOwner validStepIndex(nftContract, tokenId, stepIndex) {
        SupplyChainStep storage step = supplyChainHistory[nftContract][tokenId][stepIndex];
        step.action = newAction;
        step.location = newLocation;
    }
}
