// SPDX-License-Identifier: Unlicense

pragma solidity 0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ApillonPinkNft is ERC721Enumerable, Ownable {

    using Strings for uint256;

    string public baseURI;

    /**
     * Metadata URI extension (.json)
     */
    string public baseExtension;

    /**
     * @dev AC token ids.
     */
    uint256 public nextId = 1;

    /**
     * @dev Mapping of addresses that already minted.
     */
    mapping(address => bool) public walletUsed;

    /**
     * @dev Time when the drop starts
     */
    uint256 public dropStart;

    /**
     * @dev Time when the drop ends
     */
    uint256 public dropEnd;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _baseExtension,
        uint256 _dropStart,
        uint256 _dropEnd
    ) ERC721(_name, _symbol) {
        baseURI = _initBaseURI;
        baseExtension = _baseExtension;
        dropStart = _dropStart;
        dropEnd = _dropEnd;
    }

    // internal
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // public
    function mint() external {
        require(block.timestamp >= dropStart, "Drop not yet available");
        require(block.timestamp < dropEnd, "Drop ended");
        require(!walletUsed[msg.sender], "Wallet already minted");

        _safeMint(msg.sender, nextId);
        nextId++;

        walletUsed[msg.sender] = true;
    }

    function setDropStart(uint256 _dropStart) public onlyOwner {
        dropStart = _dropStart;
    }

    function setDropEnd(uint256 _dropEnd) public onlyOwner {
        dropEnd = _dropEnd;
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension) external onlyOwner {
        baseExtension = _newBaseExtension;
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
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory currentBaseURI = _baseURI();
        return bytes(currentBaseURI).length > 0
            ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
            : "";
    }

}
