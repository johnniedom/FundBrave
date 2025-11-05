const { ethers, network } = require("hardhat");

// --- !!! IMPORTANT !!! ---
// --- FILL THIS OUT WITH REAL ADDRESSES BEFORE MAINNET DEPLOY ---
const networkConfig = {
  // Hardhat (ChainId: 31337) -> Mocks Aave/Uniswap
  31337: {
    name: "hardhat",
    stakingPoolType: 0, // 0=Aave
    swapAdapterType: "uniswap", // "uniswap" or "relay"
    // We will get mock addresses from 00_deploy_mocks.js
  },
  // Polygon (ChainId: 137) -> Aave/Uniswap
  137: {
    name: "polygon",
    axelarGateway: "0x6f015F16De9fC8791b234eF68D486d2bF203FBA8",
    axelarGasService: "0x2d5d7d31F671F86C782533cc367F14109a082712",
    usdt: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    weth: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
    
    stakingPoolType: 0, // 0=Aave
    aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    aUsdt: "0x6ab707Aca953eDAeFBc4fD23bA73294241490620",
    morphoVault: ethers.constants.AddressZero,
    
    swapAdapterType: "uniswap",
    uniswapRouter: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff", // QuickSwap V2
    universalRouter: ethers.constants.AddressZero,
  },
  // StatusL2 (Example ChainId: 12345) -> Morpho/Relay
  12345: {
    name: "statusL2",
    axelarGateway: "0x..._STATUS_GATEWAY_...",
    axelarGasService: "0x..._STATUS_GAS_...",
    usdt: "0x..._STATUS_USDT_...",
    weth: "0x..._STATUS_WETH_...",
    
    stakingPoolType: 1, // 1=Morpho
    aavePool: ethers.constants.AddressZero,
    aUsdt: ethers.constants.AddressZero,
    morphoVault: "0x..._STATUS_MORPHO_VAULT_...",
    
    swapAdapterType: "relay",
    uniswapRouter: ethers.constants.AddressZero,
    universalRouter: "0x..._STATUS_UNIV3_UNIVERSAL_ROUTER_...",
  },
};
// --- END OF CONFIG ---

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, get, log } = deployments;
  const { deployer, platformWallet } = await getNamedAccounts();
  const chainId = network.config.chainId;
  const config = networkConfig[chainId];

  if (!config) {
    throw new Error(`Missing network configuration for chainId: ${chainId}`);
  }

  let gatewayAddress, gasServiceAddress, usdtAddress, wethAddress;
  let aavePoolAddress, aUsdtAddress, morphoVaultAddress;
  let swapAdapterAddress;

  log(`Deploying for network: ${config.name}`);

  if (chainId === 31337) {
    // Local Hardhat Network - Use mocks
    gatewayAddress = (await get("MockAxelarGateway")).address;
    gasServiceAddress = ethers.constants.AddressZero;
    usdtAddress = (await get("MockUSDT")).address;
    wethAddress = (await get("MockWETH")).address;
    aavePoolAddress = (await get("MockAavePool")).address;
    aUsdtAddress = (await get("MockAUSDT")).address;
    morphoVaultAddress = ethers.constants.AddressZero; // Not mocking morpho for this
    
    // Deploy the UniswapAdapter for testing
    const routerAddress = (await get("MockUniswapRouter")).address;
    const adapterDeploy = await deploy("UniswapAdapter", {
      from: deployer,
      args: [routerAddress, usdtAddress, wethAddress],
      log: true,
    });
    swapAdapterAddress = adapterDeploy.address;

  } else {
    // Mainnet/Testnet
    gatewayAddress = config.axelarGateway;
    gasServiceAddress = config.axelarGasService;
    usdtAddress = config.usdt;
    wethAddress = config.weth;
    aavePoolAddress = config.aavePool;
    aUsdtAddress = config.aUsdt;
    morphoVaultAddress = config.morphoVault;

    // --- 1. Deploy Swap Adapter ---
    log(`Deploying Swap Adapter (${config.swapAdapterType})...`);
    if (config.swapAdapterType === "uniswap") {
      const adapterDeploy = await deploy("UniswapAdapter", {
        from: deployer,
        args: [config.uniswapRouter, usdtAddress, wethAddress],
        log: true,
      });
      swapAdapterAddress = adapterDeploy.address;
    } else if (config.swapAdapterType === "relay") {
      const adapterDeploy = await deploy("RelayAdapter", {
        from: deployer,
        args: [config.universalRouter, usdtAddress, wethAddress, deployer],
        log: true,
      });
      swapAdapterAddress = adapterDeploy.address;
    } else {
      throw new Error("Invalid swapAdapterType");
    }
  }

  const platformFeeRecipient = platformWallet || deployer;
  log(`Platform Fee Recipient: ${platformFeeRecipient}`);
  
  // --- 2. Deploy FundraiserFactory ---
  log("Deploying FundraiserFactory...");
  const factoryDeploy = await deploy("FundraiserFactory", {
    from: deployer,
    args: [
      gatewayAddress,
      gasServiceAddress,
      swapAdapterAddress,
      usdtAddress,
      wethAddress,
      platformFeeRecipient,
      ethers.constants.AddressZero,
      aavePoolAddress,
      aUsdtAddress,
      morphoVaultAddress,
      config.stakingPoolType,
    ],
    log: true,
  });
  const factory = await ethers.getContractAt("FundraiserFactory", factoryDeploy.address);
  log(`FundraiserFactory deployed to: ${factory.address}`);

  // --- 3. Deploy FundBraveBridge ---
  log("Deploying FundBraveBridge...");
  const bridgeDeploy = await deploy("FundBraveBridge", {
    from: deployer,
    args: [
      gatewayAddress,
      gasServiceAddress,
      swapAdapterAddress,
      usdtAddress,
      factory.address,
    ],
    log: true,
  });
  log(`FundBraveBridge deployed to: ${bridgeDeploy.address}`);

  // --- 4. Update Factory with Bridge Address ---
  log("Updating factory with bridge address...");
  const tx = await factory.updateBridge(bridgeDeploy.address);
  await tx.wait(1);
  log("Factory updated successfully!");

  log("----------------------------------------------------");
};

module.exports.tags = ["all", "core"];
// Make sure mocks are deployed first on local
module.exports.dependencies = ["mocks"]; 
