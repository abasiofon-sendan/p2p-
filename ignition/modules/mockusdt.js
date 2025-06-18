// const Mock = await ethers.getContractFactory("MockUSDT");
// const usdt = await Mock.deploy();
// await usdt.deployed();

// const Escrow = await ethers.getContractFactory("Escrow");
// const escrow = await Escrow.deploy(usdt.address, feeCollector);
// await escrow.deployed();


const [deployer, feeCollector] = await ethers.getSigners();
const Mock = await ethers.getContractFactory("MockUSDT");
const mockUSDT = await Mock.deploy();
await mockUSDT.deployed();

const Escrow = await ethers.getContractFactory("Escrow");
const escrow = await Escrow.deploy(mockUSDT.address, feeCollector.address);
await escrow.deployed();

console.log("MockUSDT:", mockUSDT.address);
console.log("Escrow:", escrow.address);
