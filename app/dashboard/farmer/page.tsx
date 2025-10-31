'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FarmerProductForm from '@/components/dashboard/FarmerProductForm';
import FarmerProductList, { FarmerListing } from '@/components/dashboard/FarmerProductList';
import DashboardGuard from '@/components/DashboardGuard';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import {
  Leaf,
  Package,
  Layers,
  ShieldCheck,
  DollarSign,
  BarChart3,
  Settings,
  Bell,
  Wallet,
  CirclePlus,
} from 'lucide-react';

function FarmerDashboardContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'listings'>('overview');
  const [productsRefreshKey, setProductsRefreshKey] = useState(0);
  const [syncedListings, setSyncedListings] = useState<FarmerListing[]>([]);
  const {
    wallet,
    connectWallet,
    farmerInfo,
    getFarmerInfo,
    withdrawBalance,
    isWithdrawing,
  } = useWallet();
  const { toast } = useToast();

  useEffect(() => {
    if (!wallet?.address) {
      return;
    }

    void getFarmerInfo(wallet.address);
  }, [wallet?.address, getFarmerInfo, productsRefreshKey]);

  const shortAddress = wallet?.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : 'Not connected';

  const metrics = useMemo(() => {
    const productsOnChain = farmerInfo?.products?.length ?? 0;
    const marketplaceListings = syncedListings.length;
    const totalInventoryUnits = syncedListings.reduce(
      (acc, listing) => acc + Number(listing.contractStock ?? listing.quantity ?? 0),
      0
    );
    const verifiedListings = syncedListings.filter((listing) => listing.isVerified).length;
    const balanceTinybar = farmerInfo?.balance ?? 0n;
    const balanceFormatted = ethers.formatUnits(balanceTinybar, 8);
    const balanceNumeric = Number(balanceFormatted);
    const balanceHBAR =
      Number.isFinite(balanceNumeric)
        ? balanceNumeric.toLocaleString(undefined, {
            minimumFractionDigits: balanceNumeric > 0 ? 2 : 0,
            maximumFractionDigits: 2,
          })
        : balanceFormatted;

    return {
      productsOnChain,
      marketplaceListings,
      totalInventoryUnits,
      verifiedListings,
      balanceHBAR,
      balanceTinybar,
    };
  }, [syncedListings, farmerInfo]);

  const latestListings = useMemo(() => syncedListings.slice(0, 3), [syncedListings]);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'listings' as const, label: 'My Listings', icon: Package },
  ];

  const handleListingsLoaded = React.useCallback((listings: FarmerListing[]) => {
    setSyncedListings(listings);
  }, []);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const handleWithdrawBalance = async () => {
    if (isWithdrawing) {
      return;
    }

    try {
      if (!wallet?.address) {
        const connection = await connectWallet();
        if (!connection?.address) {
          throw new Error('Wallet connection is required to withdraw funds.');
        }
      }

      const result = await withdrawBalance();
      if (!result.success) {
        throw new Error(result.error || 'Failed to withdraw balance.');
      }

      toast({
        title: 'Withdrawal submitted',
        description: result.transactionHash
          ? `Transaction ${result.transactionHash.slice(0, 10)}...`
          : 'Request sent to your wallet.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Withdrawal failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  const inventoryLabel = metrics.totalInventoryUnits.toLocaleString();
  const hasWithdrawableBalance = (metrics.balanceTinybar ?? 0n) > 0n;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">Farmer Dashboard</span>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-gray-500">Wallet</div>
              <div className="text-sm font-medium text-gray-900">{shortAddress}</div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Layers className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">On-chain products</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.productsOnChain}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Marketplace listings</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.marketplaceListings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShieldCheck className="h-8 w-8 text-emerald-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified listings</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.verifiedListings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">HBAR balance</p>
                  <p className="text-2xl font-bold text-gray-900">HBAR {metrics.balanceHBAR}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 border-b border-gray-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 border-b-2 px-1 py-2 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <Link
              href="/dashboard/farmer/create-product"
              className="inline-flex items-center space-x-2 self-start rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 md:self-auto"
            >
              <CirclePlus className="h-4 w-4" />
              <span>Create product</span>
            </Link>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <Card className="border-green-200 shadow-sm">
                <CardHeader>
                  <CardTitle>On-chain farmer status</CardTitle>
                  <CardDescription>Live data from the Hedera smart contract.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-green-600" />
                        <span>Wallet</span>
                      </div>
                      <span className="font-mono text-gray-900">{shortAddress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-green-600" />
                        <span>Products on-chain</span>
                      </div>
                      <span className="font-semibold text-gray-900">{metrics.productsOnChain}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-green-600" />
                        <span>Total inventory units</span>
                      </div>
                      <span className="font-semibold text-gray-900">{inventoryLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>HBAR balance</span>
                      </div>
                      <span className="font-semibold text-gray-900">HBAR {metrics.balanceHBAR}</span>
                    </div>
                  </div>
                  {!wallet?.address && (
                    <Button className="mt-6" onClick={handleConnectWallet}>
                      Connect wallet
                    </Button>
                  )}
                  {wallet?.address && farmerInfo?.exists === false && (
                    <div className="mt-6 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                      Wallet connected but no farmer record detected. Use the navbar action to register this wallet on-chain.
                    </div>
                  )}
                  {wallet?.address && farmerInfo?.exists !== false && (
                    <Button
                      className="mt-6 w-full bg-green-600 hover:bg-green-700"
                      disabled={!hasWithdrawableBalance || isWithdrawing}
                      onClick={handleWithdrawBalance}
                    >
                      {isWithdrawing ? 'Processing...' : 'GET PAYED'}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="border-green-100 shadow-sm">
                <CardHeader>
                  <CardTitle>Latest synced listings</CardTitle>
                  <CardDescription>Data fetched from the marketplace database.</CardDescription>
                </CardHeader>
                <CardContent>
                  {latestListings.length > 0 ? (
                    <div className="space-y-4">
                      {latestListings.map((listing) => {
                        const priceUsd = (listing.priceCents / 100).toFixed(2);
                        const contractPriceRaw =
                          typeof listing.contractPrice === 'string'
                            ? parseFloat(listing.contractPrice)
                            : listing.contractPrice ?? null;
                        const contractPrice =
                          contractPriceRaw !== null && Number.isFinite(contractPriceRaw)
                            ? contractPriceRaw
                            : null;
                        const inventoryValue = Number(listing.contractStock ?? listing.quantity ?? 0);

                        return (
                          <div
                            key={listing.id}
                            className="rounded-lg border border-green-100 p-4"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-semibold text-gray-900">
                                  {listing.title}
                                </h4>
                                <p className="text-sm text-gray-600">{listing.description}</p>
                              </div>
                              {listing.isVerified && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  Verified
                                </span>
                              )}
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p className="font-medium text-gray-900">USD {priceUsd}</p>
                                <p>Marketplace price</p>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {inventoryValue.toLocaleString()} {listing.unit}
                                </p>
                                <p>Available inventory</p>
                              </div>
                              {contractPrice !== null && (
                                <div className="col-span-2">
                                  <p className="font-medium text-gray-900">
                                    HBAR {contractPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                  </p>
                                  <p>On-chain price per unit</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-green-200 bg-green-50/60 p-6 text-sm text-green-900">
                      No listings synced yet. Publish a product to see it appear here.
                      <Button
                        variant="outline"
                        className="mt-4 border-green-300 text-green-700 hover:bg-green-100"
                        onClick={() => setActiveTab('listings')}
                      >
                        Create your first listing
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
            <div className="space-y-6">
              <FarmerProductForm
                onProductCreated={() => setProductsRefreshKey((value) => value + 1)}
              />
              <Card className="border-green-100 bg-green-50/70 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-green-900">
                    Need richer listings?
                  </CardTitle>
                  <CardDescription>
                    Use the advanced listing builder to add videos, certifications, and logistics info.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-green-900/80">
                    <ul className="list-disc space-y-2 pl-5">
                      <li>Keep your Hedera wallet connected when updating stock or prices.</li>
                      <li>Sync harvest and expiry details to boost buyer confidence.</li>
                      <li>Upload high-quality media so buyers can inspect your produce.</li>
                    </ul>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-green-400 text-green-700 hover:bg-green-100"
                    onClick={() => {
                      window.location.href = '/listings/create';
                    }}
                  >
                    Open advanced listing tool
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Card className="border-green-200 shadow-sm">
                <CardHeader>
                  <CardTitle>On-chain listings</CardTitle>
                  <CardDescription>
                    Products created via the Hedera smart contract are synced here automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FarmerProductList
                    refreshTrigger={productsRefreshKey}
                    onListingsLoaded={handleListingsLoaded}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FarmerDashboard() {
  return (
    <DashboardGuard
      allowedRoles={['FARMER', 'ADMIN']}
      dashboardName="Farmer Dashboard"
      dashboardDescription="Manage your products, orders, and farming operations"
    >
      <FarmerDashboardContent />
    </DashboardGuard>
  );
}
