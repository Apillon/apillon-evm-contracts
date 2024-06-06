const { expect } = require("chai");

describe("ApillonVesting", function () {
  let ACT, TOKEN, owner, account1, account2, account3, account4, signer;

  const CHAIN_ID = 31337; // hardhat test network id
  const MONTH_1 = 86400 * 30;
  const HOUR_1 = 3600;

  let currentTime = Math.ceil(new Date().getTime() / 1000);

  before(async () => {
    await hre.network.provider.send("hardhat_reset");
  });

  beforeEach(async () => {
    [owner, account1, account2, account3, account4, signer] = await ethers.getSigners();

    const TokenContract = await ethers.getContractFactory(
      "DummyToken"
    );
    TOKEN = await TokenContract.deploy(
      "DummyToken",
      "DMY",
      owner.address,
    );
    await TOKEN.deployed();

    const ACTContract = await ethers.getContractFactory(
      "ApillonVesting"
    );

    const vestingStart = currentTime + HOUR_1;

    ACT = await ACTContract.deploy(
      TOKEN.address,
      vestingStart
    );
    await ACT.deployed();

    await TOKEN.transfer(ACT.address, hre.ethers.utils.parseEther('100000'));
  });

  it("Deployer should be the owner of the contract", async function () {
    expect(await ACT.owner()).to.equal(owner.address);
  });

  it("Setup vestingData", async function () {
    await expect(ACT.connect(account1).setVestingData([]))
    .to.be.revertedWith("Ownable: caller is not the owner");

    const vestingDataList = [
      {
        vestingType: 0, // PRESEED
        user: account1.address,
        months: 12,
        cliff: 3,
        nonVestedPercent: 30,
        amount: ethers.utils.parseEther('100'),
        totalDebt: 0,
        vestedDebt: 0,
      },
      {
        vestingType: 0, // PRESEED
        user: account2.address,
        months: 24,
        cliff: 6,
        nonVestedPercent: 0,
        amount: ethers.utils.parseEther('150'),
        totalDebt: 0,
        vestedDebt: 0,
      }
    ]

    await ACT.setVestingData(vestingDataList);

    let vestData = await ACT.vestingData(account1.address);
    expect(vestData.user).to.equal(vestingDataList[0].user);
    expect(vestData.months).to.equal(vestingDataList[0].months);
    expect(vestData.nonVestedPercent).to.equal(vestingDataList[0].nonVestedPercent);
    expect(vestData.amount).to.equal(vestingDataList[0].amount);
    expect(vestData.vestedDebt).to.equal(vestingDataList[0].vestedDebt);
    expect(vestData.totalDebt).to.equal(vestingDataList[0].totalDebt);

    vestData = await ACT.vestingData(account2.address);
    expect(vestData.user).to.equal(vestingDataList[1].user);
    expect(vestData.months).to.equal(vestingDataList[1].months);
    expect(vestData.nonVestedPercent).to.equal(vestingDataList[1].nonVestedPercent);
    expect(vestData.amount).to.equal(vestingDataList[1].amount);
    expect(vestData.vestedDebt).to.equal(vestingDataList[1].vestedDebt);
    expect(vestData.totalDebt).to.equal(vestingDataList[1].totalDebt);
  });

  it("Successfully claim", async function () {

    // Setup vesting data
    const vestingDataList = [
      {
        vestingType: 0, // PRESEED
        user: account1.address,
        months: 12,
        cliff: 3,
        nonVestedPercent: 30,
        amount: ethers.utils.parseEther('100'),
        totalDebt: 0,
        vestedDebt: 0,
      },
      {
        vestingType: 0, // PRESEED
        user: account2.address,
        months: 24,
        cliff: 6,
        nonVestedPercent: 0,
        amount: ethers.utils.parseEther('150'),
        totalDebt: 0,
        vestedDebt: 0,
      }
    ];

    const account1VestedTotal = ethers.BigNumber.from(100 - vestingDataList[0].nonVestedPercent).mul(vestingDataList[0].amount).div(100);
    const account1VestedPerSecond = account1VestedTotal.div(9 * MONTH_1); // 9 months for distibution

    await ACT.setVestingData(vestingDataList);

    expect(await TOKEN.balanceOf(account1.address)).to.equal(0);

    await expect(
      ACT.connect(account1).claim()
    ).to.be.revertedWith("Claim not open yet");

    await ethers.provider.send("evm_increaseTime", [HOUR_1]);
    currentTime += HOUR_1;

    // Claim non-vested amount
    await ACT.connect(account1).claim();
    expect(await TOKEN.balanceOf(account1.address)).to.equal(ethers.utils.parseEther('30'));

    // // Try to claim additional tokens
    await ACT.connect(account1).claim();
    expect(await TOKEN.balanceOf(account1.address)).to.equal(ethers.utils.parseEther('30'));

    // Increase time by 3 months
    await ethers.provider.send("evm_increaseTime", [MONTH_1 * 3 - 10]); // 10sec out of sync
    currentTime += MONTH_1 * 3 - 10;

    await ACT.connect(account1).claim();

    let bal;
    bal = await TOKEN.balanceOf(account1.address);
    expect(bal.gt(ethers.utils.parseEther('30'))).to.equal(true);
    expect(bal.lte(ethers.utils.parseEther('30').add(account1VestedPerSecond.mul(5)))).to.equal(true);

    // Increase time by 4.5 months
    await ethers.provider.send("evm_increaseTime", [Math.ceil(MONTH_1 * 4.5)]);
    currentTime += Math.ceil(MONTH_1 * 4.5);

    await ACT.connect(account1).claim();

    bal = await TOKEN.balanceOf(account1.address);
    expect(bal.gt(ethers.utils.parseEther('65'))).to.equal(true);
    expect(bal.lte(ethers.utils.parseEther('65').add(account1VestedPerSecond.mul(5)))).to.equal(true);

    // Increase time by 5 months, should be able to claim the remaining
    await ethers.provider.send("evm_increaseTime", [MONTH_1 * 5]);
    currentTime += MONTH_1 * 5;

    await ACT.connect(account1).claim();

    bal = await TOKEN.balanceOf(account1.address);
    expect(bal).to.equal(ethers.utils.parseEther('100'));

    // Increase time by 12 months, should be able to claim the remaining
    await ethers.provider.send("evm_increaseTime", [MONTH_1 * 12]);
    currentTime += MONTH_1 * 12;

    // Account 2 claim all at once
    await ACT.connect(account2).claim();
    expect(await TOKEN.balanceOf(account2.address)).to.equal(ethers.utils.parseEther('150'));
  });

  it("Transfer vesting data to other user and claim", async function () {

    // Setup vesting data
    const vestingDataList = [
      {
        vestingType: 0, // PRESEED
        user: account1.address,
        months: 12,
        cliff: 3,
        nonVestedPercent: 30,
        amount: ethers.utils.parseEther('100'),
        totalDebt: 0,
        vestedDebt: 0,
      },
      {
        vestingType: 0, // PRESEED
        user: account2.address,
        months: 24,
        cliff: 6,
        nonVestedPercent: 10,
        amount: ethers.utils.parseEther('150'),
        totalDebt: 0,
        vestedDebt: 0,
      }
    ];

    await ACT.setVestingData(vestingDataList);

    expect(await TOKEN.balanceOf(account1.address)).to.equal(0);

    await expect(
      ACT.connect(account1).claim()
    ).to.be.revertedWith("Claim not open yet");

    await ethers.provider.send("evm_increaseTime", [HOUR_1]);
    currentTime += HOUR_1;

    await expect(
      ACT.connect(account1).transferVesting(account3.address, account4.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      ACT.transferVesting(account3.address, account4.address)
    ).to.be.revertedWith("invalid fromUser record");

    await expect(
      ACT.transferVesting(account1.address, account2.address)
    ).to.be.revertedWith("toUser data already set");

    // Claim non-vested amount
    await ACT.connect(account1).claim();
    expect(await TOKEN.balanceOf(account1.address)).to.equal(ethers.utils.parseEther('30'));

    await expect(
      ACT.transferVesting(account1.address, account4.address)
    ).to.be.revertedWith("fromUser already claimed");

    await expect(
      ACT.connect(account3).claim()
    ).to.be.revertedWith("Nothing to claim");

    // Successfully transfer from account2 to account3
    await ACT.transferVesting(account2.address, account3.address);

    await expect(
      ACT.connect(account2).claim()
    ).to.be.revertedWith("Nothing to claim");

    await ACT.connect(account3).claim();
    expect(await TOKEN.balanceOf(account3.address)).to.equal(ethers.utils.parseEther('15'));
  });

  it("Remove vesting data from user", async function () {

    // Setup vesting data
    const vestingDataList = [
      {
        vestingType: 0, // PRESEED
        user: account1.address,
        months: 12,
        cliff: 3,
        nonVestedPercent: 30,
        amount: ethers.utils.parseEther('100'),
        totalDebt: 0,
        vestedDebt: 0,
      },
      {
        vestingType: 0, // PRESEED
        user: account2.address,
        months: 24,
        cliff: 6,
        nonVestedPercent: 10,
        amount: ethers.utils.parseEther('150'),
        totalDebt: 0,
        vestedDebt: 0,
      }
    ];

    await ACT.setVestingData(vestingDataList);

    await ethers.provider.send("evm_increaseTime", [HOUR_1]);
    currentTime += HOUR_1;

    // Claim non-vested amount
    await ACT.connect(account1).claim();
    expect(await TOKEN.balanceOf(account1.address)).to.equal(ethers.utils.parseEther('30'));

    await expect(
      ACT.connect(account1).removeVesting([account1.address, account3.address])
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      ACT.removeVesting([account1.address, account3.address])
    ).to.be.revertedWith("User already started claiming");

    // Successfully transfer from account2 to account3
    await ACT.removeVesting([account2.address]);

    await expect(
      ACT.connect(account2).claim()
    ).to.be.revertedWith("Nothing to claim");
  });

  it("Withdraw token", async function () {
    await expect(
      ACT.connect(account3).withdrawToken(account3.address, hre.ethers.utils.parseEther('55'))
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await ACT.withdrawToken(account3.address, hre.ethers.utils.parseEther('55'));
    expect(await TOKEN.balanceOf(account3.address)).to.equal(ethers.utils.parseEther('55'));
  });

});
