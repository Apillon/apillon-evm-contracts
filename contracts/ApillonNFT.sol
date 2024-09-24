// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import {ERC721, ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import "./ERC2981.sol";

contract ApillonNFT is ERC721Enumerable, AccessControl, ERC2981 {

    bytes32 public constant CONTROLLER_ROLE = keccak256("CONTROLLER_ROLE");

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
     * 
     */
    struct MintParameters {
        address to;
        uint256 numToMint;
        uint256[] idsToMint;
        string[] URIs;
    }

    /**
     * @param _name - Collection name
     * @param _symbol - Collection symbol
     * @param _initBaseURI - Metadata baseURI
     * @param _baseExtension - Metadata baseExtension
     * @param _settings - Bool settings [isDrop, isSoulbound, isRevokable]
     * @param _numbers - All uints256 inputs in an array [_pricePerMint, _dropStart, _maxSupply, _reserve, _royaltiesFees].
     * _pricePerMint - Mint price (only relevant if isDrop == true)
     * _dropStart - drop start (only relevant if isDrop == true)
     * _maxSupply - max supply (0 = unlimited)
     * _reserve - reserve for owner (only relevant if isDrop == true)
     * _royaltiesFees - royalties fee
     * @param _royaltiesAddress - royalties address
     * @param _admin - Address of admin role
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _baseExtension,
        bool[] memory _settings,
        uint256[] memory _numbers, // [_pricePerMint, _dropStart, _maxSupply, _reserve, _royaltiesFees]
        address _royaltiesAddress,
        address _admin
    ) ERC721(_name, _symbol) {
        baseURI = _initBaseURI;
        baseExtension = _baseExtension;

        isDrop = _settings[0];
        isSoulbound = _settings[1];
        isRevokable = _settings[2];
        isAutoIncrement = _settings[3];
        
        pricePerMint = _numbers[0];
        dropStart = _numbers[1];
        maxSupply = _numbers[2];
        if (isDrop) {
            require(_numbers[3] <= maxSupply, "reserve too high.");
            reserve = _numbers[3];
        }

        royaltiesAddress = _royaltiesAddress;
        require(_numbers[4] <= 10000, "royaltiesFees too high.");
        royaltiesFees = _numbers[4];
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(CONTROLLER_ROLE, msg.sender);
    }

    /**
     * Checks which interfaces this contract supports.
     * @param interfaceId bytes4 of keccak of all functions supported in a contract.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC2981, AccessControl)
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
     * If "drop" functionality is enabled users can buy NFTs directly from the contract for a
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
     * If "drop" functionality is enabled users can buy NFTs directly from the contract for a
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
            _safeMint(to, isAutoIncrement ? mintCounter : idsToMint[i - 1]);
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
    ) external onlyRole(CONTROLLER_ROLE) {
        MintParameters[] memory mints = new MintParameters[](1);
        mints[0] = MintParameters({to: to, numToMint: numToMint, idsToMint: new uint256[](0), URIs: new string[](0)});
        ownerMintIdsWithUri(mints);
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
    ) public onlyRole(CONTROLLER_ROLE) {
        MintParameters[] memory mints = new MintParameters[](1);
        mints[0] = MintParameters({to: to, numToMint: numToMint, idsToMint: idsToMint, URIs: new string[](0)});
        ownerMintIdsWithUri(mints);
    }

  
    /**
     * If "drop" functionality is disabled or its enabled and reserve for owner is specified then
     * only contract owner can mint the NFTs via this function. Owner can choose to specify to
     * override/set specific metadata URI for specific NFTs ignoring the baseURI and extension.
     * @param mints array of mints     
     * to Address receiving the NFTs.
     *  numToMint Amount of NFTs to mint.
     *  idsToMint List of NFTs IDs to mint.
     *  URIs List of metadata URIs for minting NFTs.
     */
    function ownerMintIdsWithUri(
      MintParameters[] memory mints
    ) public onlyRole(CONTROLLER_ROLE) {
      uint256 idToMint = 0;
      for (uint16 j = 0; j < mints.length; j++) {
        MintParameters memory mintTemp =  mints[j];
        if (isAutoIncrement) {
            require(
                mintTemp.numToMint > 0 && mintTemp.idsToMint.length == 0, 
                "isAutoIncrement ON: set numToMint > 0 & leave IDs empty"
            );
        } else {
            require(
                mintTemp.idsToMint.length > 0, 
                "isAutoIncrement OFF: specify IDs"
            );
            mintTemp.numToMint = mintTemp.idsToMint.length;
        }
        if (isDrop) {
            require(mintTemp.numToMint <= reserve, "quantity > reserve"); 
            reserve -= mintTemp.numToMint;
        } else {
            require(mintCounter + mintTemp.numToMint <= maxSupply, "quantity > supply");
        }
        
        idToMint = 0;
        for (uint8 i = 0; i < mintTemp.numToMint; i++) {
            mintCounter += 1;
            if (isAutoIncrement) {
                idToMint = mintCounter; 
            } else {
                idToMint = mintTemp.idsToMint[i];
            }
            _safeMint(mintTemp.to, idToMint);
            if(mintTemp.URIs.length > 0 && bytes(mintTemp.URIs[i]).length > 0) {
                tokenMetadataUriOverride[idToMint] = mintTemp.URIs[i];
            }
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
    function burn(uint tokenId) external onlyRole(CONTROLLER_ROLE) {
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
     * Function to view the metadata URI of a specific NFT.
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
    function setBaseURI(string memory _newBaseURI) external onlyRole(CONTROLLER_ROLE) {
        baseURI = _newBaseURI;
    }

    function setTokenURI(uint256 _tokenId, string memory _newTokenURI) external onlyRole(CONTROLLER_ROLE) {
        tokenMetadataUriOverride[_tokenId] = _newTokenURI;
    }

    function setBaseExtension(string memory _newBaseExtension) external onlyRole(CONTROLLER_ROLE) {
        baseExtension = _newBaseExtension;
    }

    function withdrawRaised(address to, uint256 amount) external onlyRole(CONTROLLER_ROLE) {
        (bool os, ) = to.call{value: amount}("");
        require(os);
    }

    /**
     * Set royalties address.
     */
    function updateRoyaltyRecipient(address newRoyaltyRecipient) external onlyRole(CONTROLLER_ROLE) {
        royaltiesAddress = newRoyaltyRecipient;
    }

    /**
     * Set dropStart (only if not started yet)
     */
    function setDropStart(uint _dropStart) external onlyRole(CONTROLLER_ROLE) {
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

    /**
     * @notice This is a dangerous function. If you set admin to wrong address it is lost forever.
     * If you don't know what you are doing we recomment using grantRole and revokeRole invidually.
     * @param _newAdmin Address of the new admin.
     */
    function transferAdmin(address _newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
      _grantRole(DEFAULT_ADMIN_ROLE, _newAdmin);
      _revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}