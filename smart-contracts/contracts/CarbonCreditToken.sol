// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract CarbonCreditToken is ERC1155, AccessControl, Pausable, ERC1155Supply {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    string public name;
    string public symbol;
    
    // Mapping from token ID to project details
    mapping(uint256 => ProjectInfo) public projects;
    
    // Mapping from token ID to metadata URI
    mapping(uint256 => string) private _tokenURIs;
    
    struct ProjectInfo {
        string projectId;
        string projectName;
        uint256 vintage;
        string projectType;
        address developer;
        bool isVerified;
        uint256 totalSupply;
        uint256 retiredAmount;
    }
    
    event TokensMinted(
        uint256 indexed tokenId,
        address indexed to,
        uint256 amount,
        string projectId
    );
    
    event TokensRetired(
        uint256 indexed tokenId,
        address indexed from,
        uint256 amount,
        string reason
    );
    
    event ProjectVerified(uint256 indexed tokenId, address indexed verifier);
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _uri
    ) ERC1155(_uri) {
        name = _name;
        symbol = _symbol;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }
    
    function mintCredits(
        address to,
        uint256 tokenId,
        uint256 amount,
        string memory projectId,
        string memory projectName,
        uint256 vintage,
        string memory projectType,
        string memory metadataURI
    ) external onlyRole(MINTER_ROLE) {
        require(bytes(projectId).length > 0, "Project ID cannot be empty");
        require(amount > 0, "Amount must be greater than 0");
        require(vintage >= 2020 && vintage <= 2030, "Invalid vintage year");
        
        // Initialize project info if first mint
        if (projects[tokenId].developer == address(0)) {
            projects[tokenId] = ProjectInfo({
                projectId: projectId,
                projectName: projectName,
                vintage: vintage,
                projectType: projectType,
                developer: to,
                isVerified: false,
                totalSupply: amount,
                retiredAmount: 0
            });
        } else {
            projects[tokenId].totalSupply += amount;
        }
        
        _setTokenURI(tokenId, metadataURI);
        _mint(to, tokenId, amount, "");
        
        emit TokensMinted(tokenId, to, amount, projectId);
    }
    
    function retireCredits(
        uint256 tokenId,
        uint256 amount,
        string memory reason
    ) external {
        require(balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be greater than 0");
        
        projects[tokenId].retiredAmount += amount;
        _burn(msg.sender, tokenId, amount);
        
        emit TokensRetired(tokenId, msg.sender, amount, reason);
    }
    
    function verifyProject(uint256 tokenId) external onlyRole(MINTER_ROLE) {
        require(projects[tokenId].developer != address(0), "Project does not exist");
        projects[tokenId].isVerified = true;
        
        emit ProjectVerified(tokenId, msg.sender);
    }
    
    function setTokenURI(uint256 tokenId, string memory tokenURI) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        _setTokenURI(tokenId, tokenURI);
    }
    
    function uri(uint256 tokenId) 
        public 
        view 
        override 
        returns (string memory) 
    {
        string memory tokenURI = _tokenURIs[tokenId];
        return bytes(tokenURI).length > 0 ? tokenURI : super.uri(tokenId);
    }
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function getProjectInfo(uint256 tokenId) 
        external 
        view 
        returns (ProjectInfo memory) 
    {
        return projects[tokenId];
    }
    
    function getAvailableCredits(uint256 tokenId) 
        external 
        view 
        returns (uint256) 
    {
        return totalSupply(tokenId) - projects[tokenId].retiredAmount;
    }
    
    function _setTokenURI(uint256 tokenId, string memory tokenURI) private {
        _tokenURIs[tokenId] = tokenURI;
    }
    
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}