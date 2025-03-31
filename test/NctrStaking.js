const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NctrStaking", () => {
  let stakingToken;
  let stakingContract;
  let owner;
  let user;
  let rewardWallet;

  beforeEach(async function () {
    [owner, user, rewardWallet] = await ethers.getSigners();

    // Deploy the ERC20 token with a larger initial supply
    const Nectar = await ethers.getContractFactory("Nectar");
    stakingToken = await Nectar.deploy();
    await stakingToken.waitForDeployment();

    // Deploy the NctrStaking contract
    const NctrStaking = await ethers.getContractFactory("NctrStaking");
    stakingContract = await NctrStaking.deploy(
      await stakingToken.getAddress(),
      rewardWallet.address
    );
    await stakingContract.waitForDeployment();

    // Transfer some tokens to addr1 and addr2 for testing
    await stakingToken.transfer(user.address, ethers.parseEther("2000"));
    // Transfer tokens to reward wallet for rewards
    await stakingToken.transfer(
      rewardWallet.address,
      ethers.parseEther("10000")
    );
    // Approve staking contract to spend reward wallet's tokens
    await stakingToken
      .connect(rewardWallet)
      .approve(stakingContract.getAddress(), ethers.parseEther("100000"));
  });

  it("Should have correct initial parameters", async function () {
    const minStakeAmount = await stakingContract.MIN_STAKE_AMOUNT();
    const apy = await stakingContract.APY();
    const minStakeDuration = await stakingContract.MIN_STAKE_DURATION();

    expect(minStakeAmount).to.equal(ethers.parseEther("500"));
    expect(apy).to.equal(20); // 20% APY
    expect(minStakeDuration).to.equal(90 * 24 * 60 * 60); // 90 days in seconds
  });

  it("Should not allow staking below minimum amount", async function () {
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), ethers.parseEther("100"));
    await expect(
      stakingContract.connect(user).stake(ethers.parseEther("100"))
    ).to.be.revertedWith("Amount below minimum stake");
  });

  it("Should not allow staking without approval", async function () {
    const stakeAmount = ethers.parseEther("500");
    await expect(
      stakingContract.connect(user).stake(stakeAmount)
    ).to.be.revertedWithCustomError(stakingToken, "ERC20InsufficientAllowance");
  });

  it("Should not allow staking with insufficient balance", async function () {
    const stakeAmount = ethers.parseEther("3000"); // More than addr1's balance
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount);
    await expect(
      stakingContract.connect(user).stake(stakeAmount)
    ).to.be.revertedWithCustomError(stakingToken, "ERC20InsufficientBalance");
  });

  it("Should calculate rewards correctly", async function () {
    const stakeAmount = ethers.parseEther("500");
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount);
    await stakingContract.connect(user).stake(stakeAmount);

    // Fast forward time
    await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]); // 1 year
    await ethers.provider.send("evm_mine", []);

    const stakes = await stakingContract.allStakes(user.address);
    const expectedReward = (stakeAmount * BigInt(20)) / BigInt(100); // 20% reward per year

    expect(stakes[0].reward).to.be.closeTo(
      expectedReward,
      ethers.parseEther("0.0001")
    );
  });

  it("Should allow user to stake", async function () {
    const stakeAmount = ethers.parseEther("500");
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount);
    await expect(stakingContract.connect(user).stake(stakeAmount))
      .to.emit(stakingContract, "Staked")
      .withArgs(user.address, stakeAmount);
  });

  it("Should return all stakes for a user", async function () {
    const stakeAmount = ethers.parseEther("500");
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount);
    await stakingContract.connect(user).stake(stakeAmount);

    const stakes = await stakingContract.allStakes(user.address);
    expect(stakes.length).to.equal(1);
    expect(stakes[0].amount).to.equal(stakeAmount);
  });

  it("Should return multiple stakes for a user", async function () {
    const stakeAmount1 = ethers.parseEther("500");
    const stakeAmount2 = ethers.parseEther("600");
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount1);
    await stakingContract.connect(user).stake(stakeAmount1);

    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount2);
    await stakingContract.connect(user).stake(stakeAmount2);

    const stakes = await stakingContract.allStakes(user.address);
    expect(stakes.length).to.equal(2);
    expect(stakes[0].amount).to.equal(stakeAmount1);
    expect(stakes[1].amount).to.equal(stakeAmount2);
  });

  it("Should not allow unstaking before minimum duration", async function () {
    const stakeAmount = ethers.parseEther("500");
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount);
    await stakingContract.connect(user).stake(stakeAmount);

    await expect(stakingContract.connect(user).unstake(0)).to.be.revertedWith(
      "Stake duration not met"
    );
  });

  it("Should allow unstaking after minimum duration", async function () {
    const stakeAmount = ethers.parseEther("500");
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount);
    await stakingContract.connect(user).stake(stakeAmount);

    // Fast forward time
    await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]); // 90 days
    await ethers.provider.send("evm_mine", []);

    const initialRewardWalletBalance = await stakingToken.balanceOf(
      rewardWallet.address
    );
    const initialUserBalance = await stakingToken.balanceOf(user.address);

    await expect(stakingContract.connect(user).unstake(0)).to.emit(
      stakingContract,
      "Unstaked"
    );

    const finalContractBalance = await stakingToken.balanceOf(
      stakingContract.getAddress()
    );
    const finalRewardWalletBalance = await stakingToken.balanceOf(
      rewardWallet.address
    );
    const finalUserBalance = await stakingToken.balanceOf(user.address);

    const expectedReward =
      (stakeAmount * BigInt(20) * BigInt(90)) / (BigInt(365) * BigInt(100));

    expect(finalContractBalance).to.be.equal(0);
    expect(finalRewardWalletBalance).to.be.closeTo(
      initialRewardWalletBalance - expectedReward,
      ethers.parseEther("0.00001")
    );
    expect(finalUserBalance).to.be.closeTo(
      initialUserBalance + stakeAmount + expectedReward,
      ethers.parseEther("0.00001")
    );
  });

  it("Should return stakes with one inactive after unstaking", async function () {
    const stakeAmount1 = ethers.parseEther("500");
    const stakeAmount2 = ethers.parseEther("600");
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount1);
    await stakingContract.connect(user).stake(stakeAmount1);

    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount2);
    await stakingContract.connect(user).stake(stakeAmount2);

    // Fast forward time
    await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]); // 90 days
    await ethers.provider.send("evm_mine", []);

    await stakingContract.connect(user).unstake(0);

    const stakes = await stakingContract.allStakes(user.address);
    expect(stakes.length).to.equal(2);
    expect(stakes[0].active).to.be.false;
    expect(stakes[0].reward).to.equal(0);
    expect(stakes[1].active).to.be.true;
    // Calculate expected reward for the second stake
    const expectedReward =
      (stakeAmount2 * BigInt(20) * BigInt(90)) / (BigInt(365) * BigInt(100));
    expect(stakes[1].reward).to.be.closeTo(
      expectedReward,
      ethers.parseEther("0.00001")
    );
  });

  it("Should allow user to withdraw after minimum stake duration", async function () {
    const stakeAmount = ethers.parseEther("500");
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount);

    const initialUserBalance = await stakingToken.balanceOf(user.address);
    await stakingContract.connect(user).stake(stakeAmount);

    // Fast forward time
    await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]); // 90 days
    await ethers.provider.send("evm_mine", []);

    await stakingContract.connect(user).withdraw(0);

    const finalUserBalance = await stakingToken.balanceOf(user.address);

    expect(initialUserBalance).to.equal(finalUserBalance);
  });

  it("Should not allow user to withdraw before minimum stake duration", async function () {
    const stakeAmount = ethers.parseEther("500");
    await stakingToken
      .connect(user)
      .approve(stakingContract.getAddress(), stakeAmount);
    await stakingContract.connect(user).stake(stakeAmount);

    await expect(stakingContract.connect(user).withdraw(0)).to.be.revertedWith(
      "Stake duration not met"
    );
  });

  it("Should allow owner to modify contract data", async function () {
    await stakingContract.setAPY(25);
    expect(await stakingContract.APY()).to.equal(25);

    await stakingContract.setMinStakeAmount(ethers.parseEther("600"));
    expect(await stakingContract.MIN_STAKE_AMOUNT()).to.equal(
      ethers.parseEther("600")
    );

    await stakingContract.setMinStakeDuration(60 * 24 * 60 * 60); // 60 days
    expect(await stakingContract.MIN_STAKE_DURATION()).to.equal(
      60 * 24 * 60 * 60
    );
  });

  it("Should not allow non-owner to modify contract data", async function () {
    await expect(stakingContract.connect(user).setAPY(25))
      .to.be.revertedWithCustomError(
        stakingContract,
        "OwnableUnauthorizedAccount"
      )
      .withArgs(user.address);
  });
});
