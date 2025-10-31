'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Heart,
  Check,
  Loader2,
  Plus,
  Minus,
  Zap,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useUser } from '@/components/auth-client';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';

interface ProductActionsProps {
  productId: string;
  listingId: string;
  sellerId: string;
  sellerType: 'FARMER' | 'DISTRIBUTOR' | 'VETERINARIAN';
  name: string;
  description: string;
  price: number;
  currency: string;
  unit: string;
  images: string[];
  category: string;
  location: string;
  harvestDate?: Date;
  expiryDate?: Date;
  certifications?: string[];
  contractProductId?: string;
  contractPriceHBAR?: string | number | null;
  contractStock?: number | null;
  onChainQuantity?: number | null;
  contractMetadata?: Record<string, any> | null;
  className?: string;
}

export default function ProductActions({
  productId,
  listingId,
  sellerId,
  sellerType,
  name,
  description,
  price,
  currency,
  unit,
  images,
  category,
  location,
  harvestDate,
  expiryDate,
  certifications = [],
  contractProductId,
  contractPriceHBAR,
  contractStock,
  onChainQuantity,
  contractMetadata,
  className = '',
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [isInitiatingBuy, setIsInitiatingBuy] = useState(false);
  
  const { user } = useUser();
  const isSignedIn = Boolean(user);
  const router = useRouter();
  const { toast } = useToast();
  const { wallet, connectWallet, buyProduct, isBuyingProduct } = useWallet();

  // Get user role (default to BUYER for now)
  const userRole = (user?.role ?? 'BUYER') as any;
  
  // For now everyone can purchase regardless of role
  const canBuy = true;
  
  const {
    addToCart,
    toggleLike,
    isInCart,
    isLiked,
  } = useCart();

  const handleAddToCart = async () => {
    // Allow cart functionality without authentication for now
    // if (!isSignedIn) {
    //   router.push('/auth/login');
    //   return;
    // }

    setIsAddingToCart(true);
    try {
      await addToCart({
        productId,
        listingId,
        sellerId,
        sellerType,
        name,
        description,
        price,
        currency,
        quantity,
        unit,
        images,
        category,
        location,
        harvestDate,
        expiryDate,
        certifications,
      });
      
      // Show success feedback
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 1000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setIsAddingToCart(false);
    }
  };

  const contractPriceNumber =
    contractPriceHBAR === null || contractPriceHBAR === undefined
      ? null
      : Number(contractPriceHBAR);
  const initialOnChain = useMemo<number | null>(
    () => (onChainQuantity ?? contractStock ?? null),
    [onChainQuantity, contractStock],
  );
  const [availableOnChain, setAvailableOnChain] = useState<number | null>(initialOnChain);

  useEffect(() => {
    setAvailableOnChain(onChainQuantity ?? contractStock ?? null);
  }, [onChainQuantity, contractStock]);

  const canUseOnChainPurchase =
    canBuy && !!contractProductId && contractPriceNumber !== null;
  const isOutOfOnChainStock =
    availableOnChain !== null && availableOnChain !== undefined && availableOnChain <= 0;
  const totalOnChainCost =
    contractPriceNumber !== null ? contractPriceNumber * quantity : null;

  const handleBuyOnChain = async () => {
    if (!contractProductId || contractPriceNumber === null) {
      return;
    }

    const purchaseQuantity = Math.max(1, quantity);

    if (
      availableOnChain !== null &&
      availableOnChain !== undefined &&
      purchaseQuantity > availableOnChain
    ) {
      toast({
        variant: 'destructive',
        title: 'Insufficient on-chain stock',
        description: `Only ${availableOnChain} unit${
          availableOnChain === 1 ? '' : 's'
        } remain available on-chain.`,
      });
      return;
    }

    setIsInitiatingBuy(true);
    try {
      let currentWallet = wallet;
      if (!currentWallet || !currentWallet.isConnected) {
        currentWallet = await connectWallet();
      }

      if (!currentWallet) {
        throw new Error('Wallet connection is required to complete on-chain purchases.');
      }

      const result = await buyProduct(contractProductId, purchaseQuantity);

      if (!result.success) {
        throw new Error(result.error || 'Failed to execute on-chain purchase.');
      }

      const updatedStock =
        availableOnChain !== null ? Math.max(0, availableOnChain - purchaseQuantity) : null;
      setAvailableOnChain(updatedStock);

      if (listingId) {
        try {
          const metadataPayload = {
            ...(contractMetadata ?? {}),
            lastPurchase: {
              quantity: purchaseQuantity,
              at: new Date().toISOString(),
              buyer: user?.email ?? null,
              txHash: result.transactionHash ?? null,
            },
          };

          await fetch(`/api/listings/${listingId}/contract`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractProductId,
              contractTxHash: result.transactionHash ?? null,
              contractPrice: contractPriceHBAR ?? null,
              contractStock: updatedStock,
              contractMetadata: metadataPayload,
            }),
          });

          router.refresh();
        } catch (dbError) {
          console.error('Failed to sync contract data to database:', dbError);
        }
      }

      toast({
        title: 'Purchase initiated',
        description: 'Confirm the transaction in your wallet to finalize the order.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to execute on-chain purchase.';
      toast({
        variant: 'destructive',
        title: 'On-chain purchase failed',
        description: message,
      });
    } finally {
      setIsInitiatingBuy(false);
    }
  };

  const handleToggleLike = async () => {
    // Allow like functionality without authentication for now
    // if (!isSignedIn) {
    //   router.push('/auth/login');
    //   return;
    // }

    setIsTogglingLike(true);
    try {
      await toggleLike(productId, listingId);
      setTimeout(() => {
        setIsTogglingLike(false);
      }, 500);
    } catch (error) {
      console.error('Error toggling like:', error);
      setIsTogglingLike(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 100) {
      setQuantity(newQuantity);
    }
  };

  const isInCartStatus = isInCart(productId, listingId);
  const isLikedStatus = isLiked(productId, listingId);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Quantity Selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Quantity:</span>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="w-8 h-8 p-0"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[2rem] text-center">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= 100}
            className="w-8 h-8 p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      {canUseOnChainPurchase && (
        <Button
          onClick={handleBuyOnChain}
          disabled={
            isInitiatingBuy || isBuyingProduct || isOutOfOnChainStock || quantity <= 0
          }
          className="mb-2 flex w-full items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {isInitiatingBuy || isBuyingProduct ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Zap className="h-4 w-4 text-white" />
          )}
          <span>
            {isOutOfOnChainStock
              ? 'Out of on-chain stock'
              : 'Buy now on-chain'}
          </span>
        </Button>
      )}

      <div className="flex space-x-2">
        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={isAddingToCart || isInCartStatus || !canBuy}
          className={`flex-1 ${
            isInCartStatus
              ? 'bg-green-600 text-white cursor-not-allowed'
              : !canBuy
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : isInCartStatus ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Added to Cart
            </>
          ) : !canBuy ? (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Not Available
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>

        {/* Like Button */}
        <Button
          variant="outline"
          onClick={handleToggleLike}
          disabled={isTogglingLike}
          className={`w-12 h-10 p-0 ${
            isLikedStatus
              ? 'text-red-600 border-red-300 bg-red-50 hover:bg-red-100'
              : 'text-gray-600 border-gray-300 hover:border-red-300 hover:text-red-600'
          }`}
        >
          {isTogglingLike ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart 
              className={`w-4 h-4 ${
                isLikedStatus ? 'fill-current' : ''
              }`} 
            />
          )}
        </Button>
      </div>

      {/* Price Display */}
      <div className="text-center pt-2 border-t border-gray-100">
        <div className="text-lg font-bold text-green-600">
          {currency} {price.toLocaleString()}
        </div>
        <div className="text-sm text-gray-500">
          per {unit}
        </div>
        {quantity > 1 && (
          <div className="text-sm text-gray-600 mt-1">
            Total: {currency} {(price * quantity).toLocaleString()}
          </div>
        )}
        {canUseOnChainPurchase && contractPriceNumber !== null && (
          <div className="mt-2 rounded-md border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-800">
            <div className="font-semibold">
              On-chain price: HBAR {contractPriceNumber.toLocaleString(undefined, { maximumFractionDigits: 4 })}
            </div>
            {totalOnChainCost !== null && quantity > 1 && (
              <div>HBAR total: {totalOnChainCost.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
            )}
            {availableOnChain !== null && (
              <div>On-chain inventory: {availableOnChain}</div>
            )}
          </div>
        )}
      </div>

      {/* Status Messages */}
      {isInCartStatus && (
        <div className="text-center">
          <p className="text-sm text-green-600 font-medium">
            ✓ Item added to cart
          </p>
          <p className="text-xs text-gray-500">
            You can adjust quantity in your cart
          </p>
        </div>
      )}
      
      {isLikedStatus && (
        <div className="text-center">
          <p className="text-sm text-red-600 font-medium">
            ♥ Item liked
          </p>
          <p className="text-xs text-gray-500">
            View your liked items in your profile
          </p>
        </div>
      )}

      {/* Business Logic Information */}
      {!canBuy && (
        <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            Purchase Not Available
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            {userRole === 'FARMER' && sellerType === 'FARMER' && 'Farmers cannot buy from other farmers'}
            {userRole === 'DISTRIBUTOR' && sellerType === 'DISTRIBUTOR' && 'Distributors cannot buy from other distributors'}
            {userRole === 'TRANSPORTER' && 'Transporters cannot buy products'}
            {userRole === 'VETERINARIAN' && sellerType === 'VETERINARIAN' && 'Agro Experts cannot buy from other Agro Experts'}
            {userRole === 'BUYER' && 'Buyers can buy from any seller'}
          </p>
        </div>
      )}
    </div>
  );
}
