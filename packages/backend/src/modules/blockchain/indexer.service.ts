import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../websockets/events.gateway';

@Injectable()
export class BlockchainIndexerService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainIndexerService.name);
  private providers: Map<number, ethers.Provider> = new Map();

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async onModuleInit() {
    await this.initializeProviders();
    await this.startIndexing();
  }

  private async initializeProviders() {
    // Ethereum
    this.providers.set(
      1,
      new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC),
    );

    // Polygon
    this.providers.set(
      137,
      new ethers.JsonRpcProvider(process.env.POLYGON_RPC),
    );

    // Avalanche
    this.providers.set(
      43114,
      new ethers.JsonRpcProvider(process.env.AVALANCHE_RPC),
    );
  }

  async startIndexing() {
    for (const [chainId, provider] of this.providers) {
      await this.indexChain(chainId, provider);
    }
  }

  private async indexChain(chainId: number, provider: ethers.Provider) {
    const factoryAddress = this.getFactoryAddress(chainId);
    const factory = new ethers.Contract(
      factoryAddress,
      FACTORY_ABI,
      provider,
    );

    // Get last synced block
    const sync = await this.prisma.blockchainSync.findUnique({
      where: {
        chainId_contractAddress: {
          chainId,
          contractAddress: factoryAddress,
        },
      },
    });

    const fromBlock = sync?.lastBlock || 0;

    this.logger.log(`Indexing chain ${chainId} from block ${fromBlock}`);

    // Listen to new events
    factory.on('FundraiserCreated', async (address, owner, id, event) => {
      await this.handleFundraiserCreated(chainId, event);
    });

    factory.on('DonationReceived', async (fundraiserId, donor, amount, event) => {
      await this.handleDonationReceived(chainId, event);
    });

    // Index historical events
    await this.indexHistoricalEvents(factory, fromBlock, chainId);
  }

  private async handleDonationReceived(chainId: number, event: any) {
    const { fundraiserId, donor, amount } = event.args;

    // Save to database
    await this.prisma.donation.create({
      data: {
        txHash: event.log.transactionHash,
        amount: ethers.formatUnits(amount, 6),
        amountUSD: ethers.formatUnits(amount, 6),
        token: 'USDC',
        chainId,
        sourceChain: this.getChainName(chainId),
        donorAddress: donor,
        fundraiserId: fundraiserId.toString(),
        blockNumber: event.log.blockNumber,
      },
    });

    // Emit real-time event via WebSocket
    this.eventsGateway.emitDonation({
      fundraiserId: fundraiserId.toString(),
      amount: ethers.formatUnits(amount, 6),
      donor,
    });

    this.logger.log(`Indexed donation: ${event.log.transactionHash}`);
  }
}