const { expect } = require("chai");
import { ethers } from "hardhat";
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("FundBraveBridge - Pause Mechanism", function () {
  async function deployFixture() {
    const [owner, user1, user2, factory] = await ethers.getSigners();

    // Deploy mock tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20.deploy("USDC", "USDC", 6);
    const weth = await MockERC20.deploy("WETH", "WETH", 18);

    // Deploy mock LayerZero endpoint
    const MockLZEndpoint = await ethers.getContractFactory("MockLZEndpoint");
    const endpoint = await MockLZEndpoint.deploy();

    // Deploy mock swap adapter
    const MockSwapAdapter = await ethers.getContractFactory("MockSwapAdapter");
    const swapAdapter = await MockSwapAdapter.deploy(await usdc.getAddress());

    // Deploy FundBraveBridge
    const FundBraveBridge = await ethers.getContractFactory("FundBraveBridge");
    const bridge = await FundBraveBridge.deploy(
      await endpoint.getAddress(),
      await swapAdapter.getAddress(),
      await usdc.getAddress(),
      factory.address,
      owner.address
    );

    await bridge.waitForDeployment();

    return { bridge, usdc, weth, endpoint, swapAdapter, owner, user1, user2, factory };
  }

  describe("Pause/Unpause Functions", function () {
    it("should allow owner to pause the bridge", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      await expect(bridge.connect(owner).pause())
        .to.not.be.reverted;

      expect(await bridge.paused()).to.be.true;
    });

    it("should allow owner to unpause the bridge", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      // Pause first
      await bridge.connect(owner).pause();
      expect(await bridge.paused()).to.be.true;

      // Unpause
      await expect(bridge.connect(owner).unpause())
        .to.not.be.reverted;

      expect(await bridge.paused()).to.be.false;
    });

    it("should revert when non-owner tries to pause", async function () {
      const { bridge, user1 } = await loadFixture(deployFixture);

      await expect(bridge.connect(user1).pause())
        .to.be.revertedWithCustomError(bridge, "OwnableUnauthorizedAccount");
    });

    it("should revert when non-owner tries to unpause", async function () {
      const { bridge, owner, user1 } = await loadFixture(deployFixture);

      // Owner pauses
      await bridge.connect(owner).pause();

      // Non-owner tries to unpause
      await expect(bridge.connect(user1).unpause())
        .to.be.revertedWithCustomError(bridge, "OwnableUnauthorizedAccount");
    });

    it("should emit Paused event when pausing", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      await expect(bridge.connect(owner).pause())
        .to.emit(bridge, "Paused")
        .withArgs(owner.address);
    });

    it("should emit Unpaused event when unpausing", async function () {
      const { bridge, owner } = await loadFixture(deployFixture);

      await bridge.connect(owner).pause();

      await expect(bridge.connect(owner).unpause())
        .to.emit(bridge, "Unpaused")
        .withArgs(owner.address);
    });
  });

  describe("sendCrossChainAction When Paused", function () {
    it("should block sendCrossChainAction when paused", async function () {
      const { bridge, usdc, owner, user1 } = await loadFixture(deployFixture);

      // Pause the bridge
      await bridge.connect(owner).pause();

      // Mint USDC to user1
      await usdc.mint(user1.address, ethers.parseUnits("100", 6));
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("100", 6));

      // Try to send cross-chain action
      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101, // destination chain
          1, // fundraiser ID
          0, // donate action
          await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(bridge, "EnforcedPause");
    });

    it("should allow sendCrossChainAction when not paused", async function () {
      const { bridge, usdc, user1, endpoint } = await loadFixture(deployFixture);

      // Mint USDC to user1
      await usdc.mint(user1.address, ethers.parseUnits("100", 6));
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("100", 6));

      // Configure endpoint to accept message
      await endpoint.setAcceptMessage(true);

      // Should not revert when not paused
      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101,
          1,
          0,
          await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.not.be.reverted;
    });

    it("should resume sendCrossChainAction after unpause", async function () {
      const { bridge, usdc, owner, user1, endpoint } = await loadFixture(deployFixture);

      // Pause
      await bridge.connect(owner).pause();

      // Mint USDC
      await usdc.mint(user1.address, ethers.parseUnits("100", 6));
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("100", 6));

      // Verify blocked
      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101, 1, 0,
          await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(bridge, "EnforcedPause");

      // Unpause
      await bridge.connect(owner).unpause();

      // Configure endpoint
      await endpoint.setAcceptMessage(true);

      // Should work now
      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101, 1, 0,
          await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.not.be.reverted;
    });
  });

  describe("_lzReceive When Paused", function () {
    it("should block _lzReceive when paused", async function () {
      const { bridge, usdc, owner, endpoint, factory } = await loadFixture(deployFixture);

      // Fund the bridge with USDC for liquidity
      await usdc.mint(await bridge.getAddress(), ethers.parseUnits("1000", 6));

      // Pause the bridge
      await bridge.connect(owner).pause();

      // Prepare LayerZero message payload
      const donor = owner.address;
      const fundraiserId = 1;
      const action = 0; // donate
      const amount = ethers.parseUnits("50", 6);

      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint8", "uint256"],
        [donor, fundraiserId, action, amount]
      );

      // Try to receive message (simulating LayerZero delivery)
      // This would normally be called by the endpoint
      await expect(
        endpoint.deliverMessage(
          await bridge.getAddress(),
          30101, // source chain
          payload
        )
      ).to.be.revertedWithCustomError(bridge, "EnforcedPause");
    });

    it("should process _lzReceive when not paused", async function () {
      const { bridge, usdc, endpoint, factory } = await loadFixture(deployFixture);

      // Fund the bridge
      await usdc.mint(await bridge.getAddress(), ethers.parseUnits("1000", 6));

      const donor = factory.address;
      const fundraiserId = 1;
      const action = 0;
      const amount = ethers.parseUnits("50", 6);

      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint8", "uint256"],
        [donor, fundraiserId, action, amount]
      );

      // Should process when not paused
      await expect(
        endpoint.deliverMessage(
          await bridge.getAddress(),
          30101,
          payload
        )
      ).to.not.be.reverted;
    });

    it("should resume _lzReceive after unpause", async function () {
      const { bridge, usdc, owner, endpoint } = await loadFixture(deployFixture);

      // Fund bridge
      await usdc.mint(await bridge.getAddress(), ethers.parseUnits("1000", 6));

      const payload = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint8", "uint256"],
        [owner.address, 1, 0, ethers.parseUnits("50", 6)]
      );

      // Pause
      await bridge.connect(owner).pause();

      // Blocked when paused
      await expect(
        endpoint.deliverMessage(await bridge.getAddress(), 30101, payload)
      ).to.be.revertedWithCustomError(bridge, "EnforcedPause");

      // Unpause
      await bridge.connect(owner).unpause();

      // Works after unpause
      await expect(
        endpoint.deliverMessage(await bridge.getAddress(), 30101, payload)
      ).to.not.be.reverted;
    });
  });

  describe("Normal Operations When Not Paused", function () {
    it("should allow all operations when never paused", async function () {
      const { bridge, usdc, user1, endpoint } = await loadFixture(deployFixture);

      // Verify not paused
      expect(await bridge.paused()).to.be.false;

      // Mint and approve
      await usdc.mint(user1.address, ethers.parseUnits("200", 6));
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("200", 6));

      // Configure endpoint
      await endpoint.setAcceptMessage(true);

      // Should work fine
      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101, 1, 0,
          await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.not.be.reverted;

      // Stats should update
      expect(await bridge.totalCrossChainTx()).to.equal(1);
    });

    it("should handle multiple pause/unpause cycles correctly", async function () {
      const { bridge, usdc, owner, user1, endpoint } = await loadFixture(deployFixture);

      await usdc.mint(user1.address, ethers.parseUnits("1000", 6));
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("1000", 6));
      await endpoint.setAcceptMessage(true);

      // Cycle 1: Pause -> Unpause
      await bridge.connect(owner).pause();
      expect(await bridge.paused()).to.be.true;
      await bridge.connect(owner).unpause();
      expect(await bridge.paused()).to.be.false;

      // Should work
      await bridge.connect(user1).sendCrossChainAction(
        30101, 1, 0, await usdc.getAddress(),
        ethers.parseUnits("50", 6),
        { value: ethers.parseEther("0.1") }
      );

      // Cycle 2: Pause -> Unpause
      await bridge.connect(owner).pause();
      await bridge.connect(owner).unpause();

      // Should still work
      await bridge.connect(user1).sendCrossChainAction(
        30101, 2, 0, await usdc.getAddress(),
        ethers.parseUnits("50", 6),
        { value: ethers.parseEther("0.1") }
      );

      expect(await bridge.totalCrossChainTx()).to.equal(2);
    });
  });

  describe("Emergency Scenarios", function () {
    it("should allow emergency withdrawal while paused", async function () {
      const { bridge, usdc, owner } = await loadFixture(deployFixture);

      // Fund bridge
      await usdc.mint(await bridge.getAddress(), ethers.parseUnits("5000", 6));

      // Pause
      await bridge.connect(owner).pause();

      // Emergency withdraw should still work
      await expect(
        bridge.connect(owner).emergencyWithdraw(await usdc.getAddress())
      ).to.not.be.reverted;

      // Owner should receive tokens
      expect(await usdc.balanceOf(owner.address)).to.equal(ethers.parseUnits("5000", 6));
    });

    it("should protect user funds during pause", async function () {
      const { bridge, usdc, owner, user1 } = await loadFixture(deployFixture);

      await usdc.mint(user1.address, ethers.parseUnits("100", 6));
      const balanceBefore = await usdc.balanceOf(user1.address);

      // Pause
      await bridge.connect(owner).pause();

      // User cannot send funds while paused
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("100", 6));

      await expect(
        bridge.connect(user1).sendCrossChainAction(
          30101, 1, 0, await usdc.getAddress(),
          ethers.parseUnits("100", 6),
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWithCustomError(bridge, "EnforcedPause");

      // User funds remain untouched
      expect(await usdc.balanceOf(user1.address)).to.equal(balanceBefore);
    });
  });

  describe("State Consistency", function () {
    it("should maintain accurate statistics through pause/unpause", async function () {
      const { bridge, usdc, owner, user1, endpoint } = await loadFixture(deployFixture);

      await usdc.mint(user1.address, ethers.parseUnits("500", 6));
      await usdc.connect(user1).approve(await bridge.getAddress(), ethers.parseUnits("500", 6));
      await endpoint.setAcceptMessage(true);

      // Transaction 1
      await bridge.connect(user1).sendCrossChainAction(
        30101, 1, 0, await usdc.getAddress(),
        ethers.parseUnits("100", 6),
        { value: ethers.parseEther("0.1") }
      );

      expect(await bridge.totalCrossChainTx()).to.equal(1);

      // Pause
      await bridge.connect(owner).pause();

      // Stats unchanged during pause
      expect(await bridge.totalCrossChainTx()).to.equal(1);

      // Unpause
      await bridge.connect(owner).unpause();

      // Transaction 2
      await bridge.connect(user1).sendCrossChainAction(
        30101, 1, 0, await usdc.getAddress(),
        ethers.parseUnits("100", 6),
        { value: ethers.parseEther("0.1") }
      );

      // Stats correctly updated
      expect(await bridge.totalCrossChainTx()).to.equal(2);
    });
  });
});
