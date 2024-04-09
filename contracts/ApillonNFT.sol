// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
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
    uint256 public immutable pricePerMint;

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
    uint256 public immutable maxSupply;

    /**
     * Reserve (only used if isDrop == true).
     */
    uint256 public reserve;

    /**
     * Is drop (if false, only owner can mint)
     */
    bool public immutable isDrop;

    /**
     * Drop start timestamp
     */
    uint256 public dropStart;

    /**
     * Royalties fee percent.
     */
    uint256 public immutable royaltiesFees;

    /**
     * Royalties address.
     */
    address public royaltiesAddress;

    /**
     * Mint counter.
     */
    uint256 public mintCounter;

    /**
     * Is ID autoincrement
     */
    bool public immutable isAutoIncrement;


    /**
     * @param _name - Collection name
     * @param _symbol - Collection symbol
     * @param _initBaseURI - Metadata baseURI
     * @param _baseExtension - Metadata baseExtension
     * @param _settings - Bool settings [isDrop, isSoulbound, isRevokable]
     * @param _pricePerMint - Mint price (only relevant if isDrop == true)
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
        uint256 _pricePerMint,
        uint256 _dropStart,
        uint256 _maxSupply,
        uint256 _reserve,
        address _royaltiesAddress,
        uint256 _royaltiesFees
    ) ERC721(_name, _symbol) {
        baseURI = _initBaseURI;
        baseExtension = _baseExtension;

        isDrop = _settings[0];
        isSoulbound = _settings[1];
        isRevokable = _settings[2];
        isAutoIncrement = _settings[3];
        
        pricePerMint = _pricePerMint;
        dropStart = _dropStart;
        maxSupply = _maxSupply;
        if (isDrop) {
            require(_reserve <= maxSupply, "reserve too high.");
            reserve = _reserve;
        }

        royaltiesAddress = _royaltiesAddress;
        require(_royaltiesFees <= 10000, "royaltiesFees too high.");
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

    function mint(
        address to,
        uint256 numToMint
    ) external payable {
        mintIds(to, numToMint, new uint256[](0));
    }

    function mintIds(
        address to,
        uint256 numToMint,
        uint256[] memory idsToMint
    ) public payable {
        require(isDrop, "isDrop == false");
        require(block.timestamp >= dropStart, "Minting not started yet.");

        if (isAutoIncrement) {
            require(
                numToMint > 0 && idsToMint.length == 0, 
                "isAutoIncrement ON: set numToMint > 0 & leave IDs empty"
            );
        } else {
            require(
                idsToMint.length > 0, 
                "isAutoIncrement OFF: specify IDs"
            );
            numToMint = idsToMint.length;
        }

        require(
            msg.value >= pricePerMint * numToMint, 
            "Insufficient amount."
        );

        require(
            mintCounter + numToMint <= maxSupply - reserve
        );

        for (uint16 i = 1; i <= numToMint; i++) {
            mintCounter += 1;
            if (isAutoIncrement) {
                _safeMint(to, mintCounter);
            } else {
                _safeMint(to, idsToMint[i - 1]);
            }
        }
    }

    function ownerMint(
        address to,
        uint256 numToMint
    ) external onlyOwner {
        ownerMintIds(to, numToMint, new uint256[](0));
    }

    function ownerMintIds(
        address to,
        uint256 numToMint,
        uint256[] memory idsToMint
    ) public onlyOwner {
        if (isAutoIncrement) {
            require(
                numToMint > 0 && idsToMint.length == 0, 
                "isAutoIncrement ON: set numToMint > 0 & leave IDs empty"
            );
        } else {
            require(
                idsToMint.length > 0, 
                "isAutoIncrement OFF: specify IDs"
            );
            numToMint = idsToMint.length;
        }

        if (isDrop) {
            require(numToMint <= reserve, "quantity > reserve"); 
            reserve -= numToMint;
        } else {
            require(mintCounter + numToMint <= maxSupply);
        }
        
        for (uint16 i = 1; i <= numToMint; i++) {
            mintCounter += 1;
            if (isAutoIncrement) {
                _safeMint(to, mintCounter);
            } else {
                _safeMint(to, idsToMint[i - 1]);
            }
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

    function allTokens() external view returns (uint256[] memory)
    {
        uint256 supply = totalSupply();
        uint256[] memory tokenIds = new uint256[](supply);
        for (uint256 i; i < supply; i++) {
            tokenIds[i] = tokenByIndex(i);
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

    // only owner
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension) external onlyOwner {
        baseExtension = _newBaseExtension;
    }

    function withdrawRaised(address to, uint256 amount) external onlyOwner {
        (bool os, ) = to.call{value: amount}("");
        require(os);
    }

    /**
     * Set royalties address.
     */
    function updateRoyaltyRecipient(address newRoyaltyRecipient) external onlyOwner {
        royaltiesAddress = newRoyaltyRecipient;
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
        royaltyAmount = (value * royaltiesFees) / 10000;
    }

    function getRoyaltyRecipient() public view virtual returns (address) {
        return royaltiesAddress;
    }

    function getRoyaltyPercentage() public view virtual returns (uint256) {
        return royaltiesFees;
    }
}