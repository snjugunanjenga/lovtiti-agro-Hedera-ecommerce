// Contract event handlers for database synchronization
import { PrismaClient } from '@prisma/client';
import { EventHandler } from './contractEventMonitor';

export class ContractEventHandlers implements EventHandler {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Handle farmerJoined event - create farmer in database
   */
  async farmerJoined(data: any): Promise<void> {
    try {
      console.log('Processing farmerJoined event:', data);

      const { farmerAddress, transactionHash, blockNumber } = data;

      // Find user by contract address
      const user = await this.prisma.user.findUnique({
        where: { contractAddress: farmerAddress }
      });

      if (!user) {
        console.warn(`User not found for contract address: ${farmerAddress}`);
        return;
      }

      // Update user to mark as contract farmer
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isContractFarmer: true,
          contractFarmerId: farmerAddress,
          contractCreatedAt: new Date(),
          contractBalance: 0
        }
      });

      // Mark event as processed
      await this.markEventAsProcessed(transactionHash);

      console.log(`Successfully created farmer account for user: ${user.id}`);
    } catch (error) {
      console.error('Error processing farmerJoined event:', error);
      throw error;
    }
  }

  /**
   * Handle productCreated event - create product in database
   */
  async productCreated(data: any): Promise<void> {
    try {
      console.log('Processing productCreated event:', data);

      const { 
        productId, 
        price, 
        farmerAddress, 
        amount, 
        transactionHash, 
        blockNumber 
      } = data;

      // Find farmer user by contract address
      const farmer = await this.prisma.user.findUnique({
        where: { contractAddress: farmerAddress }
      });

      if (!farmer) {
        console.warn(`Farmer not found for contract address: ${farmerAddress}`);
        return;
      }

      // Create listing in database
      const listing = await this.prisma.listing.create({
        data: {
          title: `Product ${productId}`,
          description: `Product created on contract with ID ${productId}`,
          priceCents: Math.floor(parseFloat(price) * 100), // Convert ETH to cents
          currency: 'ETH',
          quantity: parseInt(amount),
          unit: 'kg',
          category: 'Agricultural Product',
          images: [],
          isActive: true,
          isVerified: false,
          sellerId: farmer.id,
          
          // Contract integration fields
          contractProductId: productId,
          contractPrice: parseFloat(price),
          contractStock: parseInt(amount),
          contractTxHash: transactionHash,
          contractCreatedAt: new Date()
        }
      });

      // Mark event as processed
      await this.markEventAsProcessed(transactionHash);

      console.log(`Successfully created listing: ${listing.id} for product: ${productId}`);
    } catch (error) {
      console.error('Error processing productCreated event:', error);
      throw error;
    }
  }

  /**
   * Handle productBought event - create order in database
   */
  async productBought(data: any): Promise<void> {
    try {
      console.log('Processing productBought event:', data);

      const { 
        productId, 
        buyerAddress, 
        farmerAddress, 
        amount, 
        transactionHash, 
        blockNumber 
      } = data;

      // Find buyer and farmer users
      const [buyer, farmer] = await Promise.all([
        this.prisma.user.findUnique({
          where: { contractAddress: buyerAddress }
        }),
        this.prisma.user.findUnique({
          where: { contractAddress: farmerAddress }
        })
      ]);

      if (!buyer) {
        console.warn(`Buyer not found for contract address: ${buyerAddress}`);
        return;
      }

      if (!farmer) {
        console.warn(`Farmer not found for contract address: ${farmerAddress}`);
        return;
      }

      // Find the listing by contract product ID
      const listing = await this.prisma.listing.findUnique({
        where: { contractProductId: productId }
      });

      if (!listing) {
        console.warn(`Listing not found for contract product ID: ${productId}`);
        return;
      }

      // Create order in database
      const order = await this.prisma.order.create({
        data: {
          buyerId: buyer.id,
          listingId: listing.id,
          status: 'PAID',
          amountCents: Math.floor(parseFloat(amount) * parseFloat(listing.contractPrice?.toString() || '0') * 100),
          currency: 'ETH',
          deliveryStatus: 'PENDING',
          
          // Contract integration fields
          contractTxHash: transactionHash,
          contractAmount: parseFloat(amount) * parseFloat(listing.contractPrice?.toString() || '0'),
          contractBuyerAddr: buyerAddress,
          contractSellerAddr: farmerAddress,
          contractPurchasedAt: new Date()
        }
      });

      // Update listing stock
      await this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          quantity: listing.quantity - parseInt(amount),
          contractStock: (listing.contractStock || 0) - parseInt(amount)
        }
      });

      // Update farmer's contract balance
      const purchaseAmount = parseFloat(amount) * parseFloat(listing.contractPrice?.toString() || '0');
      await this.prisma.user.update({
        where: { id: farmer.id },
        data: {
          contractBalance: {
            increment: purchaseAmount
          }
        }
      });

      // Mark event as processed
      await this.markEventAsProcessed(transactionHash);

      console.log(`Successfully created order: ${order.id} for product: ${productId}`);
    } catch (error) {
      console.error('Error processing productBought event:', error);
      throw error;
    }
  }

  /**
   * Handle stockUpdated event - update product stock in database
   */
  async stockUpdated(data: any): Promise<void> {
    try {
      console.log('Processing stockUpdated event:', data);

      const { amount, productId, transactionHash, blockNumber } = data;

      // Find listing by contract product ID
      const listing = await this.prisma.listing.findUnique({
        where: { contractProductId: productId }
      });

      if (!listing) {
        console.warn(`Listing not found for contract product ID: ${productId}`);
        return;
      }

      // Update stock
      await this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          quantity: parseInt(amount),
          contractStock: parseInt(amount)
        }
      });

      // Mark event as processed
      await this.markEventAsProcessed(transactionHash);

      console.log(`Successfully updated stock for product: ${productId} to ${amount}`);
    } catch (error) {
      console.error('Error processing stockUpdated event:', error);
      throw error;
    }
  }

  /**
   * Handle priceIncreased event - update product price in database
   */
  async priceIncreased(data: any): Promise<void> {
    try {
      console.log('Processing priceIncreased event:', data);

      const { price, productId, transactionHash, blockNumber } = data;

      // Find listing by contract product ID
      const listing = await this.prisma.listing.findUnique({
        where: { contractProductId: productId }
      });

      if (!listing) {
        console.warn(`Listing not found for contract product ID: ${productId}`);
        return;
      }

      // Update price
      await this.prisma.listing.update({
        where: { id: listing.id },
        data: {
          priceCents: Math.floor(parseFloat(price) * 100),
          contractPrice: parseFloat(price)
        }
      });

      // Mark event as processed
      await this.markEventAsProcessed(transactionHash);

      console.log(`Successfully updated price for product: ${productId} to ${price}`);
    } catch (error) {
      console.error('Error processing priceIncreased event:', error);
      throw error;
    }
  }

  /**
   * Mark event as processed in database
   */
  private async markEventAsProcessed(transactionHash: string): Promise<void> {
    try {
      await this.prisma.contractEvent.updateMany({
        where: { transactionHash },
        data: { 
          processed: true,
          processedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error marking event as processed:', error);
    }
  }

  /**
   * Process unprocessed events (for manual processing)
   */
  async processUnprocessedEvents(): Promise<void> {
    try {
      const unprocessedEvents = await this.prisma.contractEvent.findMany({
        where: { processed: false },
        orderBy: { createdAt: 'asc' }
      });

      console.log(`Processing ${unprocessedEvents.length} unprocessed events`);

      for (const event of unprocessedEvents) {
        try {
          const eventData = JSON.parse(event.eventData);
          
          switch (event.eventType) {
            case 'farmerJoined':
              await this.farmerJoined(eventData);
              break;
            case 'productCreated':
              await this.productCreated(eventData);
              break;
            case 'productBought':
              await this.productBought(eventData);
              break;
            case 'stockUpdated':
              await this.stockUpdated(eventData);
              break;
            case 'priceIncreased':
              await this.priceIncreased(eventData);
              break;
            default:
              console.warn(`Unknown event type: ${event.eventType}`);
          }
        } catch (error) {
          console.error(`Error processing event ${event.id}:`, error);
        }
      }

      console.log('Finished processing unprocessed events');
    } catch (error) {
      console.error('Error processing unprocessed events:', error);
      throw error;
    }
  }

  /**
   * Get contract statistics
   */
  async getContractStats(): Promise<any> {
    try {
      const totalFarmers = await this.prisma.user.count({
        where: { isContractFarmer: true }
      });

      const totalProducts = await this.prisma.listing.count({
        where: { contractProductId: { not: null } }
      });

      const totalOrders = await this.prisma.order.count({
        where: { contractTxHash: { not: null } }
      });

      const totalContractBalance = await this.prisma.user.aggregate({
        where: { isContractFarmer: true },
        _sum: { contractBalance: true }
      });

      return {
        totalFarmers,
        totalProducts,
        totalOrders,
        totalContractBalance: totalContractBalance._sum.contractBalance || 0
      };
    } catch (error) {
      console.error('Error getting contract stats:', error);
      throw error;
    }
  }
}


