'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SafeImage from '@/components/ui/safe-image';
import { Button } from '@/components/ui/button';
import { Package, AlertCircle, BadgeCheck } from 'lucide-react';

export interface FarmerListing {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  quantity: number;
  unit: string;
  images: string[];
  contractPrice?: string | number | null;
  contractStock?: number | null;
  contractProductId?: string | null;
  contractTxHash?: string | null;
  contractCreatedAt?: string | null;
  isVerified?: boolean | null;
}

interface FarmerProductListProps {
  refreshTrigger?: number;
  onListingsLoaded?: (listings: FarmerListing[]) => void;
}

export default function FarmerProductList({
  refreshTrigger = 0,
  onListingsLoaded,
}: FarmerProductListProps) {
  const { wallet, getFarmerProducts } = useWallet();
  const [listings, setListings] = useState<FarmerListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      if (!wallet?.address) {
        setListings([]);
        setIsLoading(false);
        onListingsLoaded?.([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const farmerProductsResult = await getFarmerProducts(wallet.address);

        if (!farmerProductsResult.success || !farmerProductsResult.data) {
          throw new Error(
            farmerProductsResult.error || 'Failed to fetch products from smart contract.'
          );
        }

        const productIds = farmerProductsResult.data.map((product) => product.id.toString());

        if (productIds.length === 0) {
          setListings([]);
          return;
        }

        const response = await fetch('/api/listings/by-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch listings from marketplace database.');
        }

        const dbListings = await response.json();
        const normalizedListings: FarmerListing[] = Array.isArray(dbListings) ? dbListings : [];
        setListings(normalizedListings);
        onListingsLoaded?.(normalizedListings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setListings([]);
        onListingsLoaded?.([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [wallet?.address, getFarmerProducts, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-green-200 p-8 text-sm text-gray-600">
        <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-green-600" />
        Loading your synced products...
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Unable to load products</h4>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="text-center shadow-none">
        <CardContent className="py-12">
          <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No synced products yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Your on-chain products will appear here once you publish them from the dashboard.
          </p>
          <Button
            className="mt-5"
            onClick={() => {
              window.location.href = '/listings/create';
            }}
          >
            Create a detailed listing
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => {
        const usdPrice = (listing.priceCents / 100).toFixed(2);
        const contractPriceValue =
          listing.contractPrice !== null && listing.contractPrice !== undefined
            ? Number(listing.contractPrice)
            : null;
        const contractPriceDisplay =
          contractPriceValue !== null && Number.isFinite(contractPriceValue)
            ? contractPriceValue.toLocaleString(undefined, { maximumFractionDigits: 4 })
            : null;
        const onChainInventory =
          listing.contractStock !== null && listing.contractStock !== undefined
            ? listing.contractStock
            : listing.quantity;
        const hasOnChain = Boolean(listing.contractProductId);
        const createdAt = listing.contractCreatedAt
          ? new Date(listing.contractCreatedAt).toLocaleDateString()
          : null;

        return (
          <Card
            key={listing.id}
            className="overflow-hidden border border-green-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardHeader className="relative h-44 overflow-hidden p-0">
              {listing.images[0] ? (
                <SafeImage
                  src={listing.images[0]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-green-50 text-sm text-green-700">
                  Image coming soon
                </div>
              )}
              {hasOnChain && (
                <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center space-x-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-green-700 shadow-sm">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span>On-chain #{listing.contractProductId}</span>
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-gray-900">{listing.title}</CardTitle>
                  {listing.isVerified && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Verified
                    </span>
                  )}
                </div>
                <CardDescription className="text-sm text-gray-600 line-clamp-3">
                  {listing.description}
                </CardDescription>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-green-100 bg-green-50/60 p-3 text-xs text-gray-700">
                <div>
                  <p className="text-gray-500">Marketplace price</p>
                  <p className="text-base font-semibold text-gray-900">USD {usdPrice}</p>
                </div>
                <div>
                  <p className="text-gray-500">On-chain price</p>
                  <p className="text-base font-semibold text-gray-900">
                    {contractPriceDisplay ? `HBAR ${contractPriceDisplay}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Inventory</p>
                  <p className="text-base font-semibold text-gray-900">
                    {onChainInventory} {listing.unit}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Last synced</p>
                  <p className="text-base font-semibold text-gray-900">
                    {createdAt ?? '—'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => {
                    window.open('/listings/browse', '_blank', 'noopener,noreferrer');
                  }}
                >
                  View marketplace
                </Button>
                {listing.contractTxHash && (
                  <a
                    href={`https://hashscan.io/testnet/transaction/${listing.contractTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-green-600 underline-offset-2 hover:underline"
                  >
                    View transaction
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
