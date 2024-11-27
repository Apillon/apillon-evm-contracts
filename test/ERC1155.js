const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ApillonERC1155Token", function () {
  let Token, token, controller, admin, addr2;
  const baseURI = "https://api.example.com/metadata/{id}.json";
  const OPERATOR_ROLE =
    "0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357";

  beforeEach(async function () {
    [controller, admin, addr2, ...addrs] = await ethers.getSigners();

    Token = await ethers.getContractFactory("ApillonERC1155Token");
    token = await Token.deploy(baseURI, admin.address);
    await token.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct URI", async function () {
      expect(await token.uri(0)).to.equal(baseURI);
    });

    it("Should grant roles to the correct addresses", async function () {
      const defaultAdminRole = await token.DEFAULT_ADMIN_ROLE();
      const controllerRole = await token.CONTROLLER_ROLE();

      expect(await token.hasRole(controllerRole, controller.address)).to.be
        .true;
      expect(await token.hasRole(defaultAdminRole, admin.address)).to.be.true;
    });

    it("Should grant admin role to controller if admin addresses is not provided", async function () {
      const newToken = await Token.deploy(
        baseURI,
        ethers.constants.AddressZero,
      );
      const defaultAdminRole = await newToken.DEFAULT_ADMIN_ROLE();
      const controllerRole = await newToken.CONTROLLER_ROLE();

      expect(await newToken.hasRole(controllerRole, controller.address)).to.be
        .true;
      expect(await newToken.hasRole(defaultAdminRole, controller.address)).to.be
        .true;
    });
  });

  describe("AccessControl", function () {
    it("Admin can grant controller role", async function () {
      const controllerRole = await token.CONTROLLER_ROLE();

      await token.connect(admin).grantRole(controllerRole, addr2.address);

      expect(await token.hasRole(controllerRole, addr2.address)).to.be.true;
    });

    it("Admin can revoke controller role", async function () {
      const controllerRole = await token.CONTROLLER_ROLE();

      await token.connect(admin).revokeRole(controllerRole, controller.address);

      expect(await token.hasRole(controllerRole, controller.address)).to.be
        .false;
    });

    it("Admin can grant admin role", async function () {
      const adminRole = await token.DEFAULT_ADMIN_ROLE();

      await token.connect(admin).grantRole(adminRole, addr2.address);

      expect(await token.hasRole(adminRole, addr2.address)).to.be.true;
    });

    it("Admin can revoke admin role", async function () {
      const adminRole = await token.DEFAULT_ADMIN_ROLE();

      await token.connect(admin).revokeRole(adminRole, admin.address);

      expect(await token.hasRole(adminRole, admin.address)).to.be.false;
    });
    it("Controller cant grant admin role", async function () {
      const adminRole = await token.DEFAULT_ADMIN_ROLE();

      await expect(
        token.grantRole(adminRole, addr2.address),
      ).to.be.revertedWith(
        `AccessControl: account ${controller.address.toLocaleLowerCase()} is missing role ${adminRole}`,
      );

      expect(await token.hasRole(adminRole, addr2.address)).to.be.false;
    });

    it("Controller cant revoke admin role", async function () {
      const adminRole = await token.DEFAULT_ADMIN_ROLE();

      await expect(
        token.revokeRole(adminRole, admin.address),
      ).to.be.revertedWith(
        `AccessControl: account ${controller.address.toLocaleLowerCase()} is missing role ${adminRole}`,
      );

      expect(await token.hasRole(adminRole, admin.address)).to.be.true;
    });

    it("Controller cant grant controller role", async function () {
      const adminRole = await token.DEFAULT_ADMIN_ROLE();

      await expect(
        token.grantRole(adminRole, addr2.address),
      ).to.be.revertedWith(
        `AccessControl: account ${controller.address.toLocaleLowerCase()} is missing role ${adminRole}`,
      );

      expect(await token.hasRole(adminRole, addr2.address)).to.be.false;
    });

    it("Controller cant revoke controller role", async function () {
      const controllerRole = await token.CONTROLLER_ROLE();
      const adminRole = await token.DEFAULT_ADMIN_ROLE();

      await expect(
        token.revokeRole(controllerRole, controller.address),
      ).to.be.revertedWith(
        `AccessControl: account ${controller.address.toLocaleLowerCase()} is missing role ${adminRole}`,
      );

      expect(await token.hasRole(controllerRole, admin.address)).to.be.false;
    });
  });

  describe("Transactions", function () {
    it("Should mint tokens successfully by the owner", async function () {
      await token.mint(admin.address, 1, 100, []);
      const balance = await token.balanceOf(admin.address, 1);
      expect(balance).to.equal(100);
    });

    it("Should mint batch tokens successfully by the owner", async function () {
      const ids = [1, 2, 3];
      const amounts = [100, 200, 300];
      await token.mintBatch(admin.address, ids, amounts, []);
      for (let i = 0; i < ids.length; i++) {
        const balance = await token.balanceOf(admin.address, ids[i]);
        expect(balance).to.equal(amounts[i]);
      }
    });

    it("Should not mint tokens by non-operator", async function () {
      await expect(
        token.connect(admin).mint(admin.address, 1, 100, []),
      ).to.be.revertedWith(
        `AccessControl: account ${admin.address.toLocaleLowerCase()} is missing role ${OPERATOR_ROLE}`,
      );
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause the contract", async function () {
      await token.pause();
      expect(await token.paused()).to.be.true;

      await token.unpause();
      expect(await token.paused()).to.be.false;
    });

    it("Should not mint while paused", async function () {
      await token.pause();
      await expect(token.mint(admin.address, 1, 100, [])).to.be.revertedWith(
        "ERC1155Pausable: token transfer while paused",
      );
    });
  });
});
