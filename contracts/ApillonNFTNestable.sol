// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@rmrk-team/evm-contracts/contracts/implementations/nativeTokenPay/RMRKNestableImpl.sol";

contract ApillonNFTNestable is RMRKNestableImpl {
    using Strings for uint256;

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

        isDrop = _settings[0];
        isSoulbound = _settings[1];
        isRevokable = _settings[2];
        
        dropStart = _dropStart;

        if (isDrop) {
            require(_reserve <= _data.maxSupply, "reserve too high.");
            reserve = _reserve;
        }
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

    function ownerMint(
        uint16 _numToMint, 
        address _receiver, 
        bool nestMint, 
        uint256 destinationId
    )
        external
        onlyOwner
    {
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

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256
    ) internal override {
        require(
            !isSoulbound || from == address(0) || (to == address(0) && msg.sender == owner()), 
            "Transfers not allowed!"
        );
    }

    function burn(
        uint256 tokenId,
        uint256 maxChildrenBurns
    ) public override onlyOwner returns (uint256) {
        require(isRevokable, "NFT not revokable!");
        return _burn(tokenId, maxChildrenBurns);
    }

    function setDropStart(uint _dropStart) external onlyOwner {
        require(dropStart > block.timestamp, "Minting already started!");
        dropStart = _dropStart;
    }
}