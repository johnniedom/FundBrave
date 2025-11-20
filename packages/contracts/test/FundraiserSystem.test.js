const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// Utilities
const usdc = (val) => ethers.utils.parseUnits(val, 6);
const dai = (val) => ethers.utils.parseEther(val);
const eth = (val) => ethers.utils.parseEther(val);

// Dummy WorldID Params
const NULL_ROOT = 0;
const NULL_HASH = 123456;
const NULL_PROOF = [0,0,0,0,0,0,0,0];

// --- Fixture: Deploys the Full Stack with Mocks ---
async function deploySystemFixture() {
    const [owner, creator, donor, staker, beneficiary, platformWallet, remoteUser] = await ethers.getSigners();

    // 1. Deploy Token Mocks
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdcToken = await MockERC20.deploy("USD Coin", "USDC", 6);
    const daiToken = await MockERC20.deploy("Dai", "DAI", 18);
    
    const MockWETH = await ethers.getContractFactory("MockWETH");
    const wethToken = await MockWETH.deploy();

    // 2. Deploy DeFi Mocks (Aave & Router)
    // Note: We reuse MockUniswapRouter for 1inch logic for simplicity in tests, 
    // assuming OneInchAdapter is loosely compatible or we deploy a specific mock.
    const MockUniswapRouter = await ethers.getContractFactory("MockUniswapRouter");
    // In this mock, we assume the router can handle WETH/USDC pair
    const oneInchRouterMock = await MockUniswapRouter.deploy(wethToken.address, usdcToken.address);
    
    const MockAavePool = await ethers.getContractFactory("MockAavePool");
    const aUsdcToken = await MockERC20.deploy("Aave USDC", "aUSDC", 6);
    const aavePool = await MockAavePool.deploy(usdcToken.address, aUsdcToken.address);

    // 3. Deploy Infra Mocks (WorldID & LayerZero)
    const MockWorldID = await ethers.getContractFactory("MockWorldID");
    const worldId = await MockWorldID.deploy();

    const MockLZEndpoint = await ethers.getContractFactory("MockLZEndpoint");
    const lzEndpoint = await MockLZEndpoint.deploy(1); // EID 1

    // 4. Deploy Adapters (1inch)
    const OneInchAdapter = await ethers.getContractFactory("OneInchAdapter");
    const swapAdapter = await OneInchAdapter.deploy(
        oneInchRouterMock.address, 
        usdcToken.address, 
        wethToken.address, 
        owner.address
    );

    // 5. Deploy Factory (Type 0 = Aave)
    const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");
    const factory = await FundraiserFactory.deploy(
        swapAdapter.address,
        usdcToken.address,
        wethToken.address,
        platformWallet.address,
        aavePool.address,
        aUsdcToken.address,
        ethers.constants.AddressZero,
        0,
        worldId.address,
        "app_id", 
        "action_id"
    );

    // 6. Deploy Bridge (LayerZero V2)
    const FundBraveBridge = await ethers.getContractFactory("FundBraveBridge");
    const bridge = await FundBraveBridge.deploy(
        lzEndpoint.address,
        swapAdapter.address,
        usdcToken.address,
        factory.address,
        owner.address
    );

    // 7. Setup Permissions & Linking
    await factory.connect(owner).updateBridge(bridge.address);
    
    // Fund Mocks
    await usdcToken.mint(oneInchRouterMock.address, usdc("1000000"));
    await usdcToken.mint(aavePool.address, usdc("1000000"));
    await aUsdcToken.mint(aavePool.address, usdc("1000000"));

    return { 
        factory, bridge, lzEndpoint, swapAdapter, 
        usdcToken, wethToken, aavePool, aUsdcToken, worldId,
        owner, creator, donor, staker, beneficiary, platformWallet, remoteUser 
    };
}

// Helper to create fundraiser with WorldID params
async function createFundraiser(factory, creator, beneficiary) {
    const tx = await factory.connect(creator).createFundraiser(
        "Save the Forests", 
        ["image.png"], 
        ["Environment"], 
        "Description", 
        "Brazil",
        beneficiary.address, 
        usdc("10000"), 
        30,
        NULL_ROOT,
        NULL_HASH,
        NULL_PROOF
    );
    const receipt = await tx.wait();
    const fundraiserAddr = receipt.events.find(e => e.event === "FundraiserCreated").args.fundraiser;
    const poolAddr = receipt.events.find(e => e.event === "StakingPoolCreated").args.poolAddress;
    
    return { 
        fundraiser: await ethers.getContractAt("Fundraiser", fundraiserAddr), 
        stakingPool: await ethers.getContractAt("StakingPool", poolAddr)
    };
}

describe("FundBrave System Tests", () => {
    let factory, bridge, lzEndpoint, swapAdapter;
    let usdcToken, aavePool, aUsdcToken;
    let owner, creator, donor, staker, beneficiary, remoteUser;
    let fundraiser, stakingPool;

    beforeEach(async () => {
        const fixture = await loadFixture(deploySystemFixture);
        factory = fixture.factory;
        bridge = fixture.bridge;
        lzEndpoint = fixture.lzEndpoint;
        usdcToken = fixture.usdcToken;
        aavePool = fixture.aavePool;
        aUsdcToken = fixture.aUsdcToken;
        owner = fixture.owner;
        creator = fixture.creator;
        donor = fixture.donor;
        staker = fixture.staker;
        beneficiary = fixture.beneficiary;
        remoteUser = fixture.remoteUser;

        const res = await createFundraiser(factory, creator, beneficiary);
        fundraiser = res.fundraiser;
        stakingPool = res.stakingPool;
    });

    // --- 1. World ID & Factory Tests ---
    describe("Factory & World ID", () => {
        it("should verify World ID parameters on creation", async () => {
            // If we try to use the SAME nullifier, it should fail (Double-Signaling)
            await expect(
                factory.connect(creator).createFundraiser(
                    "Spam Fundraiser", ["img.png"], ["Environment"], "Desc", "Brazil",
                    beneficiary.address, usdc("10000"), 30,
                    NULL_ROOT,
                    NULL_HASH, // Reusing hash used in beforeEach
                    NULL_PROOF
                )
            ).to.be.revertedWith("WorldID: Already used");
        });

        it("should deploy a valid Staking Pool with Aave config", async () => {
            expect(await stakingPool.AAVE_POOL()).to.equal(aavePool.address);
            expect(await stakingPool.USDC()).to.equal(usdcToken.address);
        });
    });

    // --- 2. Staking & Yield Tests ---
    describe("Staking & Yield (Chainlink Automation)", () => {
        it("should allow users to stake USDC directly", async () => {
            await usdcToken.mint(staker.address, usdc("500"));
            await usdcToken.connect(staker).approve(factory.address, usdc("500"));

            // Stake via Factory
            await factory.connect(staker).stakeERC20(0, usdcToken.address, usdc("500"));

            expect(await stakingPool.stakerPrincipal(staker.address)).to.equal(usdc("500"));
            // Funds should be in Aave (mocked as 1:1 transfer to AavePool)
            expect(await usdcToken.balanceOf(aavePool.address)).to.equal(usdc("1000500")); // 1M + 500
        });

        it("should harvest yield correctly", async () => {
            // 1. User stakes 1000
            await usdcToken.mint(staker.address, usdc("1000"));
            await usdcToken.connect(staker).approve(factory.address, usdc("1000"));
            await factory.connect(staker).stakeERC20(0, usdcToken.address, usdc("1000"));

            // 2. Simulate Yield: Mint aUSDC to the StakingPool
            // Aave rebase simulation: The pool holds 1000 aUSDC. We give it 100 more.
            await aUsdcToken.mint(stakingPool.address, usdc("100"));

            // 3. Check Chainlink Upkeep
            const [upkeepNeeded] = await stakingPool.checkUpkeep("0x");
            // Should be FALSE because not enough time passed (1 day interval)
            expect(upkeepNeeded).to.be.false;

            // 4. Fast forward time
            await ethers.provider.send("evm_increaseTime", [86401]); // +1 day + 1 sec
            await ethers.provider.send("evm_mine");

            const [upkeepNeededNow] = await stakingPool.checkUpkeep("0x");
            expect(upkeepNeededNow).to.be.true;

            // 5. Perform Harvest
            await stakingPool.performUpkeep("0x");

            // 6. Check Distribution (79% Fundraiser / 19% Staker / 2% Platform)
            // Yield = 100 USDC
            // Staker Share = 19 USDC
            // Fundraiser Share = 79 USDC
            const stakerRewards = await stakingPool.claimableRewards(staker.address);
            expect(stakerRewards).to.equal(usdc("19"));
            
            const fundraiserBalance = await usdcToken.balanceOf(beneficiary.address);
            expect(fundraiserBalance).to.equal(usdc("79"));
        });
    });

    // --- 3. LayerZero V2 Bridge Tests ---
    describe("Cross-Chain Bridge (LayerZero V2)", () => {
        it("should send a cross-chain 'Stake' message", async () => {
            // 1. Setup: Remote user wants to stake 100 DAI (which is swapped to USDC)
            // Since we are mocking, we'll just use USDC directly to test the message flow
            await usdcToken.mint(remoteUser.address, usdc("100"));
            await usdcToken.connect(remoteUser).approve(bridge.address, usdc("100"));

            // 2. Send Action
            const dstEid = 2; // Destination Chain ID
            const action = 1; // Stake
            
            // We need to pay gas. In Mock, quote returns 0, but we send some ETH anyway.
            await expect(bridge.connect(remoteUser).sendCrossChainAction(
                dstEid,
                0, // Fundraiser ID
                action,
                usdcToken.address,
                usdc("100"),
                { value: eth("0.1") }
            )).to.emit(bridge, "CrossChainActionSent");
        });

        it("should receive a cross-chain message and execution action", async () => {
            // This test simulates the DESTINATION chain receiving a message
            
            // 1. Fund the Bridge with liquidity (simulating funds arriving or being unlocked)
            await usdcToken.mint(bridge.address, usdc("1000"));
            
            // 2. Construct Payload: [Donor, FundraiserId, Action, Amount]
            // Action 0 = Donate
            const amount = usdc("50");
            const payload = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256", "uint8", "uint256"],
                [remoteUser.address, 0, 0, amount]
            );

            // 3. Simulate LayerZero Endpoint calling lzReceive on our Bridge
            // We call `mockReceive` on the endpoint, which calls `lzReceive` on the bridge
            await lzEndpoint.mockReceive(
                bridge.address,
                1, // Source EID
                ethers.utils.formatBytes32String("guid"),
                payload
            );

            // 4. Verify Effect: Fundraiser should have received the donation
            const fundraiserBalance = await usdcToken.balanceOf(fundraiser.address);
            expect(fundraiserBalance).to.equal(amount);
            
            const donations = await fundraiser.totalDonations();
            expect(donations).to.equal(amount);
        });
    });
});