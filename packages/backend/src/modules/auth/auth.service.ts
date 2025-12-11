import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { SiweMessage } from 'siwe';
import * as bcrypt from 'bcrypt';
import { ethers } from 'ethers';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Generate nonce for SIWE
  async generateNonce(walletAddress: string): Promise<string> {
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    
    // Store nonce in Redis with 5-minute expiration
    await this.cacheManager.set(
      `nonce:${walletAddress}`,
      nonce,
      300, // 5 minutes
    );
    
    return nonce;
  }

  // Verify SIWE signature and create session
  async verifySiweAndLogin(message: string, signature: string) {
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });
    
    if (!fields.success) {
      throw new UnauthorizedException('Invalid signature');
    }

    const walletAddress = fields.data.address.toLowerCase();

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          walletAddress,
          username: `user_${walletAddress.slice(2, 10)}`,
        },
      });
    }

    // Create JWT tokens
    const tokens = await this.generateTokens(user.id, walletAddress);

    // Create session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user,
      ...tokens,
    };
  }

  // Web2 email/password registration
  async registerWithEmail(email: string, password: string, displayName: string) {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate managed wallet
    const wallet = ethers.Wallet.createRandom();
    const { encryptedPrivateKey, iv } = await this.encryptPrivateKey(wallet.privateKey);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        walletAddress: wallet.address.toLowerCase(),
        email,
        passwordHash,
        displayName,
        encryptedPrivateKey,
        encryptionIv: iv,
        username: `user_${wallet.address.slice(2, 10)}`,
      },
    });

    const tokens = await this.generateTokens(user.id, user.walletAddress);
    return { user, ...tokens };
  }

  // Helper: Generate JWT tokens
  private async generateTokens(userId: string, walletAddress: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, walletAddress },
        { expiresIn: process.env.JWT_EXPIRES_IN },
      ),
      this.jwtService.signAsync(
        { sub: userId, walletAddress },
        { secret: process.env.JWT_REFRESH_SECRET, expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  // Helper: Encrypt private key for managed wallets
  private async encryptPrivateKey(privateKey: string) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.WALLET_ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encryptedPrivateKey: encrypted,
      iv: iv.toString('hex'),
    };
  }
}