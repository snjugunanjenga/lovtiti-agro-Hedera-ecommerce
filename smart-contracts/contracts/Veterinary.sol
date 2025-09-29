// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Veterinary {
    struct HealthRecord {
        bytes32 recordId;
        bytes32 animalId;
        address owner;
        address veterinarian;
        string animalType;
        string breed;
        uint256 age;
        string healthStatus;
        string[] vaccinations;
        string[] treatments;
        uint256 timestamp;
        bool isActive;
    }

    struct Consultation {
        bytes32 consultationId;
        address farmer;
        address veterinarian;
        string issue;
        string diagnosis;
        string treatment;
        uint256 timestamp;
        ConsultationStatus status;
        uint256 fee;
    }

    struct EquipmentLease {
        bytes32 leaseId;
        address lessor;
        address lessee;
        string equipmentType;
        string equipmentName;
        uint256 dailyRate;
        uint256 duration;
        uint256 startTime;
        uint256 endTime;
        LeaseStatus status;
    }

    enum ConsultationStatus {
        Pending,
        Scheduled,
        InProgress,
        Completed,
        Cancelled
    }

    enum LeaseStatus {
        Available,
        Leased,
        Returned,
        Maintenance
    }

    mapping(bytes32 => HealthRecord) public healthRecords;
    mapping(bytes32 => Consultation) public consultations;
    mapping(bytes32 => EquipmentLease) public equipmentLeases;
    mapping(address => bool) public authorizedVeterinarians;
    mapping(address => uint256) public veterinarianRatings;
    mapping(address => bytes32[]) public farmerAnimals;

    event HealthRecordCreated(bytes32 indexed recordId, address indexed owner, string animalType);
    event ConsultationScheduled(bytes32 indexed consultationId, address indexed farmer, address indexed veterinarian);
    event EquipmentLeased(bytes32 indexed leaseId, address indexed lessor, address indexed lessee);
    event VeterinarianAuthorized(address indexed veterinarian);

    modifier onlyAuthorizedVeterinarian() {
        require(authorizedVeterinarians[msg.sender], "Not authorized veterinarian");
        _;
    }

    function createHealthRecord(
        bytes32 recordId,
        bytes32 animalId,
        string memory animalType,
        string memory breed,
        uint256 age,
        string memory healthStatus
    ) external {
        require(healthRecords[recordId].timestamp == 0, "Record already exists");
        
        healthRecords[recordId] = HealthRecord({
            recordId: recordId,
            animalId: animalId,
            owner: msg.sender,
            veterinarian: address(0),
            animalType: animalType,
            breed: breed,
            age: age,
            healthStatus: healthStatus,
            vaccinations: new string[](0),
            treatments: new string[](0),
            timestamp: block.timestamp,
            isActive: true
        });

        farmerAnimals[msg.sender].push(animalId);
        emit HealthRecordCreated(recordId, msg.sender, animalType);
    }

    function updateHealthRecord(
        bytes32 recordId,
        string memory healthStatus,
        string[] memory newVaccinations,
        string[] memory newTreatments
    ) external onlyAuthorizedVeterinarian {
        HealthRecord storage record = healthRecords[recordId];
        require(record.timestamp > 0, "Record does not exist");
        
        record.veterinarian = msg.sender;
        record.healthStatus = healthStatus;
        
        // Add new vaccinations
        for (uint256 i = 0; i < newVaccinations.length; i++) {
            record.vaccinations.push(newVaccinations[i]);
        }
        
        // Add new treatments
        for (uint256 i = 0; i < newTreatments.length; i++) {
            record.treatments.push(newTreatments[i]);
        }
        
        record.timestamp = block.timestamp;
    }

    function scheduleConsultation(
        bytes32 consultationId,
        address farmer,
        string memory issue,
        uint256 fee
    ) external onlyAuthorizedVeterinarian {
        require(consultations[consultationId].timestamp == 0, "Consultation already exists");
        
        consultations[consultationId] = Consultation({
            consultationId: consultationId,
            farmer: farmer,
            veterinarian: msg.sender,
            issue: issue,
            diagnosis: "",
            treatment: "",
            timestamp: block.timestamp,
            status: ConsultationStatus.Scheduled,
            fee: fee
        });

        emit ConsultationScheduled(consultationId, farmer, msg.sender);
    }

    function completeConsultation(
        bytes32 consultationId,
        string memory diagnosis,
        string memory treatment
    ) external onlyAuthorizedVeterinarian {
        Consultation storage consultation = consultations[consultationId];
        require(consultation.veterinarian == msg.sender, "Not assigned veterinarian");
        require(consultation.status == ConsultationStatus.Scheduled, "Consultation not scheduled");
        
        consultation.diagnosis = diagnosis;
        consultation.treatment = treatment;
        consultation.status = ConsultationStatus.Completed;
        consultation.timestamp = block.timestamp;
    }

    function createEquipmentLease(
        bytes32 leaseId,
        string memory equipmentType,
        string memory equipmentName,
        uint256 dailyRate,
        uint256 duration
    ) external onlyAuthorizedVeterinarian {
        require(equipmentLeases[leaseId].lessor == address(0), "Lease already exists");
        
        equipmentLeases[leaseId] = EquipmentLease({
            leaseId: leaseId,
            lessor: msg.sender,
            lessee: address(0),
            equipmentType: equipmentType,
            equipmentName: equipmentName,
            dailyRate: dailyRate,
            duration: duration,
            startTime: 0,
            endTime: 0,
            status: LeaseStatus.Available
        });
    }

    function leaseEquipment(
        bytes32 leaseId,
        uint256 startTime
    ) external {
        EquipmentLease storage lease = equipmentLeases[leaseId];
        require(lease.status == LeaseStatus.Available, "Equipment not available");
        require(startTime >= block.timestamp, "Invalid start time");
        
        lease.lessee = msg.sender;
        lease.startTime = startTime;
        lease.endTime = startTime + (lease.duration * 1 days);
        lease.status = LeaseStatus.Leased;

        emit EquipmentLeased(leaseId, lease.lessor, msg.sender);
    }

    function returnEquipment(bytes32 leaseId) external {
        EquipmentLease storage lease = equipmentLeases[leaseId];
        require(lease.lessee == msg.sender, "Not the lessee");
        require(lease.status == LeaseStatus.Leased, "Equipment not leased");
        
        lease.status = LeaseStatus.Returned;
    }

    function rateVeterinarian(address veterinarian, uint256 rating) external {
        require(rating >= 1 && rating <= 5, "Invalid rating");
        require(authorizedVeterinarians[veterinarian], "Veterinarian not found");
        
        // Simple average rating calculation
        veterinarianRatings[veterinarian] = (veterinarianRatings[veterinarian] + rating) / 2;
    }

    function authorizeVeterinarian(address veterinarian) external {
        // In production, this should be restricted to admin or governance
        authorizedVeterinarians[veterinarian] = true;
        veterinarianRatings[veterinarian] = 5; // Default rating
        emit VeterinarianAuthorized(veterinarian);
    }

    function getHealthRecord(bytes32 recordId) external view returns (HealthRecord memory) {
        return healthRecords[recordId];
    }

    function getConsultation(bytes32 consultationId) external view returns (Consultation memory) {
        return consultations[consultationId];
    }

    function getEquipmentLease(bytes32 leaseId) external view returns (EquipmentLease memory) {
        return equipmentLeases[leaseId];
    }

    function getFarmerAnimals(address farmer) external view returns (bytes32[] memory) {
        return farmerAnimals[farmer];
    }

    function getVeterinarianRating(address veterinarian) external view returns (uint256) {
        return veterinarianRatings[veterinarian];
    }
}
