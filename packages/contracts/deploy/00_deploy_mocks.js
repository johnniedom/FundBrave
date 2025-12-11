const { ethers } = require("hardhat");

const usdt = (val) => ethers.utils.parseUnits(val, 6);
const dai = (val) => ethers.utils.parseEther(val);

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  // Only deploy mocks on hardhat/localhost
  if (network.name === "hardhat" || network.name === "localhost") {
    log("----------------------------------------------------");
    log("Deploying Mocks for local testing...");

    // 1. Deploy Mock Tokens
    const usdtToken = await deploy("MockUSDT", {
      contract: "MockERC20",
      from: deployer,
      args: ["Tether", "USDT", 6],
      log: true,
    });
    const aUsdtToken = await deploy("MockAUSDT", {
      contract: "MockERC20",
      from: deployer,
      args: ["Aave USDT", "aUSDT", 6],
      log: true,
    });
    const daiToken = await deploy("MockDAI", {
      contract: "MockERC20",
      from: deployer,
      args: ["Dai", "DAI", 18],
      log: true,
    });
    const wethToken = await deploy("MockWETH", {
      from: deployer,
      args: [],
      log: true,
    });

    // 2. Deploy Mock DeFi Protocols
    const router = await deploy("MockUniswapRouter", {
      from: deployer,
      args: [wethToken.address, usdtToken.address],
      log: true,
    });
    const aavePool = await deploy("MockAavePool", {
      from: deployer,
      args: [usdtToken.address, aUsdtToken.address],
      log: true,
    });
    const gateway = await deploy("MockAxelarGateway", {
      from: deployer,
      args: [],
      log: true,
    });

    // 3. Fund Mocks
    log("Funding Mocks...");
    const usdtContract = await ethers.getContractAt("MockERC20", usdtToken.address);
    const aUsdtContract = await ethers.getContractAt("MockERC20", aUsdtToken.address);
    const daiContract = await ethers.getContractAt("MockERC20", daiToken.address);
    const gatewayContract = await ethers.getContractAt("MockAxelarGateway", gateway.address);
    
    // Fund router with 1M USDT
    await usdtContract.mint(router.address, usdt("1000000"));
    // Fund Aave pool with 1M USDT (for withdrawals) and 1M aUSDT (for supplies)
    await usdtContract.mint(aavePool.address, usdt("1000000"));
    await aUsdtContract.mint(aavePool.address, usdt("1000000"));
    
    // Register tokens with Axelar Gateway mock
    await gatewayContract.registerToken("USDT", usdtToken.address);
    await gatewayContract.registerToken("aUSDC", daiToken.address); // Use DAI to mock aUSDC
    
    log("Mocks deployed and funded!");
    log("----------------------------------------------------");
  }
};
module.exports.tags = ["all", "mocks"];