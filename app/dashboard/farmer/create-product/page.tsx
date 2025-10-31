'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftCircle } from 'lucide-react';

import DashboardGuard from '@/components/DashboardGuard';
import FarmerProductForm from '@/components/dashboard/FarmerProductForm';

export default function FarmerCreateProductPage() {
  const router = useRouter();

  return (
    <DashboardGuard
      allowedRoles={['FARMER', 'ADMIN']}
      dashboardName="Farmer product creation"
      dashboardDescription="Create, edit, and publish your Hedera-backed marketplace listings."
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create a product</h1>
            <p className="text-sm text-gray-600">
              Connect your Hedera wallet, mint the product on-chain, and sync it to the Lovtiti marketplace.
            </p>
          </div>
          <Link
            href="/dashboard/farmer?tab=listings"
            className="inline-flex items-center space-x-2 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50"
          >
            <ArrowLeftCircle className="h-4 w-4" />
            <span>Back to dashboard</span>
          </Link>
        </div>

        <FarmerProductForm
          onProductCreated={() => {
            router.push('/dashboard/farmer?tab=listings');
            router.refresh();
          }}
        />
      </div>
    </DashboardGuard>
  );
}
