// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ProjectRegistry is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant DEVELOPER_ROLE = keccak256("DEVELOPER_ROLE");
    
    enum ProjectStatus { Submitted, UnderReview, Approved, Rejected, Active, Completed }
    
    struct Project {
        string projectId;
        string name;
        string description;
        string projectType;
        string location;