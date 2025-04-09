// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract NctrStaking is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    address public rewardWallet;
    uint256 public APY = 20;
    uint256 public MIN_STAKE_DURATION = 90 days;
    uint256 public MIN_STAKE_AMOUNT = 500 * 10 ** 18;

    struct Stake {
        uint256 amount;
        uint256 startTime;
        bool active;
        uint256 reward;
    }

    mapping(address => Stake[]) internal stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(IERC20 _stakingToken, address _rewardWallet) Ownable(msg.sender) {
        stakingToken = _stakingToken;
        rewardWallet = _rewardWallet;
    }

    function setAPY(uint256 newAPY) external onlyOwner {
        require(newAPY > 0, "APY must be greater than 0");
        APY = newAPY;
    }

    function setMinStakeAmount(uint256 newMinStakeAmount) external onlyOwner {
        require(
            newMinStakeAmount > 0,
            "Min stake amount must be greater than 0"
        );
        MIN_STAKE_AMOUNT = newMinStakeAmount;
    }

    function setMinStakeDuration(
        uint256 newMinStakeDuration
    ) external onlyOwner {
        require(
            newMinStakeDuration > 0,
            "Min stake duration must be greater than 0"
        );
        MIN_STAKE_DURATION = newMinStakeDuration;
    }

    function stake(uint256 amount) external {
        require(amount >= MIN_STAKE_AMOUNT, "Amount below minimum stake");

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        stakes[msg.sender].push(Stake(amount, block.timestamp, true, 0));

        emit Staked(msg.sender, amount);
    }

    function allStakes(address user) external view returns (Stake[] memory) {
        Stake[] memory userStakes = stakes[user];

        for (uint256 i = 0; i < userStakes.length; i++) {
            userStakes[i].reward = _calculateReward(userStakes[i]);
        }

        return userStakes;
    }

    function unstake(uint256 stakeIndex) external {
        Stake[] storage userStakes = stakes[msg.sender];
        require(stakeIndex < userStakes.length, "Invalid stake index");

        Stake storage selectedStake = userStakes[stakeIndex];
        require(selectedStake.active, "Stake already unstaked");
        require(
            block.timestamp >= selectedStake.startTime + MIN_STAKE_DURATION,
            "Stake duration not met"
        );
        require(selectedStake.amount > 0, "Invalid unstake amount");

        uint256 reward = _calculateReward(selectedStake);
        require(reward > 0, "No reward to claim");

        selectedStake.active = false;

        // Transfer the initial deposit back to the user from the contract
        stakingToken.safeTransfer(msg.sender, selectedStake.amount);
        // Transfer the reward from the reward wallet to the user
        stakingToken.safeTransferFrom(rewardWallet, msg.sender, reward);

        emit Unstaked(msg.sender, selectedStake.amount, reward);
    }

    function withdraw(uint256 stakeIndex) external {
        Stake[] storage userStakes = stakes[msg.sender];
        require(stakeIndex < userStakes.length, "Invalid stake index");

        Stake storage selectedStake = userStakes[stakeIndex];
        require(selectedStake.active, "Stake already withdrawn");
        require(
            block.timestamp >= selectedStake.startTime + MIN_STAKE_DURATION,
            "Stake duration not met"
        );
        require(selectedStake.amount > 0, "Invalid withdraw amount");

        selectedStake.active = false;

        // Transfer the initial deposit back to the user from the contract
        stakingToken.safeTransfer(msg.sender, selectedStake.amount);

        emit Withdrawn(msg.sender, selectedStake.amount);
    }

    function _calculateReward(
        Stake memory stakeData
    ) internal view returns (uint256) {
        if (!stakeData.active) {
            return 0;
        }
        uint256 stakingDuration = block.timestamp - stakeData.startTime;
        return (stakeData.amount * APY * stakingDuration) / (365 days * 100);
    }
}
