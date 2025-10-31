'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/auth-client';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/useWallet';
import {
  DollarSign,
  Layers,
  Leaf,
  Wallet,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Wand2,
  PlugZap,
} from 'lucide-react';

type FormState = {
  title: string;
  description: string;
  productDescription: string;
  priceCents: string;
  quantity: string;
  unit: string;
  category: string;
  location: string;
  images: string[];
  contractPrice: string;
  contractStock: string;
};

const DEFAULT_FORM_STATE: FormState = {
  title: '',
  description: '',
  productDescription: '',
  priceCents: '',
  quantity: '',
  unit: 'kg',
  category: '',
  location: '',
  images: [],
  contractPrice: '',
  contractStock: '',
};

const CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Grains',
  'Tubers',
  'Spices',
  'Nuts',
  'Herbs',
  'Dairy',
  'Livestock',
  'Seeds',
  'Other',
];

const UNITS = ['kg', 'lb', 'ton', 'bag', 'crate', 'bunch', 'piece'];

interface FarmerProductFormProps {
  onProductCreated?: (listingId: string, contractProductId: string | null) => void;
}

export default function FarmerProductForm({ onProductCreated }: FarmerProductFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const {
    wallet,
    isConnected,
    connectWallet,
    isFarmer,
    farmerInfo,
    getFarmerInfo,
    addProduct,
    isAddingProduct,
  } = useWallet();
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [imageInput, setImageInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: keyof FormState | 'submit' | 'images') => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const disableSubmit = isSubmitting || isAddingProduct;

  const connectedAddress = wallet?.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : null;

  const onChainStatus =
    farmerInfo?.exists ?? (typeof isFarmer === 'boolean' ? isFarmer : null);

  const walletStatusText = (() => {
    if (!wallet?.address || !isConnected) {
      return 'Connect your Hedera wallet to publish products.';
    }
    if (onChainStatus === false) {
      return 'Wallet connected but not registered as a farmer.';
    }
    if (onChainStatus) {
      return 'Wallet registered on-chain as a farmer.';
    }
    return 'Checking farmer registration on the smart contract...';
  })();

  const walletStatusTone =
    onChainStatus === false
      ? 'text-red-600'
      : onChainStatus
      ? 'text-green-600'
      : 'text-gray-600';

  const WalletStatusIcon =
    onChainStatus === false ? AlertCircle : onChainStatus ? CheckCircle2 : PlugZap;

  const handleConnectClick = async () => {
    try {
      await connectWallet();
    } catch (connectionError) {
      const message =
        connectionError instanceof Error
          ? connectionError.message
          : 'Failed to connect wallet.';
      toast({
        variant: 'destructive',
        title: 'Wallet connection failed',
        description: message,
      });
    }
  };

  const validationErrors = useMemo(() => {
    const next: Record<string, string> = {};

    if (!formState.title.trim()) next.title = 'Add a product title so buyers know what this is.';
    const parsedMarketplacePrice = Number(formState.priceCents);
    if (!formState.priceCents || !Number.isFinite(parsedMarketplacePrice) || parsedMarketplacePrice <= 0) {
      next.priceCents = 'Enter a marketplace price greater than 0.';
    }
    const parsedQuantity = Number(formState.quantity);
    if (!formState.quantity || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      next.quantity = 'Enter how many units are available.';
    }
    const parsedContractPrice = Number(formState.contractPrice);
    if (!formState.contractPrice || !Number.isFinite(parsedContractPrice) || parsedContractPrice <= 0) {
      next.contractPrice = 'Provide the on-chain price in HBAR.';
    }
    const parsedContractStock = Number(formState.contractStock);
    if (!formState.contractStock || !Number.isFinite(parsedContractStock) || parsedContractStock <= 0) {
      next.contractStock = 'Provide the on-chain stock amount.';
    }

    return next;
  }, [formState]);

  const resetForm = () => {
    setFormState(DEFAULT_FORM_STATE);
    setImageInput('');
    setErrors({});
  };

  const handleAddImage = () => {
    if (!imageInput.trim()) return;
    try {
      const url = new URL(imageInput.trim());
      setFormState((prev) => ({
        ...prev,
        images: [...prev.images, url.toString()],
      }));
      setImageInput('');
      clearFieldError('images');
    } catch {
      setErrors((prev) => ({
        ...prev,
        images: 'Enter a valid image URL (https://...)',
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    clearFieldError('images');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorKey = Object.keys(validationErrors)[0];
      toast({
        title: 'Missing required details',
        description:
          (firstErrorKey && validationErrors[firstErrorKey]) ||
          'Please review the highlighted fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      let currentWallet = wallet;
      if (!currentWallet || !isConnected) {
        currentWallet = await connectWallet();
      }

      if (!currentWallet) {
        throw new Error('Wallet connection is required to publish on-chain.');
      }

      const normalizedAddress = currentWallet.address.toLowerCase();
      let currentFarmerInfo = farmerInfo?.address?.toLowerCase() === normalizedAddress ? farmerInfo : null;

      if (!currentFarmerInfo?.exists) {
        const farmerInfoResult = await getFarmerInfo(currentWallet.address);
        currentFarmerInfo = farmerInfoResult.success ? farmerInfoResult.data ?? null : null;

        if (!currentFarmerInfo?.exists) {
          // Non-blocking warning: API/DB is the authority for publishing
          toast({
            title: 'Wallet not registered on-chain',
            description: 'Proceeding with database authorization. You can still publish.',
          });
        }
      }

      toast({
        title: 'Creating on-chain product',
        description: 'Confirm the transaction in your wallet to continue.',
      });

      const contractResult = await addProduct(
        formState.contractPrice,
        formState.contractStock,
        user?.id
      );

      if (!contractResult.success || !contractResult.data?.productId) {
        throw new Error(contractResult.error || 'Failed to create product on smart contract.');
      }

      const contractProductId = contractResult.data.productId.toString();
      const contractTxHash = contractResult.transactionHash ?? null;

      const contractData: any = contractResult.data ?? {};
      const toBigIntSafe = (value: unknown): bigint | null => {
        if (value === null || value === undefined) return null;
        try {
          if (typeof value === 'bigint') return value;
          if (typeof value === 'number') return BigInt(Math.trunc(value));
          if (typeof value === 'string') return BigInt(value);
          if (typeof value === 'object' && 'toString' in (value as any)) {
            return BigInt((value as any)?.toString());
          }
        } catch {}
        return null;
      };

      const priceWeiBigInt = toBigIntSafe(contractData.productInfo?.price ?? contractData.price);
      const stockBigInt = toBigIntSafe(contractData.productInfo?.stock ?? contractData.amount);
      const contractPriceHBAR = priceWeiBigInt ? ethers.formatEther(priceWeiBigInt) : formState.contractPrice;
      const contractStockValue = stockBigInt ? Number(stockBigInt) : Number(formState.contractStock);

      const contractMetadata = {
        productId: contractProductId,
        transactionHash: contractTxHash,
        priceWei: priceWeiBigInt ? priceWeiBigInt.toString() : null,
        priceHBAR: contractPriceHBAR,
        stock: stockBigInt ? stockBigInt.toString() : null,
        owner: contractData.productInfo?.owner ?? contractData.farmerAddress ?? currentWallet?.address ?? null,
        hederaAccountId: contractData.hederaAccountId ?? null,
      };

      toast({
        title: 'On-chain product ready',
        description: `Product #${contractProductId} confirmed on Hedera.`,
      });

      toast({
        title: 'Saving product to marketplace',
        description: 'Linking on-chain product with your dashboard listing.',
      });

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formState.title,
          description: formState.description,
          productDescription: formState.productDescription,
          priceCents: Math.round(Number(formState.priceCents) * 100),
          quantity: contractStockValue,
          unit: formState.unit,
          category: formState.category,
          location: formState.location,
          images: formState.images,
          contractProductId,
          contractTxHash,
          contractPrice: contractPriceHBAR,
          contractStock: contractStockValue,
          contractMetadata,
          isVerified: true,
        }),
      });

      if (!response.ok) {
        let apiMsg = 'Failed to save product in database.';
        try {
          const errJson = await response.json();
          if (errJson?.error) apiMsg = errJson.error;
        } catch (_) {}
        throw new Error(apiMsg);
      }

      const listing = await response.json();

      toast({
        title: 'Product published',
        description: 'Your product is live and synced with the smart contract.',
      });

      onProductCreated?.(listing.id, contractProductId);
      resetForm();
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred while saving.';
      toast({
        title: 'Product creation failed',
        description: message,
        variant: 'destructive',
      });
      setErrors((prev) => ({
        ...prev,
        submit: message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    //tyoescript - ignore
    // @ts-ignore
    <Card className="border-green-200 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start space-x-3">
            <Leaf className="mt-1 h-7 w-7 text-green-600" />
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-900">
                Add Marketplace Product
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                Publish products on-chain and sync them with the Lovtiti marketplace.
              </CardDescription>
            </div>
          </div>
          <div className="w-full max-w-sm rounded-xl border border-green-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <span>Wallet</span>
              {isConnected && wallet?.address ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  Connected
                </span>
              ) : (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-700">
                  Disconnected
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="font-mono text-sm text-gray-900">
                {connectedAddress ?? 'Not connected'}
              </div>
              <Button
                type="button"
                size="sm"
                variant={isConnected ? 'outline' : 'default'}
                className={`ml-3 whitespace-nowrap border-green-200 px-3 text-xs ${
                  isConnected
                    ? 'bg-white text-green-700 hover:bg-green-50'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                onClick={handleConnectClick}
              >
                {isConnected ? 'Refresh wallet' : 'Connect wallet'}
              </Button>
            </div>
            <div className="mt-3 flex items-start space-x-2 text-xs">
              <WalletStatusIcon className={`mt-0.5 h-4 w-4 ${walletStatusTone}`} />
              <div>
                <p className={`font-semibold ${walletStatusTone}`}>{walletStatusText}</p>
                {onChainStatus === false && (
                  <p className="mt-1 text-gray-500">
                    Use the dashboard header actions to register this wallet on-chain.
                  </p>
                )}
                {onChainStatus === null && isConnected && (
                  <p className="mt-1 text-gray-500">
                    Hang tight—this check runs directly against the smart contract.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-green-100 bg-white/80 p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">Product basics</h3>
                  <p className="text-xs text-gray-500">
                    Give buyers the essentials about this product.
                  </p>
                </div>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Product title</Label>
                    <Input
                      id="title"
                      value={formState.title}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormState((prev) => ({ ...prev, title: value }));
                        clearFieldError('title');
                      }}
                      placeholder="e.g. Fresh organic tomatoes"
                      className={errors.title ? 'border-red-500' : undefined}
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                  </div>
                  <div>
                    <Label htmlFor="description">Short description (optional)</Label>
                    <Input
                      id="description"
                      value={formState.description}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, description: event.target.value }))
                      }
                      placeholder="Quick summary for buyers"
                      className={errors.description ? 'border-red-500' : undefined}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="productDescription">Detailed description (optional)</Label>
                    <textarea
                      id="productDescription"
                      value={formState.productDescription}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          productDescription: event.target.value,
                        }))
                      }
                      placeholder="Share cultivation methods, certifications, or harvest notes..."
                      className="min-h-[120px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm leading-relaxed text-gray-700 shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white/80 p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">Marketplace details</h3>
                  <p className="text-xs text-gray-500">
                    These values power your Lovtiti marketplace listing.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="category">Category (optional)</Label>
                    <select
                      id="category"
                      value={formState.category}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, category: event.target.value }))
                      }
                      className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="location">Location (optional)</Label>
                    <Input
                      id="location"
                      value={formState.location}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, location: event.target.value }))
                      }
                      placeholder="Farm location or city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Marketplace price (USD)</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formState.priceCents}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFormState((prev) => ({ ...prev, priceCents: value }));
                          clearFieldError('priceCents');
                        }}
                        placeholder="0.00"
                        className={`pl-8 ${errors.priceCents ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.priceCents && (
                      <p className="mt-1 text-sm text-red-600">{errors.priceCents}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="quantity">Available quantity</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formState.quantity}
                        onChange={(event) => {
                          const value = event.target.value;
                          setFormState((prev) => ({ ...prev, quantity: value }));
                          clearFieldError('quantity');
                        }}
                        className={errors.quantity ? 'border-red-500' : undefined}
                      />
                      <select
                        value={formState.unit}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, unit: event.target.value }))
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white/80 p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">Media & gallery</h3>
                  <p className="text-xs text-gray-500">
                    High-quality imagery builds trust with marketplace buyers.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0">
                    <Input
                      value={imageInput}
                      onChange={(event) => {
                        setImageInput(event.target.value);
                        clearFieldError('images');
                      }}
                      placeholder="https://example.com/photo.jpg"
                      className={errors.images ? 'border-red-500' : undefined}
                    />
                    <Button type="button" variant="outline" onClick={handleAddImage}>
                      Add image
                    </Button>
                  </div>
                  {errors.images && <p className="text-sm text-red-600">{errors.images}</p>}
                  {formState.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {formState.images.map((url, index) => (
                        <div
                          key={url}
                          className="group relative h-28 overflow-hidden rounded-lg border border-green-100 bg-white shadow-sm"
                        >
                          <img
                            src={url}
                            alt={`Product image ${index + 1}`}
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-xs font-medium text-red-600 shadow-sm transition hover:bg-white"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 rounded-lg border border-dashed border-green-200 bg-green-50/80 px-4 py-3 text-sm text-green-800">
                      <ImageIcon className="h-4 w-4" />
                      <span>Add at least one image to publish a verified listing.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-green-100 bg-white/80 p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">On-chain configuration</h3>
                  <p className="text-xs text-gray-500">
                    These numbers feed the Hedera smart contract directly.
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contractPrice" className="flex items-center space-x-2">
                      <Wand2 className="h-4 w-4 text-green-600" />
                      <span>On-chain price (HBAR)</span>
                    </Label>
                    <Input
                      id="contractPrice"
                      type="number"
                      min="0"
                      step="0.0001"
                      value={formState.contractPrice}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormState((prev) => ({ ...prev, contractPrice: value }));
                        clearFieldError('contractPrice');
                      }}
                      placeholder="HBAR price per unit"
                      className={errors.contractPrice ? 'border-red-500' : undefined}
                    />
                    {errors.contractPrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.contractPrice}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Buyers will pay this price per unit during on-chain purchases.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="contractStock" className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-green-600" />
                      <span>On-chain inventory</span>
                    </Label>
                    <Input
                      id="contractStock"
                      type="number"
                      min="0"
                      step="1"
                      value={formState.contractStock}
                      onChange={(event) => {
                        const value = event.target.value;
                        setFormState((prev) => ({ ...prev, contractStock: value }));
                        clearFieldError('contractStock');
                      }}
                      placeholder="Units managed by smart contract"
                      className={errors.contractStock ? 'border-red-500' : undefined}
                    />
                    {errors.contractStock && (
                      <p className="mt-1 text-sm text-red-600">{errors.contractStock}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Keep this in sync with your actual harvest to avoid failed orders.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-green-100 bg-green-50/80 p-5 text-xs text-green-900">
                <div className="flex items-center space-x-2 font-semibold text-green-800">
                  <Wallet className="h-4 w-4" />
                  <span>Publishing tips</span>
                </div>
                <ul className="mt-3 space-y-2 text-[12px] leading-relaxed">
                  <li>Connect the farmer wallet that should receive payouts before publishing.</li>
                  <li>Double-check both USD and HBAR prices prior to signing the transaction.</li>
                  <li>Add at least one clear image to unlock verification badges and build trust.</li>
                </ul>
              </div>
            </aside>
          </section>

          {errors.submit && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors.submit}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={disableSubmit}
              className="sm:min-w-[150px]"
            >
              Clear form
            </Button>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <p className="text-xs text-gray-500">
                On-chain publishing requires a wallet signature and gas fees in HBAR.
              </p>
              <Button
                type="submit"
                disabled={disableSubmit}
                className="flex items-center space-x-2 sm:min-w-[180px]"
              >
                {(isSubmitting || isAddingProduct) && (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                )}
                <span>
                  {isAddingProduct
                    ? 'Waiting for wallet...'
                    : isSubmitting
                    ? 'Publishing product...'
                    : 'Publish product'}
                </span>
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

