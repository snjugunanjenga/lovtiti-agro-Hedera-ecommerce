// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Logistics {
    struct TransportRequest {
        bytes32 requestId;
        address requester;
        address transporter;
        string origin;
        string destination;
        uint256 distance;
        uint256 weight;
        uint256 price;
        uint256 timestamp;
        TransportStatus status;
    }

    struct Route {
        bytes32 routeId;
        address transporter;
        string[] waypoints;
        uint256 totalDistance;
        uint256 estimatedTime;
        uint256 fuelCost;
        bool isActive;
    }

    struct Delivery {
        bytes32 deliveryId;
        bytes32 requestId;
        address transporter;
        string currentLocation;
        uint256 timestamp;
        DeliveryStatus status;
        string notes;
    }

    enum TransportStatus {
        Pending,
        Accepted,
        InTransit,
        Delivered,
        Cancelled
    }

    enum DeliveryStatus {
        Pending,
        PickedUp,
        InTransit,
        Delivered,
        Failed
    }

    mapping(bytes32 => TransportRequest) public transportRequests;
    mapping(bytes32 => Route) public routes;
    mapping(bytes32 => Delivery) public deliveries;
    mapping(address => bool) public authorizedTransporters;
    mapping(address => uint256) public transporterRatings;

    event TransportRequestCreated(bytes32 indexed requestId, address indexed requester);
    event TransportRequestAccepted(bytes32 indexed requestId, address indexed transporter);
    event DeliveryStarted(bytes32 indexed deliveryId, address indexed transporter);
    event DeliveryCompleted(bytes32 indexed deliveryId, address indexed transporter);
    event TransporterAuthorized(address indexed transporter);

    modifier onlyAuthorizedTransporter() {
        require(authorizedTransporters[msg.sender], "Not authorized transporter");
        _;
    }

    function createTransportRequest(
        bytes32 requestId,
        string memory origin,
        string memory destination,
        uint256 distance,
        uint256 weight,
        uint256 price
    ) external {
        require(transportRequests[requestId].timestamp == 0, "Request already exists");
        
        transportRequests[requestId] = TransportRequest({
            requestId: requestId,
            requester: msg.sender,
            transporter: address(0),
            origin: origin,
            destination: destination,
            distance: distance,
            weight: weight,
            price: price,
            timestamp: block.timestamp,
            status: TransportStatus.Pending
        });

        emit TransportRequestCreated(requestId, msg.sender);
    }

    function acceptTransportRequest(bytes32 requestId) external onlyAuthorizedTransporter {
        TransportRequest storage request = transportRequests[requestId];
        require(request.status == TransportStatus.Pending, "Request not pending");
        
        request.transporter = msg.sender;
        request.status = TransportStatus.Accepted;

        emit TransportRequestAccepted(requestId, msg.sender);
    }

    function createRoute(
        bytes32 routeId,
        string[] memory waypoints,
        uint256 totalDistance,
        uint256 estimatedTime,
        uint256 fuelCost
    ) external onlyAuthorizedTransporter {
        require(routes[routeId].transporter == address(0), "Route already exists");
        
        routes[routeId] = Route({
            routeId: routeId,
            transporter: msg.sender,
            waypoints: waypoints,
            totalDistance: totalDistance,
            estimatedTime: estimatedTime,
            fuelCost: fuelCost,
            isActive: true
        });
    }

    function startDelivery(
        bytes32 deliveryId,
        bytes32 requestId,
        string memory currentLocation
    ) external onlyAuthorizedTransporter {
        TransportRequest storage request = transportRequests[requestId];
        require(request.status == TransportStatus.Accepted, "Request not accepted");
        require(request.transporter == msg.sender, "Not assigned transporter");
        
        deliveries[deliveryId] = Delivery({
            deliveryId: deliveryId,
            requestId: requestId,
            transporter: msg.sender,
            currentLocation: currentLocation,
            timestamp: block.timestamp,
            status: DeliveryStatus.PickedUp,
            notes: ""
        });

        request.status = TransportStatus.InTransit;
        emit DeliveryStarted(deliveryId, msg.sender);
    }

    function updateDeliveryLocation(
        bytes32 deliveryId,
        string memory currentLocation,
        string memory notes
    ) external onlyAuthorizedTransporter {
        Delivery storage delivery = deliveries[deliveryId];
        require(delivery.transporter == msg.sender, "Not assigned transporter");
        require(delivery.status == DeliveryStatus.InTransit, "Delivery not in transit");
        
        delivery.currentLocation = currentLocation;
        delivery.notes = notes;
        delivery.timestamp = block.timestamp;
    }

    function completeDelivery(bytes32 deliveryId) external onlyAuthorizedTransporter {
        Delivery storage delivery = deliveries[deliveryId];
        require(delivery.transporter == msg.sender, "Not assigned transporter");
        require(delivery.status == DeliveryStatus.InTransit, "Delivery not in transit");
        
        delivery.status = DeliveryStatus.Delivered;
        delivery.timestamp = block.timestamp;

        // Update transport request status
        TransportRequest storage request = transportRequests[delivery.requestId];
        request.status = TransportStatus.Delivered;

        emit DeliveryCompleted(deliveryId, msg.sender);
    }

    function rateTransporter(address transporter, uint256 rating) external {
        require(rating >= 1 && rating <= 5, "Invalid rating");
        require(transporterRatings[transporter] > 0, "Transporter not found");
        
        // Simple average rating calculation
        transporterRatings[transporter] = (transporterRatings[transporter] + rating) / 2;
    }

    function authorizeTransporter(address transporter) external {
        // In production, this should be restricted to admin or governance
        authorizedTransporters[transporter] = true;
        transporterRatings[transporter] = 5; // Default rating
        emit TransporterAuthorized(transporter);
    }

    function getTransportRequest(bytes32 requestId) external view returns (TransportRequest memory) {
        return transportRequests[requestId];
    }

    function getDelivery(bytes32 deliveryId) external view returns (Delivery memory) {
        return deliveries[deliveryId];
    }

    function getRoute(bytes32 routeId) external view returns (Route memory) {
        return routes[routeId];
    }

    function getTransporterRating(address transporter) external view returns (uint256) {
        return transporterRatings[transporter];
    }
}
