// SPDX-License-Identifier: Unlicense

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

pragma solidity 0.8.21;

contract ApillonClaimToken is Ownable {

  /**
   * @dev Token to be claimed   
   */
  IERC20 public immutable TOKEN;

  /**
   * @dev Mapping of addresses that already claimed
   */
  mapping(address => bool) public walletClaimed;

  /**
   * @dev Mapping of invalidated dataHashes
   */
  mapping(bytes32 => bool) public dataHashInvalidated;

  /**
   * @dev address signing on backend
   */
  address public signer;

  event Claim(address indexed wallet, uint256 amount, bytes32 indexed dataHash);
  event DataHashInvalidated(bytes32 indexed dataHash);
  event WithdrawToken(address indexed wallet, uint256 amount);
  event SetSigner(address indexed signer);

  constructor(
    address _token,
    address _signer
  ) {
    require(_token != address(0), "Zero address not allowed");
    TOKEN = IERC20(_token);

    require(_signer != address(0), "Zero address not allowed");
    signer = _signer;
  }

  // public
  function claim(
    uint256 amount,
    uint256 timestamp,
    bytes memory signature
  ) external {
    require(!walletClaimed[msg.sender], "wallet already claimed");
    require(timestamp >= block.timestamp, "Expired signature");

    // Verify signature
    (bytes32 dataHash, bool isValid) = validateSignature(
        msg.sender,
        amount,
        timestamp,
        signature
    );

    require(!dataHashInvalidated[dataHash], "dataHash invalidated");
    require(isValid, "Invalid signature");

    walletClaimed[msg.sender] = true;

    require(
      TOKEN.transfer(msg.sender, amount), 
      "Transfer failed"
    );

    emit Claim(msg.sender, amount, dataHash);
  }

  // public -- onlyOwner
  function withdrawToken(address wallet, uint256 amount) external onlyOwner {
    require(
      TOKEN.transfer(wallet, amount), 
      "Transfer failed"
    );

    emit WithdrawToken(wallet, amount);
  }

  // public -- onlyOwner
  function invalidateDataHash(bytes32 dataHash) external onlyOwner {
    dataHashInvalidated[dataHash] = true;

    emit DataHashInvalidated(dataHash);
  }

  /** 
    * @dev Set signer address.
    * @param _signer Signer address
    */
  function setSigner(address _signer) external onlyOwner {
      require(_signer != address(0), "Zero address not allowed");
      signer = _signer;

      emit SetSigner(_signer);
  }

  // public -- view
  function validateSignature(
      address sender,
      uint256 amount,
      uint256 timestamp,
      bytes memory signature
  ) public view returns (bytes32, bool) {
      bytes32 dataHash = keccak256(
          abi.encodePacked(address(this), sender, amount, timestamp, block.chainid)
      );
      bytes32 message = ECDSA.toEthSignedMessageHash(dataHash);
      address receivedAddress = ECDSA.recover(message, signature);
      return (dataHash, receivedAddress == signer);
  }
}
