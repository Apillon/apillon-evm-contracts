const { expect } = require("chai");

describe("ApillonClaimToken", function () {
  let ACT, TOKEN, owner, account1, account2, signer;

  const CHAIN_ID = 31337; // hardhat test network id

  before(async () => {
    await hre.network.provider.send("hardhat_reset");
  });

  beforeEach(async () => {
    [owner, account1, account2, signer] = await ethers.getSigners();

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
      "ApillonClaimToken"
    );
    ACT = await ACTContract.deploy(
      TOKEN.address,
      signer.address
    );
    await ACT.deployed();

    await TOKEN.transfer(ACT.address, hre.ethers.utils.parseEther('100000'));
  });

  it("Deployer should be the owner of the contract", async function () {
    expect(await ACT.owner()).to.equal(owner.address);
  });

  it("Test invalid signature", async function () {
    const amount = hre.ethers.utils.parseEther('3');
    const timestamp = Math.ceil(new Date().getTime() / 1000) + 3600;

    let message = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256", "uint256"],
      [ACT.address, account1.address, amount, timestamp, CHAIN_ID]
    );
    let signature = await signer.signMessage(ethers.utils.arrayify(message));

    // First test if valid
    let res = await ACT.validateSignature(account1.address, amount, timestamp, signature);
    expect(res[1]).to.equal(true);

    // Invalid ACT contract
    message = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256", "uint256"],
      [ethers.constants.AddressZero, account1.address, amount, timestamp, CHAIN_ID]
    );

    res = await ACT.validateSignature(
      account1.address, 
      amount, 
      timestamp, 
      await signer.signMessage(ethers.utils.arrayify(message))
    );
    expect(res[1]).to.equal(false);

    // Invalid CHAIN_ID contract
    message = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256", "uint256"],
      [ACT.address, account1.address, amount, timestamp, CHAIN_ID + 1]
    );

    res = await ACT.validateSignature(
      account1.address, 
      amount, 
      timestamp, 
      await signer.signMessage(ethers.utils.arrayify(message))
    );
    expect(res[1]).to.equal(false);

    // Same signature to test invalid msg.sender, amount, timestamp
    message = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256", "uint256"],
      [ACT.address, account1.address, amount, timestamp, CHAIN_ID]
    );

    // Invalid msg.sender
    res = await ACT.validateSignature(
      account2.address, 
      amount, 
      timestamp, 
      await signer.signMessage(ethers.utils.arrayify(message))
    );
    expect(res[1]).to.equal(false);

    // Invalid amount contract
    res = await ACT.validateSignature(
      account1.address, 
      amount.add(1), 
      timestamp, 
      await signer.signMessage(ethers.utils.arrayify(message))
    );
    expect(res[1]).to.equal(false);

    // Invalid timestamp contract
    res = await ACT.validateSignature(
      account1.address, 
      amount, 
      timestamp + 1, 
      await signer.signMessage(ethers.utils.arrayify(message))
    );
    expect(res[1]).to.equal(false);
  });

  it("Test expired signature", async function () {
    const amount = hre.ethers.utils.parseEther('3');
    const timestamp = Math.ceil(new Date().getTime() / 1000) - 1; // 1 sec in past

    let message = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256", "uint256"],
      [ACT.address, account1.address, amount, timestamp, CHAIN_ID]
    );
    let signature = await signer.signMessage(ethers.utils.arrayify(message));

    await expect(
      ACT.connect(account1).claim(amount, timestamp, signature)
    ).to.be.revertedWith("Expired signature");
  });

  it("Successfully claim", async function () {

    const amount = hre.ethers.utils.parseEther('3');
    const timestamp = Math.ceil(new Date().getTime() / 1000) + 3600;

    const message = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256", "uint256"],
      [ACT.address, account1.address, amount, timestamp, CHAIN_ID]
    );
    const signature = await signer.signMessage(ethers.utils.arrayify(message));

    await ACT.connect(account1).claim(amount, timestamp, signature);

    expect(await TOKEN.balanceOf(account1.address)).to.equal(amount);

    await expect(
      ACT.connect(account1).claim(amount, timestamp, signature)
    ).to.be.revertedWith("wallet already claimed");
  });

  it("Fail claim if dataHash invalidated", async function () {

    const amount = hre.ethers.utils.parseEther('3');
    const timestamp = Math.ceil(new Date().getTime() / 1000) + 3600;

    const message = ethers.utils.solidityKeccak256(
      ["address", "address", "uint256", "uint256", "uint256"],
      [ACT.address, account1.address, amount, timestamp, CHAIN_ID]
    );
    const dataHash = ethers.utils.arrayify(message);
    const signature = await signer.signMessage(dataHash);

    await ACT.invalidateDataHash(dataHash);

    await expect(
      ACT.connect(account1).claim(amount, timestamp, signature)
    ).to.be.revertedWith("dataHash invalidated");
  });

  it("Fail dataHash invalidate if caller not owner", async function () {
    const dataHash = ethers.utils.hexlify(ethers.utils.zeroPad("0x", 32));

    await expect(
      ACT.connect(account1).invalidateDataHash(dataHash)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Withdraw token successfully", async function () {
    const amountToWithdraw = hre.ethers.utils.parseEther('150');
    await ACT.withdrawToken(account2.address, amountToWithdraw);

    expect(await TOKEN.balanceOf(account2.address)).to.equal(amountToWithdraw);
  });

  it("Fail Withdraw token if caller not owner", async function () {
    await expect(
      ACT.connect(account1).withdrawToken(owner.address, hre.ethers.utils.parseEther('150'))
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Change signer", async function() {
    expect(await ACT['signer()']()).to.equal(signer.address);

    await expect(ACT.connect(account1).setSigner(account2.address)
    ).to.be.revertedWith(`Ownable: caller is not the owner`);

    await ACT.setSigner(account2.address);
    expect(await ACT['signer()']()).to.equal(account2.address);
  });

});
