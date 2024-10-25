const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ApillonERC20Token", function () {
  let Token, token, controller, admin, addr1, addr2;

  beforeEach(async function () {
    [controller, admin, addr1, addr2, _] = await ethers.getSigners();

    Token = await ethers.getContractFactory("ApillonERC20Token");
    token = await Token.deploy("ApillonToken", "APT", admin.address);
    await token.deployed();
  });

  it("Should have correct name and symbol", async function () {
    expect(await token.name()).to.equal("ApillonToken");
    expect(await token.symbol()).to.equal("APT");
  });

  it("Should grant roles to the correct addresses", async function () {
    const defaultAdminRole = await token.DEFAULT_ADMIN_ROLE();
    const controllerRole = await token.CONTROLLER_ROLE();

    expect(await token.hasRole(controllerRole, controller.address)).to.be.true;
    expect(await token.hasRole(defaultAdminRole, admin.address)).to.be.true;
  });

  it("Should grant admin role to controller if admin addresses is not provided", async function () {
    const deployedToken = await Token.deploy(
      "ApillonToken",
      "APT",
      ethers.constants.AddressZero
    );
    const defaultAdminRole = await deployedToken.DEFAULT_ADMIN_ROLE();
    const controllerRole = await deployedToken.CONTROLLER_ROLE();

    expect(await deployedToken.hasRole(controllerRole, controller.address)).to
      .be.true;
    expect(await deployedToken.hasRole(defaultAdminRole, controller.address)).to
      .be.true;
  });

  it("Should pause and unpause the contract", async function () {
    await token.connect(controller).pause();
    expect(await token.paused()).to.be.true;

    await token.connect(controller).unpause();
    expect(await token.paused()).to.be.false;
  });

  it("Should only allow controller to pause and unpause", async function () {
    const controllerRole = await token.CONTROLLER_ROLE();
    const errorMsg = `AccessControl: account ${addr1.address.toLowerCase()} is missing role ${controllerRole}`;

    await expect(token.connect(addr1).pause()).to.be.revertedWith(errorMsg);
    await expect(token.connect(addr1).unpause()).to.be.revertedWith(errorMsg);
  });

  it("Should mint tokens", async function () {
    const mintAmount = ethers.utils.parseUnits("1000", 18);
    await token.connect(controller).mint(addr1.address, mintAmount);

    const balance = await token.balanceOf(addr1.address);
    expect(balance).to.equal(mintAmount);
  });

  it("Should only allow controller to mint tokens", async function () {
    const mintAmount = ethers.utils.parseUnits("1000", 18);
    const controllerRole = await token.CONTROLLER_ROLE();
    const errorMsg = `AccessControl: account ${addr1.address.toLowerCase()} is missing role ${controllerRole}`;

    await expect(
      token.connect(addr1).mint(addr1.address, mintAmount)
    ).to.be.revertedWith(errorMsg);
  });

  it("Should burn tokens", async function () {
    const mintAmount = ethers.utils.parseUnits("1000", 18);
    const burnAmount = ethers.utils.parseUnits("500", 18);

    await token.connect(controller).mint(addr1.address, mintAmount);
    await token.connect(addr1).burn(burnAmount);

    const balance = await token.balanceOf(addr1.address);
    expect(balance).to.equal(mintAmount.sub(burnAmount));
  });
});
