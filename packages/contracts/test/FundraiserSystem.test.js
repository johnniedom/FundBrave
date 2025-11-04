const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const usdt = (val) => ethers.utils.parseUnits(val, 6);
const dai = (val) => ethers.utils.parseEther(val);

describe("Fundraiser System Integration Test", () => {
    async function deployAaveSystemFixture() {
        const [
            owner, 
            creator,
            donor,
            staker,
            staker2,
            beneficiary,
            platformWallet,
            remoteUser,
        ] = await ethers.getSigners();

        // --- 2. Deploy Mocks ---
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        const MockWETH = await ethers.getContractFactory("MockWETH");
        const MockUniswapRouter = await ethers.getContractFactory("MockUniswapRouter");
        const MockAavePool = await ethers.getContractFactory("MockAavePool");
        const MockAxelarGateway = await ethers.getContractFactory("MockAxelarGateway");

        // Deploy Tokens
        const usdtToken = await MockERC20.deploy("Tether", "USDT", 6);
        const daiToken = await MockERC20.deploy("Dai", "DAI", 18);
        const wethToken = await MockWETH.deploy();
        const aUsdtToken = await MockERC20.deploy("Aave USDT", "aUSDT", 6);

        // Deploy DeFi Mocks
        const router = await MockUniswapRouter.deploy(wethToken.address, usdtToken.address);
        const aavePool = await MockAavePool.deploy(usdtToken.address, aUsdtToken.address);

        // Deploy Axelar Mocks
        const gateway = await MockAxelarGateway.deploy();
        await gateway.registerToken("aUSDC", daiToken.address);
        await gateway.registerToken("USDT", usdtToken.address);


        // --- 3. Deploy Core Contracts ---
        
        // 3a. Deploy Factory (as an Aave-chain, type 0)
        const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");
        const factory = await FundraiserFactory.deploy(
            gateway.address,
            ethers.constants.AddressZero, // _axelarGasService
            router.address,
            usdtToken.address,
            platformWallet.address,
            ethers.constants.AddressZero, // _fundBraveBridge (placeholder)
            aavePool.address,             // _aavePool
            aUsdtToken.address,           // _aUsdt
            ethers.constants.AddressZero, // _morphoVault
            0                             // _stakingPoolType (0 = Aave)
        );

        // 3b. Deploy Bridge, linking to the Factory
        const FundBraveBridge = await ethers.getContractFactory("FundBraveBridge");
        const bridge = await FundBraveBridge.deploy(
            gateway.address,
            ethers.constants.AddressZero,
            router.address,
            usdtToken.address,
            factory.address
        );

        // 3c. Update Factory with the real Bridge address
        await factory.connect(owner).updateBridge(bridge.address);

        // --- 4. Fund Mocks ---
        await usdtToken.mint(router.address, usdt("1000000"));
        await usdtToken.mint(aavePool.address, usdt("1000000"));
        await aUsdtToken.mint(aavePool.address, usdt("1000000"));

        return {
            factory,
            bridge,
            gateway,
            usdtToken,
            daiToken,
            aavePool,
            aUsdtToken,
            owner,
            creator,
            donor,
            staker,
            staker2,
            beneficiary,
            platformWallet,
            remoteUser,
        };
    }

    // --- Helper function to create a fundraiser ---
    async function createFundraiser(factory, creator, beneficiary) {
        const tx = await factory.connect(creator).createFundraiser(
            "Test Fundraiser",
            ["img.png"],
            ["Education"],
            "Desc",
            "Global",
            beneficiary.address,
            usdt("10000"),
            30
        );
        const receipt = await tx.wait();
        
        // Get both created contracts
        const fundraiserAddr = receipt.events.find(e => e.event === "FundraiserCreated").args.fundraiser;
        const poolAddr = receipt.events.find(e => e.event === "StakingPoolCreated").args.poolAddress;

        const fundraiser = await ethers.getContractAt("Fundraiser", fundraiserAddr);
        // Use the Aave StakingPool ABI
        const stakingPool = await ethers.getContractAt("StakingPool", poolAddr);

        return { fundraiser, stakingPool };
    }


    describe("Fundraiser & StakingPool Creation", () => {
        it("should deploy an Aave StakingPool and set correct owners", async () => {
            const { factory, creator, beneficiary } = await loadFixture(deployAaveSystemFixture);
            const { fundraiser, stakingPool } = await createFundraiser(factory, creator, beneficiary);

            expect(await fundraiser.owner()).to.equal(creator.address);
            expect(await stakingPool.owner()).to.equal(creator.address);
            
            expect(await fundraiser.beneficiary()).to.equal(beneficiary.address);
            expect(await stakingPool.beneficiary()).to.equal(beneficiary.address);

            // Check it deployed the Aave pool
            expect(await stakingPool.AAVE_POOL()).to.not.equal(ethers.constants.AddressZero);
            expect(await factory.stakingPools(0)).to.equal(stakingPool.address);
        });
    });

    describe("Local Zappers (Donations & Staking)", () => {
        let fundraiser, stakingPool, factory, usdtToken, daiToken, aUsdtToken, donor, staker;

        beforeEach(async () => {
            ({ factory, usdtToken, daiToken, aUsdtToken, donor, staker, ...rest } = await loadFixture(deployAaveSystemFixture));
            ({ fundraiser, stakingPool } = await createFundraiser(factory, rest.creator, rest.beneficiary));

            // Fund donor/staker
            await daiToken.mint(donor.address, dai("1000"));
            await daiToken.mint(staker.address, dai("1000"));
        });

        it("should handle a local Native (ETH) Donation", async () => {
            const ethAmount = ethers.utils.parseEther("1.0");
            const expectedUsdt = usdt("2000");

            await factory.connect(donor).donateNative(0, { value: ethAmount });

            expect(await usdtToken.balanceOf(fundraiser.address)).to.equal(expectedUsdt);
            expect(await fundraiser.totalDonations()).to.equal(expectedUsdt);
        });

        it("should handle a local ERC20 (DAI) Donation", async () => {
            const daiAmount = dai("500");
            const expectedUsdt = usdt("500");

            await daiToken.connect(donor).approve(factory.address, daiAmount);
            await factory.connect(donor).donateERC20(0, daiToken.address, daiAmount);

            expect(await usdtToken.balanceOf(fundraiser.address)).to.equal(expectedUsdt);
            expect(await fundraiser.totalDonations()).to.equal(expectedUsdt);
        });

        it("should handle a local Native (ETH) Stake", async () => {
            const ethAmount = ethers.utils.parseEther("1.0"); 
            const expectedUsdt = usdt("2000");

            await factory.connect(staker).stakeNative(0, { value: ethAmount });

            expect(await usdtToken.balanceOf(stakingPool.address)).to.equal(0);
            expect(await aUsdtToken.balanceOf(stakingPool.address)).to.equal(expectedUsdt);
            expect(await stakingPool.stakerPrincipal(staker.address)).to.equal(expectedUsdt);
            expect(await stakingPool.totalStakedPrincipal()).to.equal(expectedUsdt);
        });

        it("should handle a local ERC20 (DAI) Stake", async () => {
            const daiAmount = dai("500");
            const expectedUsdt = usdt("500");

            await daiToken.connect(staker).approve(factory.address, daiAmount);
            await factory.connect(staker).stakeERC20(0, daiToken.address, daiAmount);
            
            expect(await usdtToken.balanceOf(stakingPool.address)).to.equal(0);
            expect(await aUsdtToken.balanceOf(stakingPool.address)).to.equal(expectedUsdt);
            expect(await stakingPool.stakerPrincipal(staker.address)).to.equal(expectedUsdt);
        });
    });

    describe("Cross-Chain Bridge (Donation & Staking)", () => {
        let fundraiser, stakingPool, bridge, gateway, daiToken, aUsdtToken, usdtToken, remoteUser, factory;

        beforeEach(async () => {
            ({ bridge, gateway, daiToken, aUsdtToken, usdtToken, remoteUser, factory, ...rest } = await loadFixture(deployAaveSystemFixture));
            ({ fundraiser, stakingPool } = await createFundraiser(factory, rest.creator, rest.beneficiary));

            // Fund remote user with DAI
            await daiToken.mint(remoteUser.address, dai("5000"));
            await daiToken.connect(remoteUser).approve(gateway.address, dai("5000"));
            
            await bridge.addSupportedChain("Polygon", factory.address);
            await bridge.addSupportedToken("Polygon", daiToken.address, "aUSDC");
            await bridge.addSupportedToken("Polygon", usdtToken.address, "USDT");
        });

        it("should handle a Cross-Chain Donation", async () => {
            const daiAmount = dai("1000");
            const expectedUsdt = usdt("1000");
            const action = 0; // 0 = DONATE
            const payload = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint26", "uint8"],
                [remoteUser.address, 0, action]
            );

            await gateway.connect(remoteUser).callBridge(
                bridge.address,
                "Polygon",
                remoteUser.address.toString().toLowerCase(),
                payload,
                "aUSDC",
                daiAmount
            );

            expect(await usdtToken.balanceOf(fundraiser.address)).to.equal(expectedUsdt);
            expect(await fundraiser.totalDonations()).to.equal(expectedUsdt);
            const [donors] = await fundraiser.allDonations();
            expect(donors[0]).to.equal(remoteUser.address);
        });

        it("should handle a Cross-Chain Stake", async () => {
            const daiAmount = dai("1000");
            const expectedUsdt = usdt("1000"); 
            const action = 1; // 1 = STAKE
            const payload = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256", "uint8"],
                [remoteUser.address, 0, action]
            );

            await gateway.connect(remoteUser).callBridge(
                bridge.address,
                "Polygon",
                remoteUser.address.toString().toLowerCase(),
                payload,
                "aUSDC",
                daiAmount
            );

            // **FIXED:** Check the mock aUSDT token balance
            expect(await aUsdtToken.balanceOf(stakingPool.address)).to.equal(expectedUsdt);
            expect(await stakingPool.stakerPrincipal(remoteUser.address)).to.equal(expectedUsdt);
        });
    });

    describe("StakingPool: Yield Harvest & rewardPerToken", () => {
        let factory, staker, staker2, aUsdtToken, usdtToken, beneficiary, platformWallet, stakingPool;

        beforeEach(async () => {
            ({ factory, staker, staker2, aUsdtToken, usdtToken, beneficiary, platformWallet, ...rest } = 
                await loadFixture(deployAaveSystemFixture));
            ({ stakingPool } = await createFundraiser(factory, rest.creator, beneficiary));

            // Fund stakers
            await usdtToken.mint(staker.address, usdt("10000"));
            await usdtToken.mint(staker2.address, usdt("10000"));
            await usdtToken.connect(staker).approve(factory.address, usdt("10000"));
            await usdtToken.connect(staker2).approve(factory.address, usdt("10000"));
        });

        it("should fix the race-condition bug (equal rewards for equal stakers)", async () => {
            // 1. Staker 1 and 2 stake 10,000 USDT each (50/50 split)
            await factory.connect(staker).stakeERC20(0, usdtToken.address, usdt("10000"));
            await factory.connect(staker2).stakeERC20(0, usdtToken.address, usdt("10000"));
            
            // 2. Simulate 2,000 USDT of yield
            await aUsdtToken.mint(stakingPool.address, usdt("2000"));
            
            // 3. Harvest. Staker share is 19% of 2000 = 380
            await stakingPool.harvestAndDistribute();
            
            // 4. Check claimable amounts *before* anyone claims
            expect(await stakingPool.claimableRewards(staker.address)).to.equal(usdt("190"));
            expect(await stakingPool.claimableRewards(staker2.address)).to.equal(usdt("190"));

            // 5. Staker 1 claims
            const staker1BalanceBefore = await usdtToken.balanceOf(staker.address);
            await stakingPool.connect(staker).claimStakerRewards();
            const staker1BalanceAfter = await usdtToken.balanceOf(staker.address);
            expect(staker1BalanceAfter.sub(staker1BalanceBefore)).to.equal(usdt("190"));

            // 6. Staker 2 claims *after* staker 1
            const staker2BalanceBefore = await usdtToken.balanceOf(staker2.address);
            await stakingPool.connect(staker2).claimStakerRewards();
            const staker2BalanceAfter = await usdtToken.balanceOf(staker2.address);
            
            expect(staker2BalanceAfter.sub(staker2BalanceBefore)).to.equal(usdt("190"));
        });

        it("should correctly assign rewards based on stake timing (rewardPerToken)", async () => {
            // 1. Staker 1 stakes 10,000
            await factory.connect(staker).stakeERC20(0, usdtToken.address, usdt("10000"));

            // 2. Harvest 1: Simulate 1,000 yield. Staker share = 190
            // Staker 1 is 100% of the pool, so they get all 190.
            await aUsdtToken.mint(stakingPool.address, usdt("1000"));
            await stakingPool.harvestAndDistribute();

            // 3. Staker 2 stakes 10,000
            await factory.connect(staker2).stakeERC20(0, usdtToken.address, usdt("10000"));

            // 4. Harvest 2: Simulate 1,000 yield. Staker share = 190
            // Pool is now 50/50. Staker 1 gets 95, Staker 2 gets 95.
            await aUsdtToken.mint(stakingPool.address, usdt("1000"));
            await stakingPool.harvestAndDistribute();

            // 5. Check rewards
            // Staker 1: 190 (from H1) + 95 (from H2) = 285
            const staker1Rewards = await stakingPool.claimableRewards(staker.address);
            expect(staker1Rewards).to.equal(usdt("285"));

            // Staker 2: 0 (from H1) + 95 (from H2) = 95
            const staker2Rewards = await stakingPool.claimableRewards(staker2.address);
            expect(staker2Rewards).to.equal(usdt("95"));

            // 6. Staker 1 claims
            const staker1BalanceBefore = await usdtToken.balanceOf(staker.address);
            await stakingPool.connect(staker).claimStakerRewards();
            const staker1BalanceAfter = await usdtToken.balanceOf(staker.address);
            expect(staker1BalanceAfter.sub(staker1BalanceBefore)).to.equal(staker1Rewards);
            
            // 7. Staker 2 claims
            const staker2BalanceBefore = await usdtToken.balanceOf(staker2.address);
            await stakingPool.connect(staker2).claimStakerRewards();
            const staker2BalanceAfter = await usdtToken.balanceOf(staker2.address);
            expect(staker2BalanceAfter.sub(staker2BalanceBefore)).to.equal(staker2Rewards);
        });
    });
});