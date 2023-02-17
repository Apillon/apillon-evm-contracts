// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC2981.sol";

contract ApillonNFT is ERC721Enumerable, Ownable, ERC2981 {
    using Strings for uint256;

    string baseURI;
    string public baseExtension = ""; // left it here on purpose, we might move the metadata json to pinata, where the extension needs to be .json
    uint public price;

    bool public immutable isSoulbound;
    bool public immutable isRevokable;
    uint public immutable maxSupply; // 0 = unlimited
    uint public dropStart; // timestamp when mint starts
    uint public reserve; // reserved for owner to be minted free of charge

    /**
     * Royalties fee percent.
     */
    uint public royaltiesFees;

    /**
     * Royalties address.
     */
    address public royaltiesAddress;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        address _royaltiesAddress,
        uint _royaltiesFees,
        bool _isSoulbound,
        bool _isRevokable,
        uint _maxSupply,
        uint _reserve,
        uint _price,
        uint _dropStart
    ) ERC721(_name, _symbol) {
        baseURI = _initBaseURI;
        royaltiesAddress = _royaltiesAddress;
        isSoulbound = _isSoulbound;
        isRevokable = _isRevokable;
        maxSupply = _maxSupply;
        price = _price;
        dropStart = _dropStart;

        require (
            _maxSupply == 0 || _reserve <= _maxSupply, 
            "Reserve too high."
        );
        reserve = _reserve;
        
        require(_royaltiesFees <= 100, "royaltiesFees too high.");
        royaltiesFees = _royaltiesFees;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // internal
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // public
    function mint(
        address _user,
        uint16 _quantity
    ) external payable {
        require(block.timestamp >= dropStart, "Minting not started yet.");
        require(
            msg.value >= price * _quantity, 
            "Insufficient amount."
        );

        uint supply = totalSupply();

        require(
            maxSupply == 0 || supply + _quantity <= maxSupply - reserve
        );

        for (uint16 i = 1; i <= _quantity; i++) {
            _safeMint(_user, supply + i);
        }
    }

    function mintReserve(uint16 _quantity, address _receiver)
        external
        onlyOwner
    {
        uint supply = totalSupply();
        require(_quantity <= reserve, "The quantity exceeds the reserve.");
        require(supply + _quantity <= maxSupply);
        reserve -= _quantity;
        for (uint16 i = 1; i <= _quantity; i++) {
            _safeMint(_receiver, supply + i);
        }
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(!isSoulbound, "Transfers not allowed!");
        super._transfer(from, to, tokenId);
    }

    function burn(uint tokenId) external {
        require(isRevokable, "NFT not revokable!");
        require(
            msg.sender == owner() || msg.sender == ERC721.ownerOf(tokenId),
            "Unauthorized."
        );
        _burn(tokenId);
    }

    function walletOfOwner(address _owner) external view returns (uint256[] memory)
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

    //only owner
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension) external onlyOwner {
        baseExtension = _newBaseExtension;
    }

    function withdraw() external payable onlyOwner {
        (bool os, ) = payable(owner()).call{value: address(this).balance}("");
        require(os);
    }

    /**
     * Set royalties fees.
     */
    function setRoyaltiesFees(uint _royaltiesFees) external onlyOwner {
        require(_royaltiesFees <= 100, "royaltiesFees too high.");
        royaltiesFees = _royaltiesFees;
    }

    /**
     * Set royalties address.
     */
    function setRoyaltiesAddress(address _royaltiesAddress) external onlyOwner {
        royaltiesAddress = _royaltiesAddress;
    }

    /**
     * Set price
     */
    function setPrice(uint _price) external onlyOwner {
        price = _price;
    }

    /**
     * Set dropStart (only if not started yet)
     */
    function setDropStart(uint _dropStart) external onlyOwner {
        require(dropStart > block.timestamp, "Minting already started!");
        dropStart = _dropStart;
    }

    /**
     * Get royalties information.
     */
    function royaltyInfo(uint256, uint256 value)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        receiver = royaltiesAddress;
        royaltyAmount = (value * royaltiesFees) / 100;
    }
}