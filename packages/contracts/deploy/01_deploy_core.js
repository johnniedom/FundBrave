const { ethers, network } = require("hardhat");

// --- FILL THIS OUT WITH REAL ADDRESSES BEFORE MAINNET DEPLOY ---
const networkConfig = {
  // Polygon (ChainId: 137)
  137: {
    name: "polygon",
    axelarGateway: "0x6f015F16De9fC8791b234eF68D486d2bF203FBA8",
    axelarGasService: "0x2d5d7d31F671F86C782533cc367F14109a082712",
    uniswapRouter: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
    usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    aUsdt: "0x6ab707Aca953eDAeFBc4fD23bA73294241490620",
    weth: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    morphoVault: ethers.constants.AddressZero,
    stakingPoolType: 0, 
  },
  // Mumbai Testnet (ChainId: 80001)
  80001: {
    name: "mumbai",
    axelarGateway: "0xBF62ef1486468a6bd26Dd669C06db43CfAc4580C",
    axelarGasService: "0x2d5d7d31F671F86C782533cc367F14109a082712",
    uniswapRouter: "0x8954AfA98594b838bda56FE4C12a09D079C41EV1",
    usdt: "0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97",
    aavePool: "0x9198F13B08E299d85E096929fA9781A1E3d5d827",
    aUsdt: "0x606501f68cE16Ea6E4ABf856B3eb402A3C4C6088",
    weth: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
  },
  // StatusL2 (Example ChainId: 12345)
  12345: {
    name: "statusL2",
    axelarGateway: "0x...",
    axelarGasService: "0x...",
    uniswapRouter: "0x...", // Status's Uniswap
    usdt: "0x...",         
    aavePool: ethers.constants.AddressZero, // It's not an Aave chain
    aUsdt: ethers.constants.AddressZero,
    morphoVault: "0x...",  // The REAL Morpho Vault address
    stakingPoolType: 1, // 1 = Morpho
  },
};

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, get, log } = deployments;
  const { deployer, platformWallet } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let gatewayAddress, gasServiceAddress, routerAddress, usdtAddress, aavePoolAddress, aUsdtAddress;

  if (chainId === 31337) {
    // Local Hardhat Network
    log("Local network detected! Using Mocks...");
    gatewayAddress = (await get("MockAxelarGateway")).address;
    gasServiceAddress = ethers.constants.AddressZero;
    routerAddress = (await get("MockUniswapRouter")).address;
    usdtAddress = (await get("MockUSDT")).address;
    aavePoolAddress = (await get("MockAavePool")).address;
    aUsdtAddress = (await get("MockAUSDT")).address;
  } else if (networkConfig[chainId]) {
    // Mainnet/Testnet
    log(`Network ${networkConfig[chainId].name} detected! Using real addresses...`);
    const config = networkConfig[chainId];
    gatewayAddress = config.axelarGateway;
    gasServiceAddress = config.axelarGasService;
    routerAddress = config.uniswapRouter;
    usdtAddress = config.usdt;
    aavePoolAddress = config.aavePool;
    aUsdtAddress = config.aUsdt;
  } else {
    throw new Error("Missing network configuration for this chain!");
  }

  const platformFeeRecipient = platformWallet || deployer; // Use named account or fallback to deployer
  log(`Platform Fee Recipient set to: ${platformFeeRecipient}`);

  // --- 1. Deploy FundraiserFactory ---
  // We deploy with a placeholder for the bridge address
  log("Deploying FundraiserFactory...");
  const factoryDeploy = await deploy("FundraiserFactory", {
    from: deployer,
    args: [
      gatewayAddress,
      gasServiceAddress,
      routerAddress,
      usdtAddress,
      platformFeeRecipient,
      ethers.constants.AddressZero,
      aavePoolAddress,
      aUsdtAddress,
    ],
    log: true,
  });
  const factory = await ethers.getContractAt("FundraiserFactory", factoryDeploy.address);
  log(`FundraiserFactory deployed to: ${factory.address}`);

  // --- 2. Deploy FundBraveBridge ---
  // We deploy with the real factory address
  log("Deploying FundBraveBridge...");
  const bridgeDeploy = await deploy("FundBraveBridge", {
    from: deployer,
    args: [
      gatewayAddress,
      gasServiceAddress,
      routerAddress,
      usdtAddress,
      factory.address,
    ],
    log: true,
  });
  const bridge = await ethers.getContractAt("FundBraveBridge", bridgeDeploy.address);
  log(`FundBraveBridge deployed to: ${bridge.address}`);

  // --- 3. Update Factory with Bridge Address ---
  log("Updating factory with bridge address...");
  const tx = await factory.updateBridge(bridge.address);
  await tx.wait(1);
  log("Factory updated successfully!");

  // --- 4. Post-Deploy Configuration (Optional but Recommended) ---
  // You should configure the bridge with at least its local tokens
  if (chainId !== 31337) {
    try {
        log("Configuring bridge with local tokens...");
        const chainName = networkConfig[chainId].name;
        // Add local USDT
        let tokenTx = await bridge.addSupportedToken(chainName, usdtAddress, "USDT");
        await tokenTx.wait(1);
        log(`Added ${chainName} token: USDT`);
        // Add local WETH/WMATIC
        tokenTx = await bridge.addSupportedToken(chainName, networkConfig[chainId].weth, "WETH");
        await tokenTx.wait(1);
        log(`Added ${chainName} token: WETH`);
    } catch (e) {
        log(`Error in post-deploy config: ${e.message}`);
        log("!! Please configure bridge tokens manually !!");
    }
  }

  log("----------------------------------------------------");
  log("Core contracts deployed and configured!");
  log("----------------------------------------------------");
};

module.exports.tags = ["all", "core"];
module.exports.dependencies = ["mocks"];