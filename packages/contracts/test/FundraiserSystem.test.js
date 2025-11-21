const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// --- Ethers v6 Compatibility Helpers ---
// v6 moves utils to the top level (ethers.parseUnits) and removes ethers.constants
const usdc = (val) => ethers.parseUnits(val, 6);
const dai = (val) => ethers.parseEther(val);
const eth = (val) => ethers.parseEther(val);
const ZERO_ADDRESS = ethers.ZeroAddress; 

// Dummy WorldID Params
const NULL_ROOT = 0;
const NULL_HASH = 123456;
const NULL_PROOF = [0,0,0,0,0,0,0,0];

async function deploySystemFixture() {
    const [owner, creator, donor, staker, beneficiary, platformWallet, remoteUser] = await ethers.getSigners();

    // 1. Deploy Token Mocks (Using Fully Qualified Names to avoid HH701 ambiguity)
    // We point specifically to DeFiMocks.sol
    const MockERC20 = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockERC20");
    const usdcToken = await MockERC20.deploy("USD Coin", "USDC", 6);
    const daiToken = await MockERC20.deploy("Dai", "DAI", 18);
    
    const MockWETH = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockWETH");
    const wethToken = await MockWETH.deploy();

    // 2. Deploy DeFi Mocks (Aave & Router)
    const MockUniswapRouter = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockUniswapRouter");
    const oneInchRouterMock = await MockUniswapRouter.deploy(await wethToken.getAddress(), await usdcToken.getAddress());
    
    // FIX: Use fully qualified name for MockAavePool
    const MockAavePool = await ethers.getContractFactory("contracts/test/DeFiMocks.sol:MockAavePool");
    const aUsdcToken = await MockERC20.deploy("Aave USDC", "aUSDC", 6);
    const aavePool = await MockAavePool.deploy(await usdcToken.getAddress(), await aUsdcToken.getAddress());

    // 3. Deploy Infra Mocks (WorldID & LayerZero)
    const MockWorldID = await ethers.getContractFactory("MockWorldID");
    const worldId = await MockWorldID.deploy();

    const MockLZEndpoint = await ethers.getContractFactory("MockLZEndpoint");
    const lzEndpoint = await MockLZEndpoint.deploy(1); 

    // 4. Deploy Adapters
    const OneInchAdapter = await ethers.getContractFactory("OneInchAdapter");
    const swapAdapter = await OneInchAdapter.deploy(
        await oneInchRouterMock.getAddress(), 
        await usdcToken.getAddress(), 
        await wethToken.getAddress(), 
        owner.address
    );

    // 5. Deploy Implementations (REQUIRED for Clones)
    const Fundraiser = await ethers.getContractFactory("Fundraiser");
    const fundraiserImpl = await Fundraiser.deploy(); // Constructor is now empty/locked

    const StakingPool = await ethers.getContractFactory("StakingPool");
    const stakingPoolImpl = await StakingPool.deploy(); // Constructor is now empty/locked

    // 6. Deploy Factory
    const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");
    const factory = await FundraiserFactory.deploy(
        await fundraiserImpl.getAddress(),    // _fundraiserImplementation
        await stakingPoolImpl.getAddress(),   // _stakingPoolImplementation
        await swapAdapter.getAddress(),       // _swapAdapter
        await usdcToken.getAddress(),         // _usdc
        await wethToken.getAddress(),         // _weth
        platformWallet.address,               // _platformFeeRecipient
        await aavePool.getAddress(),          // _aavePool
        await aUsdcToken.getAddress(),        // _aUsdc
        ZERO_ADDRESS,                         // _morphoVault (No Morpho in mock)
        0,                                    // _stakingPoolType (0 = Aave)
        await worldId.getAddress(),           // _worldId
        "app_id", 
        "action_id"
    );

    // 7. Deploy Bridge
    const FundBraveBridge = await ethers.getContractFactory("FundBraveBridge");
    const bridge = await FundBraveBridge.deploy(
        await lzEndpoint.getAddress(),
        await swapAdapter.getAddress(),
        await usdcToken.getAddress(),
        await factory.getAddress(),
        owner.address
    );

    // 8. Deploy ReceiptOFT
    const ReceiptOFT = await ethers.getContractFactory("ReceiptOFT");
    const receiptOFT = await ReceiptOFT.deploy("Receipt", "rFUND", await lzEndpoint.getAddress(), owner.address);

    // 9. Setup Permissions & Linking
    await factory.connect(owner).updateBridge(await bridge.getAddress());
    await factory.connect(owner).setReceiptOFT(await receiptOFT.getAddress());
    
    // Grant Mint/Burn role to Factory/Pools (for ReceiptOFT) is handled via setController in logic
    // For now we assume owner or factory handles it if logic requires
    
    // Fund Mocks
    await usdcToken.mint(await oneInchRouterMock.getAddress(), usdc("1000000"));
    await usdcToken.mint(await aavePool.getAddress(), usdc("1000000"));
    await aUsdcToken.mint(await aavePool.getAddress(), usdc("1000000"));

    return { 
        factory, bridge, lzEndpoint, swapAdapter, 
        usdcToken, wethToken, aavePool, aUsdcToken, worldId, receiptOFT,
        owner, creator, donor, staker, beneficiary, platformWallet, remoteUser 
    };
}

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

    // Ethers v6 Event Parsing
    // We filter the logs to find the specific events
    const createdFilter = factory.filters.FundraiserCreated();
    const createdEvents = await factory.queryFilter(createdFilter, receipt.blockHash);
    const fundraiserAddr = createdEvents[0].args[0]; // args[0] is address fundraiser

    const poolFilter = factory.filters.StakingPoolCreated();
    const poolEvents = await factory.queryFilter(poolFilter, receipt.blockHash);
    const poolAddr = poolEvents[0].args[1]; // args[1] is poolAddress

    return { 
        fundraiser: await ethers.getContractAt("Fundraiser", fundraiserAddr), 
        stakingPool: await ethers.getContractAt("StakingPool", poolAddr)
    };
}

describe("FundBrave System Tests", () => {
    let factory, bridge, lzEndpoint;
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

    describe("Factory & World ID", () => {
        it("should verify World ID parameters on creation", async () => {
            await expect(
                factory.connect(creator).createFundraiser(
                    "Spam Fundraiser", ["img.png"], ["Environment"], "Desc", "Brazil",
                    beneficiary.address, usdc("10000"), 30,
                    NULL_ROOT,
                    NULL_HASH, // Reusing hash used in beforeEach should fail
                    NULL_PROOF
                )
            ).to.be.revertedWith("WorldID: Already used");
        });

        it("should deploy a valid Staking Pool with Aave config", async () => {
            expect(await stakingPool.AAVE_POOL()).to.equal(await aavePool.getAddress());
            expect(await stakingPool.USDC()).to.equal(await usdcToken.getAddress());
        });
    });

    describe("Staking & Yield (Chainlink Automation)", () => {
        it("should allow users to stake USDC directly", async () => {
            await usdcToken.mint(staker.address, usdc("500"));
            await usdcToken.connect(staker).approve(await factory.getAddress(), usdc("500"));

            await factory.connect(staker).stakeERC20(0, await usdcToken.getAddress(), usdc("500"));

            expect(await stakingPool.stakerPrincipal(staker.address)).to.equal(usdc("500"));
            expect(await usdcToken.balanceOf(await aavePool.getAddress())).to.equal(usdc("1000500")); 
        });

        it("should harvest yield correctly", async () => {
            await usdcToken.mint(staker.address, usdc("1000"));
            await usdcToken.connect(staker).approve(await factory.getAddress(), usdc("1000"));
            await factory.connect(staker).stakeERC20(0, await usdcToken.getAddress(), usdc("1000"));

            // Simulate Yield
            await aUsdcToken.mint(await stakingPool.getAddress(), usdc("100"));

            const [upkeepNeeded] = await stakingPool.checkUpkeep("0x");
            expect(upkeepNeeded).to.be.false;

            await ethers.provider.send("evm_increaseTime", [86401]);
            await ethers.provider.send("evm_mine");

            const [upkeepNeededNow] = await stakingPool.checkUpkeep("0x");
            expect(upkeepNeededNow).to.be.true;

            await stakingPool.performUpkeep("0x");

            const stakerRewards = await stakingPool.claimableRewards(staker.address);
            expect(stakerRewards).to.equal(usdc("19")); // 19%
            
            const fundraiserBalance = await usdcToken.balanceOf(beneficiary.address);
            expect(fundraiserBalance).to.equal(usdc("79")); // 79%
        });
    });

    describe("Cross-Chain Bridge (LayerZero V2)", () => {
        it("should send a cross-chain 'Stake' message", async () => {
            await usdcToken.mint(remoteUser.address, usdc("100"));
            await usdcToken.connect(remoteUser).approve(await bridge.getAddress(), usdc("100"));

            const dstEid = 2;
            const action = 1; 
            
            await expect(bridge.connect(remoteUser).sendCrossChainAction(
                dstEid,
                0, 
                action,
                await usdcToken.getAddress(),
                usdc("100"),
                { value: eth("0.1") }
            )).to.emit(bridge, "CrossChainActionSent");
        });

        it("should receive a cross-chain message and execute action", async () => {
            await usdcToken.mint(await bridge.getAddress(), usdc("1000"));
            
            const amount = usdc("50");
            // Ethers v6 ABI Coder
            const payload = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "uint256", "uint8", "uint256"],
                [remoteUser.address, 0, 0, amount]
            );

            await lzEndpoint.mockReceive(
                await bridge.getAddress(),
                1, 
                ethers.encodeBytes32String("guid"),
                payload
            );

            const fundraiserBalance = await usdcToken.balanceOf(await fundraiser.getAddress());
            expect(fundraiserBalance).to.equal(amount);
            
            const donations = await fundraiser.totalDonations();
            expect(donations).to.equal(amount);
        });
    });
});