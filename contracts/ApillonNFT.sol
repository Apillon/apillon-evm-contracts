// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC2981.sol";

contract ApillonNFT is ERC721Enumerable, Ownable, ERC2981 {
    using Strings for uint256;

    /**
     * Overrides default base uri per token.
     */
    mapping(uint256 => string) tokenMetadataUriOverride;

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

    /**
     * Checks which interfaces this contract supports.
     * @param interfaceId bytes4 of keccak of all functions supported in a contract.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * Internal override for baseURI.
     */
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    /**
     * If "drop" functionality is enables users can buy NFTs directly from the contract for a
     * specified price. This takes native chain token as payments and mints the user a NFT.
     * @param to Address receiving the NFTs.
     * @param numToMint Amount of NFTs to mint.
     */
    function mint(
        address to,
        uint256 numToMint
    ) external payable {
        mintIds(to, numToMint, new uint256[](0));
    }

    /**
     * If "drop" functionality is enables users can buy NFTs directly from the contract for a
     * specified price. This takes native chain token as payments and mints the user a NFT.
     * @param to Address receiving the NFTs.
     * @param numToMint Amount of NFTs to mint.
     * @param idsToMint List of NFTs IDs to mint.
     */
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

    /**
     * If "drop" functionality is disabled or its enabled and reserve for owner is specified then
     * only contract owner can mint the NFTs via this function.
     * @param to Address receiving the NFTs.
     * @param numToMint Amount of NFTs to mint.
     */
    function ownerMint(
        address to,
        uint256 numToMint
    ) external onlyOwner {
        ownerMintIdsWithUri(to, numToMint, new uint256[](0), new string[](0));
    }

    /**
     * If "drop" functionality is disabled or its enabled and reserve for owner is specified then
     * only contract owner can mint the NFTs via this function.
     * @param to Address receiving the NFTs.
     * @param numToMint Amount of NFTs to mint.
     * @param idsToMint List of NFTs IDs to mint.
     */
    function ownerMintIds(
        address to,
        uint256 numToMint,
        uint256[] memory idsToMint
    ) public onlyOwner {
        ownerMintIdsWithUri(to, numToMint, idsToMint, new string[](0));
    }

    /**
     * If "drop" functionality is disabled or its enabled and reserve for owner is specified then
     * only contract owner can mint the NFTs via this function. Owner can choose to specify to
     * override/set specific metadata URI for specific NFTs ignoring the baseURI and extension.
     * @param to Address receiving the NFTs.
     * @param numToMint Amount of NFTs to mint.
     * @param idsToMint List of NFTs IDs to mint.
     * @param URIs List of metadata URIs for minting NFTs.
     */
    function ownerMintIdsWithUri(
        address to,
        uint256 numToMint,
        uint256[] memory idsToMint,
        string[] memory URIs
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
        
        uint256 idToMint = 0;
        for (uint16 i = 1; i <= numToMint; i++) {
            mintCounter += 1;
            if (isAutoIncrement) {
                idToMint = mintCounter; 
            } else {
                idToMint = idsToMint[i - 1];
            }
            _safeMint(to,idToMint);
            if(URIs.length > 0 && bytes(URIs[i-1]).length > 0) {
                tokenMetadataUriOverride[idToMint] = URIs[i-1];
            }
        }
    }

    /**
     * Override of internal _transfer function to disable transfer in case of soulbound NFTs.
     * @param from From address.
     * @param to To address.
     * @param tokenId Token id we are transfering.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(!isSoulbound, "Transfers not allowed!");
        super._transfer(from, to, tokenId);
    }

    /**
     * Function that can destroy a NFT if "revokable" functionality is enabled on the contract.
     * @param tokenId Id of the token we are burning.
     */
    function burn(uint tokenId) external onlyOwner {
        require(isRevokable, "NFT not revokable!");
        _burn(tokenId);
    }

    /**
     * Function to get all the token ids a user has in the wallet.
     * @param _owner Wallet address.
     */
    function walletOfOwner(address _owner) external view returns (uint256[] memory)
    {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    /**
     * Function that returns all token ids that exist on the smart contract.
     */
    function allTokens() external view returns (uint256[] memory)
    {
        uint256 supply = totalSupply();
        uint256[] memory tokenIds = new uint256[](supply);
        for (uint256 i; i < supply; i++) {
            tokenIds[i] = tokenByIndex(i);
        }
        return tokenIds;
    }

    /**
     * Function to view the metadate URI of a specific NFT.
     * @param tokenId NFT Id.
     */
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

        if (bytes(tokenMetadataUriOverride[tokenId]).length > 0) {
          return tokenMetadataUriOverride[tokenId];
        }

        string memory currentBaseURI = _baseURI();
        return bytes(currentBaseURI).length > 0
            ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
            : "";
    }

    // only owner
    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    function setTokenURI(uint256 _tokenId, string memory _newTokenURI) external onlyOwner {
        tokenMetadataUriOverride[_tokenId] = _newTokenURI;
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