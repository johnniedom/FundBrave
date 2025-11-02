import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Starting FundBrave deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Network-specific addresses
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;
  
  let AXELAR_GATEWAY, AXELAR_GAS_SERVICE, USDT, UNISWAP_ROUTER;
  
  if (chainId === 11155111n) { // Sepolia
    AXELAR_GATEWAY = process.env.AXELAR_GATEWAY_SEPOLIA || "0xe432150cce91c13a887f7D836923d5597adD8E31";
    AXELAR_GAS_SERVICE = process.env.AXELAR_GAS_SERVICE_SEPOLIA || "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
    USDT = process.env.USDT_SEPOLIA || "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06";
    UNISWAP_ROUTER = process.env.UNISWAP_ROUTER_SEPOLIA || "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  } else if (chainId === 80001n) { // Mumbai
    AXELAR_GATEWAY = "0xBF62ef1486468a6bd26Dd669C06db43dEd5B849B";
    AXELAR_GAS_SERVICE = "0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6";
    USDT = "0x3813e82e6f7098b9583FC0F33a962D02018B6803";
    UNISWAP_ROUTER = process.env.UNISWAP_ROUTER_MUMBAI || "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  } else if (chainId === 137n) { // Polygon Mainnet
    AXELAR_GATEWAY = "0x6f015F16De9fC8791b234eF68D486d2bF203FBA8";
    AXELAR_GAS_SERVICE = "0x2d5d7d31F671F86C782533cc367F14109a082712";
    USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    UNISWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  } else if (chainId === 1n) { // Ethereum Mainnet
    AXELAR_GATEWAY = "0x4F4495243837681061C4743b74B3eEdf548D56A5";
    AXELAR_GAS_SERVICE = "0x2d5d7d31F671F86C782533cc367F14109a082712";
    USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    UNISWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  } else if (chainId === 31337n) { // Hardhat local
    // Use deployer address as mock for local testing
    AXELAR_GATEWAY = deployer.address;
    AXELAR_GAS_SERVICE = deployer.address;
    USDT = deployer.address;
    UNISWAP_ROUTER = deployer.address;
  } else {
    throw new Error(`Unsupported network with chainId: ${chainId}`);
  }
  
  const PLATFORM_FEE_RECIPIENT = deployer.address;

  // Step 1: Deploy Fundraiser Implementation
  console.log("1️⃣ Deploying Fundraiser Implementation...");
  const Fundraiser = await ethers.getContractFactory("Fundraiser");
  const fundraiserImpl = await Fundraiser.deploy();
  await fundraiserImpl.waitForDeployment();
  const fundraiserImplAddress = await fundraiserImpl.getAddress();
  console.log("✅ Fundraiser Implementation deployed to:", fundraiserImplAddress, "\n");

  // Step 2: Deploy FundraiserFactory with UUPS Proxy
  console.log("2️⃣ Deploying FundraiserFactory...");
  const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");
  
  const factory = await upgrades.deployProxy(
    FundraiserFactory,
    [
      fundraiserImplAddress,
      AXELAR_GATEWAY,
      AXELAR_GAS_SERVICE,
      UNISWAP_ROUTER,
      USDT,
      PLATFORM_FEE_RECIPIENT
    ],
    { 
      initializer: "initialize",
      kind: "uups"
    }
  );
  
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  const factoryImplAddress = await upgrades.erc1967.getImplementationAddress(factoryAddress);
  console.log("✅ FundraiserFactory Proxy deployed to:", factoryAddress);
  console.log("✅ FundraiserFactory Implementation deployed to:", factoryImplAddress, "\n");

  // Step 3: Deploy FundBraveBridge
  console.log("3️⃣ Deploying FundBraveBridge...");
  const FundBraveBridge = await ethers.getContractFactory("FundBraveBridge");
  const bridge = await FundBraveBridge.deploy(AXELAR_GATEWAY, AXELAR_GAS_SERVICE);
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("✅ FundBraveBridge deployed to:", bridgeAddress, "\n");

  // Step 4: Deploy FundBraveToken with UUPS Proxy
  console.log("4️⃣ Deploying FundBraveToken...");
  const FundBraveToken = await ethers.getContractFactory("FundBraveToken");
  
  const token = await upgrades.deployProxy(
    FundBraveToken,
    [],
    { 
      initializer: "initialize",
      kind: "uups"
    }
  );
  
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  const tokenImplAddress = await upgrades.erc1967.getImplementationAddress(tokenAddress);
  console.log("✅ FundBraveToken Proxy deployed to:", tokenAddress);
  console.log("✅ FundBraveToken Implementation deployed to:", tokenImplAddress, "\n");

  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    chainId: chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      FundraiserImplementation: fundraiserImplAddress,
      FundraiserFactoryProxy: factoryAddress,
      FundraiserFactoryImplementation: factoryImplAddress,
      FundBraveBridge: bridgeAddress,
      FundBraveTokenProxy: tokenAddress,
      FundBraveTokenImplementation: tokenImplAddress,
    },
    configuration: {
      axelarGateway: AXELAR_GATEWAY,
      axelarGasService: AXELAR_GAS_SERVICE,
      usdt: USDT,
      uniswapRouter: UNISWAP_ROUTER,
      platformFeeRecipient: PLATFORM_FEE_RECIPIENT,
    }
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const deploymentDir = path.join(__dirname, "..", "deployments");
  const deploymentPath = path.join(deploymentDir, `${network.name}-${Date.now()}.json`);
  
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // Save latest deployment
  const latestPath = path.join(deploymentDir, `${network.name}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Latest deployment info saved to:", latestPath);

  console.log("\n✅ Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Configure cross-chain support in FundBraveBridge");
  console.log("3. Grant necessary roles to admin addresses");
  console.log("4. Update frontend with new contract addresses");
  
  console.log("\n📝 Environment variables to update:");
  console.log(`FUNDRAISER_IMPLEMENTATION=${fundraiserImplAddress}`);
  console.log(`FUNDRAISER_FACTORY_PROXY=${factoryAddress}`);
  console.log(`FUNDBRAVE_BRIDGE=${bridgeAddress}`);
  console.log(`FUNDBRAVE_TOKEN=${tokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });