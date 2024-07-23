// SPDX-License-Identifier: Unlicense

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

pragma solidity 0.8.21;

contract ApillonVesting is Ownable, ReentrancyGuard {

  enum VestingType {
    PRESEED,
    SEED,
    COMMUNITY,
    TEAM
  }

  struct VestingData {
    VestingType vestingType;
    address user;
    uint8 months;
    uint8 cliff;
    uint8 nonVestedPercent;
    uint256 amount;
    uint256 totalDebt;
    uint256 vestedDebt;
  }

  uint256 public constant MONTH = 30 days; // 60 * 60 * 24 * 30

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

    startTime = _startTime;
  }

  // public
  function claim() external nonReentrant {
    require(block.timestamp > startTime, "Claim not open yet");
    require(
      vestingData[msg.sender].amount > 0, 
      "Nothing to claim"
    );
    require(
      vestingData[msg.sender].totalDebt < vestingData[msg.sender].amount,
      "All tokens already claimed"
    );
    
    VestingData storage vData = vestingData[msg.sender];

    (
      , // nonVestedTotal 
      , // vestedTotal
      , // endTime 
      , // vestedStartDistribution 
      , // amountPerSecond
      uint256 claimableNonVestedAmt,
      uint256 claimableVestedAmt
    ) = getVestingDataDetails(msg.sender);

    uint256 claimable;
    if (claimableNonVestedAmt > 0) {
      claimable += claimableNonVestedAmt;
    }

    if (claimableVestedAmt > 0) {
      claimable += claimableVestedAmt;
      vData.vestedDebt += claimableVestedAmt;
    }

    vData.totalDebt += claimable;

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

  function getVestingDataDetails(address user) public view returns(
    uint256 nonVestedTotal, 
    uint256 vestedTotal, 
    uint256 endTime, 
    uint256 vestedStartDistribution, 
    uint256 amountPerSecond,
    uint256 claimableNonVestedAmt,
    uint256 claimableVestedAmt
  ) {
    VestingData memory vData = vestingData[user];
    
    nonVestedTotal = vData.amount * vData.nonVestedPercent / 100;
    vestedTotal = vData.amount - nonVestedTotal;

    endTime = startTime + MONTH * vData.months;

    vestedStartDistribution = startTime + MONTH * vData.cliff;

    amountPerSecond = vestedTotal / (endTime - vestedStartDistribution);

    // Calc claimable amount
    if (vData.totalDebt == 0 && vData.nonVestedPercent > 0) {
      // First claim
      claimableNonVestedAmt = nonVestedTotal;
    }

    uint256 currentTimestamp = block.timestamp;
    if (endTime > currentTimestamp) {
      endTime = currentTimestamp;
    }

    if (vestedStartDistribution < endTime) {
      claimableVestedAmt = (currentTimestamp - vestedStartDistribution) * amountPerSecond - vData.vestedDebt;
    }

    // Cap the claimable amounts to ensure no over-claiming occurs.
    // Simplify the check to ensure total claimable does not exceed the maximum allowed amount.
    uint256 totalClaimable = vData.totalDebt + claimableNonVestedAmt + claimableVestedAmt;
    if (totalClaimable > vData.amount) {
      // The conditional check here is clearer and prevents setting 'claimableVestedAmt' to a negative number (underflow).
      claimableVestedAmt = vData.amount > (vData.totalDebt + claimableNonVestedAmt) ? vData.amount - (vData.totalDebt + claimableNonVestedAmt) : 0;
    }
  }

  function setVestingData(VestingData[] memory _data) external onlyOwner {
    VestingData memory vData;
    for (uint256 i = 0; i < _data.length; i++) {
      vData = _data[i];
      require(
        vestingData[vData.user].totalDebt == 0, 
        "User already started claiming"
      );
      require(
        vData.totalDebt == 0 && vData.vestedDebt == 0,
        "totalDebt & vestedDebt must be set to 0"
      );
      require(
        vData.months == 12 || vData.months == 24 || vData.months == 48,
        "months must be set to either 12, 24 or 48"
      );
      require(
        vData.cliff == 3 || vData.cliff == 6 || vData.cliff == 12,
        "cliff has to be 3, 6 or 12"
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

  function transferVesting(address fromUser, address toUser) external onlyOwner {
    require(
      vestingData[fromUser].totalDebt == 0, 
      "fromUser already claimed"
    );
    require(
      vestingData[fromUser].user == fromUser, 
      "invalid fromUser record"
    );
    require(
      vestingData[toUser].user == address(0), 
      "toUser data already set"
    );

    vestingData[toUser] = vestingData[fromUser];
    delete vestingData[fromUser];
  }

  function removeVesting(address[] memory users) external onlyOwner {
    address user;
    for (uint256 i = 0; i < users.length; i++) {
      user = users[i];
      require(
        vestingData[user].totalDebt == 0, 
        "User already started claiming"
      );
      delete vestingData[user];
    }
  }
}
