// SPDX-License-Identifier: Unlicense

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity 0.8.21;

contract ApillonVesting is Ownable {

  struct VestingData {
    address user;
    uint8 months;
    uint8 nonVestedPercent;
    uint256 amount;
    uint256 debt;
    uint256 lastClaimTimestamp;
  }

  uint256 public constant MONTH = 2592000; // 60 * 60 * 24 * 30

  /**
   * @dev Token to be claimed   
   */
  IERC20 public immutable TOKEN;

  uint256 public startTime;

  mapping(address => VestingData) public vestingData;


  event Claim(address indexed wallet, uint256 amount);
  event WithdrawToken(address indexed wallet, uint256 amount);

  constructor(
    address _token,
    uint256 _startTime
  ) {
    require(_token != address(0), "Zero address not allowed");
    TOKEN = IERC20(_token);

    require(
      _startTime > block.timestamp - 3600, 
      "Start time cannot be more than 1h in past"
    );
    startTime = _startTime;
  }

  // public

  // Add reentancy guard !!!
  // Add reentancy guard !!!
  // Add reentancy guard !!!
  function claim() external {
    require(block.timestamp > startTime, "Claim not open yet");
    require(
      vestingData[msg.sender].amount > 0, 
      "Nothing to claim"
    );
    require(
      vestingData[msg.sender].debt < vestingData[msg.sender].amount,
      "All tokens already claimed"
    );
    
    VestingData storage vData = vestingData[msg.sender];

    uint256 nonVestedTotal = vData.amount * vData.nonVestedPercent / 100;
    uint256 vestedTotal = vData.amount - nonVestedTotal;

    uint256 claimable;
    if (vData.debt == 0 && vData.nonVestedPercent > 0) {
      // First claim
      claimable += nonVestedTotal;
    }

    uint256 endTime = startTime + MONTH * vData.months;

    uint256 vestedStartDistribution = 
      startTime + MONTH * (vData.months == 12 ? 3 : 6); // 12 month = 3 month cliff, 24 month = 6 month cliff

    uint256 amountPerSecond = vestedTotal / (endTime - vestedStartDistribution);

    if (endTime > block.timestamp) {
      endTime = block.timestamp;
    }

    if (vestedStartDistribution < endTime) {
      claimable += (block.timestamp - vestedStartDistribution) * amountPerSecond - vData.debt;
    }

    if (vData.debt + claimable > vData.amount) {
      claimable = vData.amount - vData.debt;
    }

    vData.debt += claimable;

    require(
      TOKEN.transfer(msg.sender, claimable), 
      "Transfer failed"
    );

    emit Claim(msg.sender, claimable);
  }

  // public -- onlyOwner
  function withdrawToken(address wallet, uint256 amount) external onlyOwner {
    require(
      TOKEN.transfer(wallet, amount), 
      "Transfer failed"
    );

    emit WithdrawToken(wallet, amount);
  }

  function setVestingData(VestingData[] memory _data) external onlyOwner {
    // require(
    //   startTime > block.timestamp, 
    //   "Claim already started"
    // );

    VestingData memory vData;
    for (uint256 i = 0; i < _data.length; i++) {
      vData = _data[i];
      require(
        vestingData[vData.user].debt == 0, 
        "User already started claiming"
      );
      require(
        vData.debt == 0 && vData.lastClaimTimestamp == 0,
        "debt & lastClaimTimestamp must be set to 0"
      );
      require(
        vData.months == 12 || vData.months == 24,
        "months must be set to either 12 or 24"
      );
      require(
        vData.nonVestedPercent <= 50,
        "max nonVestedPercent is 50"
      );
      require(
        vData.amount > 0,
        "amount cannot be 0"
      );

      vestingData[vData.user] = vData;
    }
  }
}
