const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const usdt = (val) => ethers.utils.parseUnits(val, 6);
const dai = (val) => ethers.utils.parseEther(val);
const FEE_500 = 500;

// --- Fixture 1: Deploys the AAVE / UNISWAP V2 stack ---
async function deployAaveUniswapFixture() {
    const [owner, creator, donor, staker, staker2, beneficiary, platformWallet, remoteUser] =
        await ethers.getSigners();

    // Mocks
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const MockWETH = await ethers.getContractFactory("MockWETH");
    const MockUniswapRouter = await ethers.getContractFactory("MockUniswapRouter");
    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    const MockAxelarGateway = await ethers.getContractFactory("MockAxelarGateway");

    // Tokens
    const usdtToken = await MockERC20.deploy("Tether", "USDT", 6);
    const daiToken = await MockERC20.deploy("Dai", "DAI", 18);
    const wethToken = await MockWETH.deploy();
    const aUsdtToken = await MockERC20.deploy("Aave USDT", "aUSDT", 6);

    // DeFi Mocks
    const router = await MockUniswapRouter.deploy(wethToken.address, usdtToken.address);
    const aavePool = await MockAavePool.deploy(usdtToken.address, aUsdtToken.address);
    const gateway = await MockAxelarGateway.deploy();
    await gateway.registerToken("aUSDC", daiToken.address);
    await gateway.registerToken("USDT", usdtToken.address);

    // --- Deploy Core ---
    // 1. Deploy Adapter
    const UniswapAdapter = await ethers.getContractFactory("UniswapAdapter");
    const swapAdapter = await UniswapAdapter.deploy(router.address, usdtToken.address, wethToken.address);

    // 2. Deploy Factory (Aave Type 0)
    const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");
    const factory = await FundraiserFactory.deploy(
        gateway.address, ethers.constants.AddressZero, swapAdapter.address,
        usdtToken.address, wethToken.address, platformWallet.address,
        ethers.constants.AddressZero, aavePool.address, aUsdtToken.address,
        ethers.constants.AddressZero, 0 // 0 = Aave
    );

    // 3. Deploy Bridge
    const FundBraveBridge = await ethers.getContractFactory("FundBraveBridge");
    const bridge = await FundBraveBridge.deploy(
        gateway.address, ethers.constants.AddressZero, swapAdapter.address,
        usdtToken.address, factory.address
    );

    // 4. Link Factory
    await factory.connect(owner).updateBridge(bridge.address);

    // Fund Mocks
    await usdtToken.mint(router.address, usdt("1000000"));
    await usdtToken.mint(aavePool.address, usdt("1000000"));
    await aUsdtToken.mint(aavePool.address, usdt("1000000"));

    return { factory, bridge, gateway, usdtToken, daiToken, aUsdtToken, aavePool, owner, creator, donor, staker, staker2, beneficiary, platformWallet, remoteUser };
}

// --- Fixture 2: Deploys the MORPHO / UNISWAP (Relay-like) stack ---
async function deployMorphoUniswapFixture() {
    const [owner, creator, donor, staker, staker2, beneficiary, platformWallet, remoteUser] =
        await ethers.getSigners();

    // Mocks (Mostly the same, but sub Aave for Morpho)
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const MockWETH = await ethers.getContractFactory("MockWETH");
    const MockUniswapRouter = await ethers.getContractFactory("MockUniswapRouter");
    const MockMetaMorpho = await ethers.getContractFactory("MockMetaMorpho");
    const MockAxelarGateway = await ethers.getContractFactory("MockAxelarGateway");

    // Tokens
    const usdtToken = await MockERC20.deploy("Tether", "USDT", 6);
    const daiToken = await MockERC20.deploy("Dai", "DAI", 18);
    const wethToken = await MockWETH.deploy();

    // DeFi Mocks (Using Uniswap V2 mock for simplicity, same as above)
    const router = await MockUniswapRouter.deploy(wethToken.address, usdtToken.address);
    const morphoVault = await MockMetaMorpho.deploy(usdtToken.address);
    const gateway = await MockAxelarGateway.deploy();
    await gateway.registerToken("aUSDC", daiToken.address);

    // --- Deploy Core ---
    // 1. Deploy Adapter (Using UniswapAdapter for this test)
    const UniswapAdapter = await ethers.getContractFactory("UniswapAdapter");
    const swapAdapter = await UniswapAdapter.deploy(router.address, usdtToken.address, wethToken.address);

    // 2. Deploy Factory (Morpho Type 1)
    const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");
    const factory = await FundraiserFactory.deploy(
        gateway.address, ethers.constants.AddressZero, swapAdapter.address,
        usdtToken.address, wethToken.address, platformWallet.address,
        ethers.constants.AddressZero, ethers.constants.AddressZero, ethers.constants.AddressZero,
        morphoVault.address, 1 // 1 = Morpho
    );

    // 3. Deploy Bridge
    const FundBraveBridge = await ethers.getContractFactory("FundBraveBridge");
    const bridge = await FundBraveBridge.deploy(
        gateway.address, ethers.constants.AddressZero, swapAdapter.address,
        usdtToken.address, factory.address
    );

    // 4. Link Factory
    await factory.connect(owner).updateBridge(bridge.address);

    // Fund Mocks
    await usdtToken.mint(router.address, usdt("1000000"));
    await usdtToken.mint(morphoVault.address, usdt("1000000"));

    return { factory, bridge, gateway, usdtToken, daiToken, morphoVault, owner, creator, donor, staker, staker2, beneficiary, platformWallet, remoteUser };
}


// --- Helper function to create a fundraiser ---
async function createFundraiser(factory, creator, beneficiary) {
    const tx = await factory.connect(creator).createFundraiser(
        "Test Fundraiser", ["img.png"], ["Education"], "Desc", "Global",
        beneficiary.address, usdt("10000"), 30
    );
    const receipt = await tx.wait();
    const fundraiserAddr = receipt.events.find(e => e.event === "FundraiserCreated").args.fundraiser;
    const poolAddr = receipt.events.find(e => e.event === "StakingPoolCreated").args.poolAddress;
    const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);
    return { fundraiser, poolAddr };
}

// ========== TEST SUITE 1: AAVE + UNISWAP V2 ==========
describe("System Test (Aave / Uniswap V2)", () => {
    let factory, beneficiary, staker, staker2, usdtToken, aUsdtToken;
    let fundraiser, stakingPool;

    beforeEach(async () => {
        const fixture = await loadFixture(deployAaveUniswapFixture);
        factory = fixture.factory;
        beneficiary = fixture.beneficiary;
        staker = fixture.staker;
        staker2 = fixture.staker2;
        usdtToken = fixture.usdtToken;
        aUsdtToken = fixture.aUsdtToken;
        
        const { fundraiser: f, poolAddr: p } = await createFundraiser(factory, fixture.creator, beneficiary);
        fundraiser = f;
        stakingPool = await ethers.getContractAt("StakingPool", p); // Aave pool ABI
    });

    it("should deploy the correct Aave StakingPool", async () => {
        expect(await stakingPool.AAVE_POOL()).to.not.equal(ethers.constants.AddressZero);
    });

    it("should handle local stake (Native -> Aave)", async () => {
        await factory.connect(staker).stakeNative(0, { value: ethers.utils.parseEther("1.0") });
        const expectedUsdt = usdt("2000"); // 1:2000 in mock
        expect(await stakingPool.stakerPrincipal(staker.address)).to.equal(expectedUsdt);
        expect(await aUsdtToken.balanceOf(stakingPool.address)).to.equal(expectedUsdt);
    });

    it("should fix reward bug (rewardPerToken test)", async () => {
        // 1. Fund stakers
        await usdtToken.mint(staker.address, usdt("10000"));
        await usdtToken.mint(staker2.address, usdt("10000"));
        await usdtToken.connect(staker).approve(factory.address, usdt("10000"));
        await usdtToken.connect(staker2).approve(factory.address, usdt("10000"));
        
        // 2. Staker 1 stakes 10,000
        await factory.connect(staker).stakeERC20(0, usdtToken.address, usdt("10000"));

        // 3. Harvest 1: 1000 yield. Staker share = 190. Staker 1 gets all.
        await aUsdtToken.mint(stakingPool.address, usdt("1000"));
        await stakingPool.harvestAndDistribute();

        // 4. Staker 2 stakes 10,000
        await factory.connect(staker2).stakeERC20(0, usdtToken.address, usdt("10000"));

        // 5. Harvest 2: 1000 yield. Staker share = 190. Pool is 50/50.
        // S1 gets 95, S2 gets 95.
        await aUsdtToken.mint(stakingPool.address, usdt("1000"));
        await stakingPool.harvestAndDistribute();

        // 6. Check rewards
        // Staker 1: 190 (H1) + 95 (H2) = 285
        const s1Rewards = await stakingPool.claimableRewards(staker.address);
        expect(s1Rewards).to.equal(usdt("285"));
        // Staker 2: 0 (H1) + 95 (H2) = 95
        const s2Rewards = await stakingPool.claimableRewards(staker2.address);
        expect(s2Rewards).to.equal(usdt("95"));

        // 7. Staker 1 claims
        await stakingPool.connect(staker).claimStakerRewards();
        expect(await usdtToken.balanceOf(staker.address)).to.equal(usdt("285"));

        // 8. Staker 2 claims (proves no race condition)
        await stakingPool.connect(staker2).claimStakerRewards();
        expect(await usdtToken.balanceOf(staker2.address)).to.equal(usdt("95"));
    });
});

// ========== TEST SUITE 2: MORPHO + UNISWAP V2 ==========
describe("System Test (Morpho / Uniswap V2)", () => {
    let factory, beneficiary, staker, usdtToken, morphoVault;
    let fundraiser, stakingPool;

    beforeEach(async () => {
        const fixture = await loadFixture(deployMorphoUniswapFixture);
        factory = fixture.factory;
        beneficiary = fixture.beneficiary;
        staker = fixture.staker;
        usdtToken = fixture.usdtToken;
        morphoVault = fixture.morphoVault;
        
        const { fundraiser: f, poolAddr: p } = await createFundraiser(factory, fixture.creator, beneficiary);
        fundraiser = f;
        stakingPool = await ethers.getContractAt("MorphoStakingPool", p); // Morpho pool ABI
    });

    it("should deploy the correct Morpho StakingPool", async () => {
        expect(await stakingPool.METAMORPHO_VAULT()).to.equal(morphoVault.address);
    });

    it("should handle local stake (Native -> Morpho)", async () => {
        await factory.connect(staker).stakeNative(0, { value: ethers.utils.parseEther("1.0") });
        const expectedUsdt = usdt("2000"); // 1:2000 in mock
        expect(await stakingPool.stakerPrincipal(staker.address)).to.equal(expectedUsdt);
        // Check that the Morpho vault holds the funds
        expect(await morphoVault.balanceOf(stakingPool.address)).to.equal(expectedUsdt);
    });

    it("should handle reward logic on Morpho pool", async () => {
        // 1. Fund staker
        await usdtToken.mint(staker.address, usdt("10000"));
        await usdtToken.connect(staker).approve(factory.address, usdt("10000"));
        
        // 2. Staker 1 stakes 10,000
        await factory.connect(staker).stakeERC20(0, usdtToken.address, usdt("10000"));

        // 3. Harvest 1: 1000 yield. Staker share = 190.
        // We simulate yield by minting *assets* to the vault, increasing its value
        await usdtToken.mint(morphoVault.address, usdt("1000")); 
        await stakingPool.harvestAndDistribute();

        // Check rewards
        const s1Rewards = await stakingPool.claimableRewards(staker.address);
        expect(s1Rewards).to.equal(usdt("190"));

        // Staker 1 claims
        await stakingPool.connect(staker).claimStakerRewards();
        expect(await usdtToken.balanceOf(staker.address)).to.equal(usdt("190"));
    });
});

// ========== TEST SUITE 3: BRIDGE (Universal) ==========
describe("System Test (Bridge)", () => {
    let factory, bridge, gateway, daiToken, usdtToken, remoteUser, aUsdtToken;
    let fundraiser, stakingPool;

    beforeEach(async () => {
        const fixture = await loadFixture(deployAaveUniswapFixture);
        factory = fixture.factory;
        bridge = fixture.bridge;
        gateway = fixture.gateway;
        daiToken = fixture.daiToken;
        usdtToken = fixture.usdtToken;
        remoteUser = fixture.remoteUser;
        aUsdtToken = fixture.aUsdtToken;
        
        const { fundraiser: f, poolAddr: p } = await createFundraiser(factory, fixture.creator, fixture.beneficiary);
        fundraiser = f;
        stakingPool = await ethers.getContractAt("StakingPool", p);

        // Configure bridge for testing
        await bridge.addSupportedChain("Polygon", factory.address);
        await bridge.addSupportedToken("Polygon", daiToken.address, "aUSDC");
    });
    
    it("should handle a Cross-Chain Donation (Action 0)", async () => {
        await daiToken.mint(remoteUser.address, dai("1000"));
        await daiToken.connect(remoteUser).approve(gateway.address, dai("1000"));

        const daiAmount = dai("1000");
        const expectedUsdt = usdt("1000"); // 1:1 swap in mock
        const action = 0; // 0 = DONATE
        const payload = ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256", "uint8"],
            [remoteUser.address, 0, action]
        );

        // Simulate the call from the remote chain
        await gateway.connect(remoteUser).callBridge(
            bridge.address, "Polygon", "remote-addr", payload, "aUSDC", daiAmount
        );

        // Check final state
        expect(await usdtToken.balanceOf(fundraiser.address)).to.equal(expectedUsdt);
        expect(await fundraiser.totalDonations()).to.equal(expectedUsdt);
    });

    it("should handle a Cross-Chain Stake (Action 1)", async () => {
        await daiToken.mint(remoteUser.address, dai("1000"));
        await daiToken.connect(remoteUser).approve(gateway.address, dai("1000"));

        const daiAmount = dai("1000");
        const expectedUsdt = usdt("1000"); // 1:1 swap
        const action = 1; // 1 = STAKE
        const payload = ethers.utils.defaultAbiCoder.encode(
            ["address", "uint256", "uint8"],
            [remoteUser.address, 0, action]
        );

        // Simulate the call
        await gateway.connect(remoteUser).callBridge(
            bridge.address, "Polygon", "remote-addr", payload, "aUSDC", daiAmount
        );

        // Check final state (Aave pool)
        expect(await aUsdtToken.balanceOf(stakingPool.address)).to.equal(expectedUsdt);
        expect(await stakingPool.stakerPrincipal(remoteUser.address)).to.equal(expectedUsdt);
    });
});
