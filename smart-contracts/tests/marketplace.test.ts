import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Marketplace Contract', () => {
  let marketplace: any;
  let owner: any;
  let buyer: any;
  let seller: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async () => {
    [owner, buyer, seller, addr1, addr2] = await ethers.getSigners();

    const Marketplace = await ethers.getContractFactory('Marketplace');
    marketplace = await Marketplace.deploy();
    await marketplace.deployed();
  });

  describe('Deployment', () => {
    it('Should deploy successfully', async () => {
      expect(marketplace.address).to.not.equal(ethers.constants.AddressZero);
    });
  });

  describe('Escrow Creation', () => {
    it('Should create escrow with valid parameters', async () => {
      const orderId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order123'));
      const amount = ethers.utils.parseEther('1.0');

      await expect(
        marketplace.connect(buyer).createEscrow(orderId, seller.address, { value: amount })
      ).to.emit(marketplace, 'EscrowCreated')
        .withArgs(orderId, buyer.address, seller.address, amount);
    });

    it('Should reject escrow creation with zero amount', async () => {
      const orderId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order123'));

      await expect(
        marketplace.connect(buyer).createEscrow(orderId, seller.address, { value: 0 })
      ).to.be.revertedWith('amount required');
    });

    it('Should reject duplicate escrow creation', async () => {
      const orderId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order123'));
      const amount = ethers.utils.parseEther('1.0');

      await marketplace.connect(buyer).createEscrow(orderId, seller.address, { value: amount });

      await expect(
        marketplace.connect(buyer).createEscrow(orderId, seller.address, { value: amount })
      ).to.be.revertedWith('exists');
    });
  });

  describe('Escrow Release', () => {
    let orderId: string;
    let amount: any;

    beforeEach(async () => {
      orderId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order123'));
      amount = ethers.utils.parseEther('1.0');

      await marketplace.connect(buyer).createEscrow(orderId, seller.address, { value: amount });
    });

    it('Should release escrow to seller', async () => {
      const sellerInitialBalance = await seller.getBalance();

      await expect(
        marketplace.connect(buyer).release(orderId)
      ).to.emit(marketplace, 'EscrowReleased')
        .withArgs(orderId, seller.address, amount);

      const sellerFinalBalance = await seller.getBalance();
      expect(sellerFinalBalance).to.be.closeTo(
        sellerInitialBalance.add(amount),
        ethers.utils.parseEther('0.01')
      );
    });

    it('Should reject release by non-buyer', async () => {
      await expect(
        marketplace.connect(addr1).release(orderId)
      ).to.be.revertedWith('only buyer');
    });

    it('Should reject release of non-existent escrow', async () => {
      const nonExistentOrderId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('nonexistent'));

      await expect(
        marketplace.connect(buyer).release(nonExistentOrderId)
      ).to.be.revertedWith('missing');
    });

    it('Should reject double release', async () => {
      await marketplace.connect(buyer).release(orderId);

      await expect(
        marketplace.connect(buyer).release(orderId)
      ).to.be.revertedWith('released');
    });
  });

  describe('Escrow Query', () => {
    it('Should return correct escrow details', async () => {
      const orderId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order123'));
      const amount = ethers.utils.parseEther('1.0');

      await marketplace.connect(buyer).createEscrow(orderId, seller.address, { value: amount });

      const escrow = await marketplace.escrows(orderId);
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.amount).to.equal(amount);
      expect(escrow.released).to.be.false;
    });
  });

  describe('Multi-stakeholder Transactions', () => {
    it('Should handle multiple escrows from same buyer', async () => {
      const orderId1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order1'));
      const orderId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order2'));
      const amount = ethers.utils.parseEther('1.0');

      await marketplace.connect(buyer).createEscrow(orderId1, seller.address, { value: amount });
      await marketplace.connect(buyer).createEscrow(orderId2, addr1.address, { value: amount });

      const escrow1 = await marketplace.escrows(orderId1);
      const escrow2 = await marketplace.escrows(orderId2);

      expect(escrow1.seller).to.equal(seller.address);
      expect(escrow2.seller).to.equal(addr1.address);
      expect(escrow1.released).to.be.false;
      expect(escrow2.released).to.be.false;
    });

    it('Should handle multiple escrows to same seller', async () => {
      const orderId1 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order1'));
      const orderId2 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order2'));
      const amount = ethers.utils.parseEther('1.0');

      await marketplace.connect(buyer).createEscrow(orderId1, seller.address, { value: amount });
      await marketplace.connect(addr1).createEscrow(orderId2, seller.address, { value: amount });

      const escrow1 = await marketplace.escrows(orderId1);
      const escrow2 = await marketplace.escrows(orderId2);

      expect(escrow1.buyer).to.equal(buyer.address);
      expect(escrow2.buyer).to.equal(addr1.address);
      expect(escrow1.seller).to.equal(seller.address);
      expect(escrow2.seller).to.equal(seller.address);
    });
  });

  describe('Gas Optimization', () => {
    it('Should create escrow with reasonable gas cost', async () => {
      const orderId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order123'));
      const amount = ethers.utils.parseEther('1.0');

      const tx = await marketplace.connect(buyer).createEscrow(orderId, seller.address, { value: amount });
      const receipt = await tx.wait();

      // Gas cost should be reasonable (less than 200k gas)
      expect(receipt.gasUsed).to.be.lessThan(200000);
    });

    it('Should release escrow with reasonable gas cost', async () => {
      const orderId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('order123'));
      const amount = ethers.utils.parseEther('1.0');

      await marketplace.connect(buyer).createEscrow(orderId, seller.address, { value: amount });

      const tx = await marketplace.connect(buyer).release(orderId);
      const receipt = await tx.wait();

      // Gas cost should be reasonable (less than 100k gas)
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });
  });
});