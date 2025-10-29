'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, AlertCircle } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  quantity: number;
  unit: string;
  images: string[];
}

export default function FarmerProductList() {
  const { wallet, getFarmerProducts } = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      if (!wallet?.address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const farmerProductsResult = await getFarmerProducts(wallet.address);

        if (farmerProductsResult.success && farmerProductsResult.data) {
          const productIds = farmerProductsResult.data.map(p => p.id.toString());

          if (productIds.length > 0) {
            const response = await fetch('/api/listings/by-contract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ productIds }),
            });

            if (!response.ok) {
              throw new Error('Failed to fetch listings from database');
            }

            const dbListings = await response.json();
            setListings(dbListings);
          } else {
            setListings([]);
          }
        } else {
          throw new Error(farmerProductsResult.error || 'Failed to fetch products from contract');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [wallet?.address, getFarmerProducts]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="ml-4">Loading your products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error Loading Products</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-600">You haven't created any on-chain products yet.</p>
          <Button className="mt-4" onClick={() => window.location.href = '/listings/create'}>
            Create Your First Product
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <Card key={listing.id}>
          <CardHeader>
            <img src={listing.images[0]} alt={listing.title} className="rounded-t-lg" />
          </CardHeader>
          <CardContent>
            <CardTitle>{listing.title}</CardTitle>
            <CardDescription>{listing.description}</CardDescription>
            <div className="flex justify-between items-center mt-4">
              <p className="font-bold">{`₦${listing.priceCents / 100}`}</p>
              <p>{`${listing.quantity} ${listing.unit}`}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
