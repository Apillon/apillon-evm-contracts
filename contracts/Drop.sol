// SPDX-License-Identifier: Unlicense

pragma solidity 0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Drop is ERC721Enumerable, Ownable {
    using Strings for uint256;

    string public baseURI;

    /**
     * @dev AC token ids.
     */
    uint256 public nextId = 1;

    /**
     * @dev address signing on backend
     */
    address public signer;

    /**
     * @dev Mapping of addresses that already minted.
     */
    mapping(address => bool) public walletUsed;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        address _signer
    ) ERC721(_name, _symbol) {
        setBaseURI(_initBaseURI);

        require(_signer != address(0), "Zero address not allowed");
        signer = _signer;
    }

    // internal
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // public
    function mint(
        uint256 quantity,
        bytes memory _signature
    ) external {
        require(!walletUsed[msg.sender], "Wallet already minted");
        require(
            validateSig(
                msg.sender, 
                quantity, 
                _signature
            ), 
            "Invalid signature."
        );

        for(uint256 i = 0; i < quantity; i++) {
            _safeMint(msg.sender, nextId);
            nextId++;
        }

        walletUsed[msg.sender] = true;
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    /**
     * @dev Set signer address.
     * @param _signer Signer address
     */
    function setSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Zero address not allowed");
        signer = _signer;
    }

    function walletOfOwner(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory currentBaseURI = _baseURI();
        return
            bytes(currentBaseURI).length > 0
                ? string(abi.encodePacked(currentBaseURI, tokenId.toString()))
                : "";
    }

    /**
    * @dev Validates signature.
    * @param _user User wanting to mint.
    * @param _amount Amount of NFTs.
    * @param _signature Signature of above data.
    */
    function validateSig(
        address _user, 
        uint256 _amount,
        bytes memory _signature
    ) public view returns (bool) {
        bytes32 dataHash = keccak256(
            abi.encodePacked(_user, _amount, address(this))
        );
        bytes32 message = ECDSA.toEthSignedMessageHash(dataHash);
        address receivedAddress = ECDSA.recover(message, _signature);
        return receivedAddress == signer;
    }
}
