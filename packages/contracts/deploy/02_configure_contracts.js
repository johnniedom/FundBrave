const { ethers, network } = require("hardhat");

// --- CONFIGURATION DATA ---
// You MUST fill this in.
// These are the addresses of your *deployed* FundraiserFactory contracts
// on other chains.
const factoryAddresses = {
  polygon: "0x..._POLYGON_FACTORY_ADDRESS_...",
  statusL2: "0x..._STATUSL2_FACTORY_ADDRESS_...",
  // ... other chains
};

// Common tokens you want to support for bridging
const supportedTokens = {
  polygon: [
    { name: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", symbol: "USDT" },
    { name: "WMATIC", address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", symbol: "WETH" },
  ],
  statusL2: [
    { name: "USDT", address: "0x..._STATUS_USDT_...", symbol: "USDT" },
    { name: "WETH", address: "0x..._STATUS_WETH_...", symbol: "WETH" },
    { name: "DAI", address: "0x..._STATUS_DAI_...", symbol: "DAI" },
  ],
};

// Relay Adapter config for StatusL2
const relayConfig = {
  wethToUsdtFee: 500, // 0.05%
  tokenToWethFees: [
    { name: "DAI", address: "0x..._STATUS_DAI_...", fee: 500 },
    // ... other tokens
  ],
};
// --- END OF CONFIG ---

module.exports = async ({ getNamedAccounts, deployments, network }) => {
  const { get, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // Don't run on hardhat
  if (chainId === 31337) {
    log("Skipping configuration script on hardhat.");
    return;
  }

  log("----------------------------------------------------");
  log("Starting post-deployment configuration...");

  // Get deployed contracts
  const bridge = await ethers.getContractAt(
    "FundBraveBridge",
    (await get("FundBraveBridge")).address
  );

  const currentChainName = network.name;
  if (!factoryAddresses[currentChainName]) {
    log(`Warning: Missing factory address for current chain ${currentChainName}`);
    return;
  }

  // --- 1. Configure FundBraveBridge ---
  log("Configuring FundBraveBridge chains...");
  for (const [chainName, factoryAddress] of Object.entries(factoryAddresses)) {
    if (chainName === currentChainName) continue; // Don't add our own chain
    
    log(`Adding supported chain: ${chainName}`);
    try {
      const tx = await bridge.addSupportedChain(chainName, factoryAddress);
      await tx.wait(1);
    } catch (e) {
      log(`Error adding chain ${chainName}: ${e.message}`);
    }
  }

  log("Configuring FundBraveBridge tokens...");
  if (supportedTokens[currentChainName]) {
    for (const token of supportedTokens[currentChainName]) {
      log(`Adding supported token: ${token.name} (${token.symbol})`);
      try {
        const tx = await bridge.addSupportedToken(
          currentChainName, // Note: You configure tokens for *your* chain
          token.address,
          token.symbol
        );
        await tx.wait(1);
      } catch (e) {
        log(`Error adding token ${token.name}: ${e.message}`);
      }
    }
  }

  // --- 2. Configure RelayAdapter (if on StatusL2) ---
  if (networkConfig[chainId]?.swapAdapterType === "relay") {
    log("Configuring RelayAdapter...");
    const adapter = await ethers.getContractAt(
      "RelayAdapter",
      (await get("RelayAdapter")).address
    );

    try {
      log(`Setting WETH -> USDT fee to ${relayConfig.wethToUsdtFee}`);
      let tx = await adapter.setWethToUsdtFee(relayConfig.wethToUsdtFee);
      await tx.wait(1);

      for (const token of relayConfig.tokenToWethFees) {
        log(`Setting ${token.name} -> WETH fee to ${token.fee}`);
        tx = await adapter.setTokenToWethFee(token.address, token.fee);
        await tx.wait(1);
      }
    } catch (e) {
      log(`Error configuring RelayAdapter: ${e.message}`);
    }
  }

  log("Configuration complete!");
  log("----------------------------------------------------");
};

module.exports.tags = ["all", "config"];
module.exports.dependencies = ["core"]; // Run after 'core' deployment
