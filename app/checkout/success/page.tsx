'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  ArrowRight,
  Home,
  ShoppingBag
} from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="text-center">
          <CardContent className="py-12 px-6">
            {/* Success Icon */}
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Confirmed!
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Thank you for your order. Your payment has been processed successfully and your order is being prepared.
            </p>

            {/* Order Details */}
            <div className="bg-green-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-green-800 mb-4">What happens next?</h2>
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Order Processing</p>
                    <p className="text-sm text-green-700">Your order is being prepared by the seller</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Quality Check</p>
                    <p className="text-sm text-green-700">Products undergo quality verification</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Shipping</p>
                    <p className="text-sm text-green-700">Your order is dispatched for delivery</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Delivery</p>
                    <p className="text-sm text-green-700">Track your delivery in real-time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Features */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">🔗 Blockchain Verification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">Product authenticity verified</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">Supply chain tracked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">Farm-to-table transparency</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">Payment secured in escrow</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/dashboard/buyer" className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Package className="w-4 h-4 mr-2" />
                  View My Orders
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              
              <Link href="/listings/browse" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
            </div>

            {/* Support */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Need help with your order?
              </p>
              <Link href="/contact" className="text-green-600 hover:text-green-700 font-medium">
                Contact Support
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
