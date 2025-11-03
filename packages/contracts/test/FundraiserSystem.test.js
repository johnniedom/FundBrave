const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const usdt = (val) => ethers.utils.parseUnits(val, 6);
const dai = (val) => ethers.utils.parseEther(val);

describe("Fundraiser System Integration Test", () => {
    // --- Fixture to deploy the entire system ---
    async function deploySystemFixture() {
        const [
            owner,
            creator,
            donor,
            staker,
            beneficiary,
            platformWallet,
            remoteUser,
        ] = await ethers.getSigners();

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

        // --- 3. Deploy Core Contracts ---
        const FundraiserFactory = await ethers.getContractFactory("FundraiserFactory");
        const factory = await FundraiserFactory.deploy(
            gateway.address,
            ethers.constants.AddressZero,
            router.address,
            usdtToken.address,
            platformWallet.address,
            ethers.constants.AddressZero,
            aavePool.address,
            aUsdtToken.address
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
        // Fund Router with USDT to provide for swaps
        await usdtToken.mint(router.address, usdt("1000000"));
        // Fund Aave Pool with USDT so it can "withdraw"
        await usdtToken.mint(aavePool.address, usdt("1000000"));
        // Fund Aave Pool with aUSDT so it can "supply"
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
        const stakingPool = await ethers.getContractAt("StakingPool", poolAddr);

        return { fundraiser, stakingPool };
    }

    describe("Fundraiser & StakingPool Creation", () => {
        it("should deploy both contracts and set correct owners", async () => {
            const { factory, creator, beneficiary } = await loadFixture(deploySystemFixture);
            const { fundraiser, stakingPool } = await createFundraiser(factory, creator, beneficiary);

            expect(await fundraiser.owner()).to.equal(creator.address);
            expect(await stakingPool.owner()).to.equal(creator.address);
            
            expect(await fundraiser.beneficiary()).to.equal(beneficiary.address);
            expect(await stakingPool.beneficiary()).to.equal(beneficiary.address);

            expect(await factory.stakingPools(0)).to.equal(stakingPool.address);
        });
    });

    describe("Local Zappers (Donations & Staking)", () => {
        let fundraiser, stakingPool, factory, usdtToken, daiToken, donor, staker;

        beforeEach(async () => {
            ({ factory, usdtToken, daiToken, donor, staker, ...rest } = await loadFixture(deploySystemFixture));
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

            // StakingPool should have 0 USDT 
            expect(await usdtToken.balanceOf(stakingPool.address)).to.equal(0);
            // StakingPool should have aUSDT
            expect(await stakingPool.aUSDT().balanceOf(stakingPool.address)).to.equal(expectedUsdt);
            // Accounting should be updated
            expect(await stakingPool.stakerPrincipal(staker.address)).to.equal(expectedUsdt);
            expect(await stakingPool.totalStakedPrincipal()).to.equal(expectedUsdt);
        });

        it("should handle a local ERC20 (DAI) Stake", async () => {
            const daiAmount = dai("500");
            const expectedUsdt = usdt("500");

            await daiToken.connect(staker).approve(factory.address, daiAmount);
            await factory.connect(staker).stakeERC20(0, daiToken.address, daiAmount);
            
            expect(await usdtToken.balanceOf(stakingPool.address)).to.equal(0);
            expect(await stakingPool.aUSDT().balanceOf(stakingPool.address)).to.equal(expectedUsdt);
            expect(await stakingPool.stakerPrincipal(staker.address)).to.equal(expectedUsdt);
        });
    });

    describe("Cross-Chain Bridge (Donation & Staking)", () => {
        let fundraiser, stakingPool, bridge, gateway, daiToken, usdtToken, remoteUser, factory;

        beforeEach(async () => {
            ({ bridge, gateway, daiToken, usdtToken, remoteUser, factory, ...rest } = await loadFixture(deploySystemFixture));
            ({ fundraiser, stakingPool } = await createFundraiser(factory, rest.creator, rest.beneficiary));

            // Fund remote user with DAI
            await daiToken.mint(remoteUser.address, dai("5000"));
            await daiToken.connect(remoteUser).approve(gateway.address, dai("5000"));
            
            // We use the string address for the factory
            await bridge.addSupportedChain("Polygon", factory.address.toString().toLowerCase());
            await bridge.addSupportedToken("Polygon", "aUSDC");
        });

        it("should handle a Cross-Chain Donation", async () => {
            const daiAmount = dai("1000");
            const expectedUsdt = usdt("1000");
            const action = 0;
            const payload = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256", "uint8"],
                [remoteUser.address, 0, action] // donor, fundraiserId, action
            );

            // Simulate the call from the remote chain
            await gateway.connect(remoteUser).callBridge(
                bridge.address,
                "Polygon",
                remoteUser.address.toString().toLowerCase(),
                payload,
                "aUSDC",
                daiAmount
            );

            // Check final state
            expect(await usdtToken.balanceOf(fundraiser.address)).to.equal(expectedUsdt);
            expect(await fundraiser.totalDonations()).to.equal(expectedUsdt);
            const [donors] = await fundraiser.allDonations();
            expect(donors[0]).to.equal(remoteUser.address);
        });

        it("should handle a Cross-Chain Stake", async () => {
            const daiAmount = dai("1000");
            const expectedUsdt = usdt("1000"); 
            const action = 1;
            const payload = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256", "uint8"],
                [remoteUser.address, 0, action] // donor, fundraiserId, action
            );

            // Simulate the call
            await gateway.connect(remoteUser).callBridge(
                bridge.address,
                "Polygon",
                remoteUser.address.toString().toLowerCase(),
                payload,
                "aUSDC",
                daiAmount
            );

            // Check final state
            expect(await stakingPool.aUSDT().balanceOf(stakingPool.address)).to.equal(expectedUsdt);
            expect(await stakingPool.stakerPrincipal(remoteUser.address)).to.equal(expectedUsdt);
        });
    });

    describe("StakingPool: Yield Harvest & Distribution", () => {
        it("should correctly harvest and distribute yield", async () => {
            const { factory, staker, aUsdtToken, usdtToken, beneficiary, platformWallet } = await loadFixture(deploySystemFixture);
            const { stakingPool } = await createFundraiser(factory, staker, beneficiary);

            // 1. Staker stakes 10,000 USDT
            const stakeAmount = usdt("10000");
            await usdtToken.mint(staker.address, stakeAmount);
            await usdtToken.connect(staker).approve(factory.address, stakeAmount);
            await factory.connect(staker).stakeERC20(0, usdtToken.address, stakeAmount);

            expect(await stakingPool.totalStakedPrincipal()).to.equal(stakeAmount);
            expect(await aUsdtToken.balanceOf(stakingPool.address)).to.equal(stakeAmount);

            // 2. Simulate 1,000 USDT of yield by minting aUSDT to the pool
            const yieldAmount = usdt("1000");
            await aUsdtToken.mint(stakingPool.address, yieldAmount);

            // 3. Harvest
            await stakingPool.connect(staker).harvestAndDistribute();

            // 4. Check distribution
            // 79% to beneficiary
            const beneficiaryShare = usdt("790"); // 79% of 1000
            expect(await usdtToken.balanceOf(beneficiary.address)).to.equal(beneficiaryShare);

            // 2% to platform
            const platformShare = usdt("20"); // 2% of 1000
            expect(await usdtToken.balanceOf(platformWallet.address)).to.equal(platformShare);

            // 19% to staker rewards pool (remains in contract for claiming)
            const stakerPoolShare = usdt("190"); // 19% of 1000
            expect(await stakingPool.totalStakerRewardsAccrued()).to.equal(stakerPoolShare);
            expect(await usdtToken.balanceOf(stakingPool.address)).to.equal(stakerPoolShare);

            // 5. Staker claims rewards
            const stakerBalanceBefore = await usdtToken.balanceOf(staker.address);
            await stakingPool.connect(staker).claimStakerRewards();
            const stakerBalanceAfter = await usdtToken.balanceOf(staker.address);

            expect(stakerBalanceAfter.sub(stakerBalanceBefore)).to.equal(stakerPoolShare);
            expect(await usdtToken.balanceOf(stakingPool.address)).to.equal(0);
        });
    });
});