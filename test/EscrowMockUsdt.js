const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow ↔ MockUSDT Integration Test", function () {
  let mockUSDT, escrow;
  let deployer, buyer, seller, feeCollector;

  const ORDER_ID = 42;
  const AMOUNT = ethers.utils.parseUnits("500", 18);
  const DEADLINE = Math.floor(Date.now() / 1000) + 3600;
  const PLATFORM_FEE_BP = 75;

  beforeEach(async function () {
    [deployer, buyer, seller, feeCollector] = await ethers.getSigners();

    const Mock = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await Mock.deploy();
    await mockUSDT.deployed();

    await mockUSDT.transfer(buyer.address, AMOUNT);

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(mockUSDT.address, feeCollector.address);
    await escrow.deployed();
  });

  it("should complete full escrow: lock, release, distribute funds correctly", async function () {
    await mockUSDT.connect(buyer).approve(escrow.address, AMOUNT);
    await expect(
      escrow.connect(buyer).lockFunds(ORDER_ID, seller.address, AMOUNT, DEADLINE)
    ).to.emit(escrow, "FundsLocked");
    // ... rest of test
  });

  // ... other it() blocks ...
});
