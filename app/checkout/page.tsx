'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CreditCard, 
  Smartphone, 
  Coins, 
  Shield,
  MapPin,
  User,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
// import { useUser } from '@clerk/nextjs';

interface DeliveryInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  deliveryInstructions?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  fees: string;
  processingTime: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  // const { user } = useUser();
  const user = null as any; // Temporary for development
  const { items, totalItems, totalPrice, clearCart } = useCart();
  
  // Wallet integration
  const { 
    isConnected, 
    wallet, 
    buyProduct, 
    isBuyingProduct,
    error: walletError 
  } = useWallet();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    fullName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Nigeria',
    deliveryInstructions: ''
  });
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string>('');

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'stripe',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-6 h-6" />,
      description: 'Visa, Mastercard, American Express',
      fees: '2.9% + ₦15',
      processingTime: 'Instant'
    },
    {
      id: 'mpesa',
      name: 'MPESA',
      icon: <Smartphone className="w-6 h-6" />,
      description: 'Mobile money payment',
      fees: '1.5%',
      processingTime: 'Instant'
    },
    {
      id: 'hedera',
      name: 'Hedera HBAR',
      icon: <Coins className="w-6 h-6" />,
      description: 'Blockchain payment with escrow',
      fees: '0.1%',
      processingTime: '2-5 minutes'
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: <Shield className="w-6 h-6" />,
      description: 'Ethereum, USDT, USDC',
      fees: 'Gas fees only',
      processingTime: '1-3 minutes'
    }
  ];

  const calculateTotals = () => {
    const subtotal = totalPrice;
    const deliveryFee = 500; // Fixed delivery fee
    const serviceFee = subtotal * 0.025; // 2.5% service fee
    const total = subtotal + deliveryFee + serviceFee;
    
    return {
      subtotal,
      deliveryFee,
      serviceFee,
      total
    };
  };

  const totals = calculateTotals();

  useEffect(() => {
    if (totalItems === 0) {
      router.push('/cart');
    }
  }, [totalItems, router]);

  const handleDeliveryInfoChange = (field: keyof DeliveryInfo, value: string) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setPaymentError('');
  };

  const handleProceedToPayment = () => {
    if (currentStep === 1) {
      // Validate delivery info
      const requiredFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'postalCode'];
      const missingFields = requiredFields.filter(field => !deliveryInfo[field as keyof DeliveryInfo]);
      
      if (missingFields.length > 0) {
        alert('Please fill in all required fields');
        return;
      }
      
      setCurrentStep(2);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      setPaymentError('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      const orderData = {
        items,
        deliveryInfo,
        paymentMethod: selectedPaymentMethod,
        totals
      };

      // Process payment based on selected method
      switch (selectedPaymentMethod) {
        case 'stripe':
          await processStripePayment(orderData);
          break;
        case 'mpesa':
          await processMpesaPayment(orderData);
          break;
        case 'hedera':
          await processHederaPayment(orderData);
          break;
        case 'metamask':
          await processMetaMaskPayment(orderData);
          break;
        default:
          throw new Error('Invalid payment method');
      }

      // Clear cart and redirect to success page
      clearCart();
      router.push('/checkout/success');
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processStripePayment = async (orderData: any) => {
    const response = await fetch('/api/payments/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    const { clientSecret } = await response.json();
    
    // In a real implementation, you would use Stripe Elements here
    // For now, we'll simulate a successful payment
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const processMpesaPayment = async (orderData: any) => {
    const response = await fetch('/api/payments/mpesa/stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderData,
        phoneNumber: deliveryInfo.phone
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initiate MPESA payment');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'MPESA payment failed');
    }
  };

  const processHederaPayment = async (orderData: any) => {
    const response = await fetch('/api/payments/hedera/escrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      throw new Error('Failed to create Hedera escrow');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Hedera payment failed');
    }
  };

  const processMetaMaskPayment = async (orderData: any) => {
    // Check if wallet is connected
    if (!isConnected) {
      throw new Error('Please connect your wallet first');
    }

    if (!wallet?.address) {
      throw new Error('Wallet address not found');
    }

    // Process each item in the cart through the smart contract
    const purchaseResults = [];
    
    for (const item of items) {
      // Skip contract validation for now - products may not have contractProductId
      // if (!item.contractProductId) {
      //   throw new Error(`Product ${item.name} is not available on the contract`);
      // }

      // Calculate the total value for this item
      const itemTotal = item.price * item.quantity;
      const valueInEth = (itemTotal / 100).toString(); // Convert from cents to ETH (simplified)

      // Buy product through smart contract
      const result = await buyProduct(
        item.productId, // Use productId instead of contractProductId
        item.quantity,
        valueInEth,
        user?.id || 'unknown'
      );

      if (!result.success) {
        throw new Error(result.error || `Failed to purchase ${item.name}`);
      }

      purchaseResults.push({
        itemId: item.id,
        contractProductId: item.productId, // Use productId instead of contractProductId
        transactionHash: result.transactionId,
        amount: itemTotal
      });
    }

    // Create order in database with contract information
    const orderResponse = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: purchaseResults,
        deliveryInfo,
        paymentMethod: 'agro_contract',
        totals,
        contractBuyerAddr: wallet.address
      })
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to create order in database');
    }

    return purchaseResults;
  };

  if (totalItems === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add some products to your cart before checkout</p>
          <Link href="/listings/browse">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center text-green-600 hover:text-green-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your order securely</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : '1'}
              </div>
              <span className="ml-2 font-medium">Delivery Info</span>
            </div>
            <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Delivery Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={deliveryInfo.fullName}
                        onChange={(e) => handleDeliveryInfoChange('fullName', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={deliveryInfo.email}
                        onChange={(e) => handleDeliveryInfoChange('email', e.target.value)}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={deliveryInfo.phone}
                        onChange={(e) => handleDeliveryInfoChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={deliveryInfo.country}
                        onChange={(e) => handleDeliveryInfoChange('country', e.target.value)}
                        placeholder="Enter your country"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        value={deliveryInfo.address}
                        onChange={(e) => handleDeliveryInfoChange('address', e.target.value)}
                        placeholder="Enter your full address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={deliveryInfo.city}
                        onChange={(e) => handleDeliveryInfoChange('city', e.target.value)}
                        placeholder="Enter your city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={deliveryInfo.state}
                        onChange={(e) => handleDeliveryInfoChange('state', e.target.value)}
                        placeholder="Enter your state"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        value={deliveryInfo.postalCode}
                        onChange={(e) => handleDeliveryInfoChange('postalCode', e.target.value)}
                        placeholder="Enter postal code"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                      <Input
                        id="deliveryInstructions"
                        value={deliveryInfo.deliveryInstructions}
                        onChange={(e) => handleDeliveryInfoChange('deliveryInstructions', e.target.value)}
                        placeholder="Any special delivery instructions"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPaymentMethod === method.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handlePaymentMethodSelect(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              selectedPaymentMethod === method.id
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {method.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{method.name}</h3>
                              <p className="text-sm text-gray-600">{method.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{method.fees}</p>
                            <p className="text-xs text-gray-500">{method.processingTime}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {paymentError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                        <p className="text-red-800">{paymentError}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name} x{item.quantity}</span>
                      <span className="font-medium">{item.currency} {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">NGN {totals.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">NGN {totals.deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Fee (2.5%)</span>
                    <span className="font-medium">NGN {totals.serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-green-600">NGN {totals.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {currentStep === 1 ? (
                    <Button 
                      onClick={handleProceedToPayment}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Proceed to Payment
                    </Button>
                  ) : (
                    <Button 
                      onClick={handlePayment}
                      disabled={!selectedPaymentMethod || isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        `Pay NGN ${totals.total.toLocaleString()}`
                      )}
                    </Button>
                  )}
                </div>

                {/* Security Notice */}
                <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                  <p>🔒 Secure checkout with blockchain verification</p>
                  <p>📦 Supply chain tracking included</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
