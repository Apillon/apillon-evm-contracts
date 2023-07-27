// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@rmrk-team/evm-contracts/contracts/implementations/nativeTokenPay/RMRKNestableImpl.sol";

contract ApillonNFTNestable is RMRKNestableImpl {
    using Strings for uint256;

    /**
     * Metadata URI    
     */
    string private _tokenUri;
    
    /**
     * Metadata URI extension (.json)
     */
    string public baseExtension;

    /**
     * Is soulbound (true = transfer not allowed | false = transfer allowed).
     */
    bool public immutable isSoulbound;

    /**
     * Is revokable (burnable by owner).
     */
    bool public immutable isRevokable;

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

    // Mapping from owner to list of owned token IDs
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;

    // Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) private _ownedTokensIndex;

    // Array with all token ids, used for enumeration
    uint256[] private _allTokens;

    // Mapping from token id to position in the allTokens array
    mapping(uint256 => uint256) private _allTokensIndex;

    /**
     * @param _name - Collection name
     * @param _symbol - Collection symbol
     * @param _initBaseURI - Metadata baseURI
     * @param _settings - Bool settings [isDrop, isSoulbound, isRevokable]
     * @param _dropStart - drop start (only relevant if isDrop == true)
     * @param _reserve - reserve for owner (only relevant if isDrop == true)
     * @param _data - InitData params for collection
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _baseExtension,
        bool[] memory _settings,
        uint _dropStart,
        uint _reserve,
        InitData memory _data
    ) RMRKNestableImpl(
            _name,
            _symbol,
            _initBaseURI, // collectionMetadata
            _initBaseURI, // tokenURI
            _data
    ) {
        _tokenUri = _initBaseURI;
        baseExtension = _baseExtension;

        isDrop = _settings[0];
        isSoulbound = _settings[1];
        isRevokable = _settings[2];
        
        dropStart = _dropStart;

        if (isDrop) {
            require(_reserve <= _data.maxSupply, "reserve too high.");
            reserve = _reserve;
        }
    }

    function ownerMint(
        address _receiver,
        uint16 _numToMint
    ) external onlyOwner {
        _ownerMint(_receiver, _numToMint, false, 0);
    }

    function ownerNestMint(
        address _receiver,
        uint16 _numToMint, 
        uint256 destinationId
    ) external onlyOwner {
        _ownerMint(_receiver, _numToMint, true, destinationId);
    }

    function _ownerMint(
        address _receiver,
        uint16 _numToMint, 
        bool nestMint, 
        uint256 destinationId
    ) private {
        if (isDrop) {
            require(_numToMint <= reserve, "_numToMint > reserve"); 
            reserve -= _numToMint;
        }

        if (_numToMint == uint256(0)) revert RMRKMintZero();
        if (_numToMint + _totalSupply > _maxSupply) revert RMRKMintOverMax();

        uint256 nextToken = _totalSupply + 1;
        unchecked {
            _totalSupply += _numToMint;
        }
        uint256 totalSupplyOffset = _totalSupply + 1;

        for (uint256 i = nextToken; i < totalSupplyOffset; ) {
            if (nestMint) {
                _nestMint(_receiver, i, destinationId, "");
            } else {
                _safeMint(_receiver, i, "");
            }
            unchecked {
                ++i;
            }
        }
    }

    function burn(
        uint256 tokenId,
        uint256 maxChildrenBurns
    ) public override returns (uint256) {
        require(tx.origin == owner(), "RMRKNotOwner()");
        require(isRevokable, "NFT not revokable!");
        require(
            childrenOf(tokenId).length <= maxChildrenBurns, 
            "Orphan not allowed"
        );
        return _burn(tokenId, maxChildrenBurns);
    }

    function setDropStart(uint _dropStart) external onlyOwner {
        require(dropStart > block.timestamp, "Minting already started!");
        dropStart = _dropStart;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return string(abi.encodePacked(_tokenUri, tokenId.toString(), baseExtension));
    }

    function setBaseURI(string memory _newBaseURI) external onlyOwner {
        _tokenUri = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension) external onlyOwner {
        baseExtension = _newBaseExtension;
    }

    function _preMint(
        uint256 numToMint
    ) internal override returns (uint256, uint256) {
        require(isDrop, "isDrop == false");
        require(block.timestamp >= dropStart, "Minting not started yet.");

        require(
            totalSupply() + numToMint <= maxSupply() - reserve
        );

        return super._preMint(numToMint);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        require(
            !isSoulbound || from == address(0) || (to == address(0) && msg.sender == owner()), 
            "Transfers not allowed!"
        );

        if (from == address(0)) {
            _addTokenToAllTokensEnumeration(tokenId);
        } else if (from != to) {
            _removeTokenFromOwnerEnumeration(from, to, tokenId);
        }
        if (to == address(0)) {
            _removeTokenFromAllTokensEnumeration(tokenId);
        } else if (to != from) {
            _addTokenToOwnerEnumeration(to, tokenId);
        }
    }


    /**
     * @dev Private function to add a token to this extension's ownership-tracking data structures.
     * @param to address representing the new owner of the given token ID
     * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
     */
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        uint256 length = balanceOf(to);
        _ownedTokens[to][length] = tokenId;
        _ownedTokensIndex[tokenId] = length;
    }

    /**
     * @dev Private function to add a token to this extension's token tracking data structures.
     * @param tokenId uint256 ID of the token to be added to the tokens list
     */
    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokensIndex[tokenId] = _allTokens.length;
        _allTokens.push(tokenId);
    }

    function _removeTokenFromOwnerEnumeration(address from, address to, uint256 tokenId) private {
        // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = balanceOf(from);
        if (to != address(0)) {
            // Fix for non burn transfers
            // Needed because function _burn inside RMRKNestable.sol does _balances[immediateOwner] -= 1
            // before calling _beforeTokenTransfer
            lastTokenIndex -= 1;
        }
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary
        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];

            _ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
            _ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
        }

        // This also deletes the contents at the last position of the array
        delete _ownedTokensIndex[tokenId];
        delete _ownedTokens[from][lastTokenIndex];
    }

    /**
     * @dev Private function to remove a token from this extension's token tracking data structures.
     * This has O(1) time complexity, but alters the order of the _allTokens array.
     * @param tokenId uint256 ID of the token to be removed from the tokens list
     */
    function _removeTokenFromAllTokensEnumeration(uint256 tokenId) private {
        // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
        // then delete the last slot (swap and pop).

        uint256 lastTokenIndex = _allTokens.length - 1;
        uint256 tokenIndex = _allTokensIndex[tokenId];

        // When the token to delete is the last token, the swap operation is unnecessary. However, since this occurs so
        // rarely (when the last minted token is burnt) that we still do the swap here to avoid the gas cost of adding
        // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
        uint256 lastTokenId = _allTokens[lastTokenIndex];

        _allTokens[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
        _allTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index

        // This also deletes the contents at the last position of the array
        delete _allTokensIndex[tokenId];
        _allTokens.pop();
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < balanceOf(owner), "ERC721Enumerable: owner index out of bounds");
        return _ownedTokens[owner][index];
    }

    /**
     * @dev See {IERC721Enumerable-tokenByIndex}.
     */
    function tokenByIndex(uint256 index) public view returns (uint256) {
        require(index < totalSupply(), "ERC721Enumerable: global index out of bounds");
        return _allTokens[index];
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
        return _allTokens;
    }
}