// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {
    struct Product {
        bytes32 productId;
        address farmer;
        string name;
        string category;
        uint256 quantity;
        uint256 price;
        uint256 timestamp;
        bool isActive;
    }

    struct SupplyChainStep {
        bytes32 stepId;
        bytes32 productId;
        address actor;
        string action;
        string location;
        uint256 timestamp;
        string metadata;
    }

    struct QualityCheck {
        bytes32 checkId;
        bytes32 productId;
        address inspector;
        string checkType;
        bool passed;
        string notes;
        uint256 timestamp;
    }

    mapping(bytes32 => Product) public products;
    mapping(bytes32 => SupplyChainStep[]) public supplyChainSteps;
    mapping(bytes32 => QualityCheck[]) public qualityChecks;
    mapping(address => bool) public authorizedInspectors;

    event ProductCreated(bytes32 indexed productId, address indexed farmer, string name);
    event SupplyChainStepAdded(bytes32 indexed productId, address indexed actor, string action);
    event QualityCheckPerformed(bytes32 indexed productId, address indexed inspector, bool passed);
    event InspectorAuthorized(address indexed inspector);

    modifier onlyAuthorizedInspector() {
        require(authorizedInspectors[msg.sender], "Not authorized inspector");
        _;
    }

    function createProduct(
        bytes32 productId,
        string memory name,
        string memory category,
        uint256 quantity,
        uint256 price
    ) external {
        require(products[productId].timestamp == 0, "Product already exists");
        
        products[productId] = Product({
            productId: productId,
            farmer: msg.sender,
            name: name,
            category: category,
            quantity: quantity,
            price: price,
            timestamp: block.timestamp,
            isActive: true
        });

        emit ProductCreated(productId, msg.sender, name);
    }

    function addSupplyChainStep(
        bytes32 productId,
        string memory action,
        string memory location,
        string memory metadata
    ) external {
        require(products[productId].timestamp > 0, "Product does not exist");
        
        bytes32 stepId = keccak256(abi.encodePacked(productId, block.timestamp, msg.sender));
        
        supplyChainSteps[productId].push(SupplyChainStep({
            stepId: stepId,
            productId: productId,
            actor: msg.sender,
            action: action,
            location: location,
            timestamp: block.timestamp,
            metadata: metadata
        }));

        emit SupplyChainStepAdded(productId, msg.sender, action);
    }

    function performQualityCheck(
        bytes32 productId,
        string memory checkType,
        bool passed,
        string memory notes
    ) external onlyAuthorizedInspector {
        require(products[productId].timestamp > 0, "Product does not exist");
        
        bytes32 checkId = keccak256(abi.encodePacked(productId, block.timestamp, msg.sender));
        
        qualityChecks[productId].push(QualityCheck({
            checkId: checkId,
            productId: productId,
            inspector: msg.sender,
            checkType: checkType,
            passed: passed,
            notes: notes,
            timestamp: block.timestamp
        }));

        emit QualityCheckPerformed(productId, msg.sender, passed);
    }

    function authorizeInspector(address inspector) external {
        // In production, this should be restricted to admin or governance
        authorizedInspectors[inspector] = true;
        emit InspectorAuthorized(inspector);
    }

    function getProduct(bytes32 productId) external view returns (Product memory) {
        return products[productId];
    }

    function getSupplyChainSteps(bytes32 productId) external view returns (SupplyChainStep[] memory) {
        return supplyChainSteps[productId];
    }

    function getQualityChecks(bytes32 productId) external view returns (QualityCheck[] memory) {
        return qualityChecks[productId];
    }

    function getProductTraceability(bytes32 productId) external view returns (
        Product memory,
        SupplyChainStep[] memory,
        QualityCheck[] memory
    ) {
        return (
            products[productId],
            supplyChainSteps[productId],
            qualityChecks[productId]
        );
    }
}
