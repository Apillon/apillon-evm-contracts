// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC2981.sol";

contract ApillonNFT is ERC721Enumerable, Ownable, ERC2981 {
    using Strings for uint256;

    /**
     * Metadata URI    
     */
    string baseURI;

    /**
     * Metadata URI extension (.json)
     */
    string public baseExtension;

    /**
     * Price per NFT (only for regular users, owner mints for free)
     */
    uint public price;

    /**
     * Is soulbound (true = transfer not allowed | false = transfer allowed).
     */
    bool public immutable isSoulbound;

    /**
     * Is revokable (burnable by owned).
     */
    bool public immutable isRevokable;

    /**
     * Max supply (0 = unlimited).
     */
    uint public immutable maxSupply;

    /**
     * Reserve (only used if isDrop == true).
     */
    uint public reserve;


    /**
     * Is drop (if false, only owner can mint)
     */
    bool public immutable isDrop;

    /**
     * Drop start timestamp
     */
    uint public dropStart;

    /**
     * Royalties fee percent.
     */
    uint public royaltiesFees;

    /**
     * Royalties address.
     */
    address public royaltiesAddress;

    /**
     * @param _name - Collection name
     * @param _symbol - Collection symbol
     * @param _initBaseURI - Metadata baseURI
     * @param _baseExtension - Metadata baseExtension
     * @param _settings - Bool settings [isDrop, isSoulbound, isRevokable]
     * @param _price - Mint price
     * @param _dropStart - drop start (only relevant if isDrop == true)
     * @param _maxSupply - max supply (0 = unlimited)
     * @param _reserve - reserve for owner (only relevant if isDrop == true)
     * @param _royaltiesAddress - royalties address
     * @param _royaltiesFees - royalties fee
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _baseExtension,
        bool[] memory _settings,
        uint _price,
        uint _dropStart,
        uint _maxSupply,
        uint _reserve,
        address _royaltiesAddress,
        uint _royaltiesFees
    ) ERC721(_name, _symbol) {
        baseURI = _initBaseURI;
        baseExtension = _baseExtension;

        isDrop = _settings[0];
        isSoulbound = _settings[1];
        isRevokable = _settings[2];
        
        price = _price;
        dropStart = _dropStart;
        maxSupply = _maxSupply;
        if (isDrop) {
            require(maxSupply == 0 || _reserve <= maxSupply, "reserve too high.");
            reserve = _reserve;
        }

        royaltiesAddress = _royaltiesAddress;
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
        require(isDrop, "isDrop == false");
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

    function ownerMint(uint16 _quantity, address _receiver)
        external
        onlyOwner
    {
        uint supply = totalSupply();
        if (isDrop) {
            require(_quantity <= reserve, "quantity > reserve"); 
            reserve -= _quantity;
        } else {
            require(maxSupply == 0 || supply + _quantity <= maxSupply);
        }
        
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

    function burn(uint tokenId) external onlyOwner {
        require(isRevokable, "NFT not revokable!");
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