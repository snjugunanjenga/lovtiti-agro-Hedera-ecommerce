'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { 
  ShoppingCart, 
  Truck, 
  Shield, 
  Smartphone, 
  Globe, 
  Star,
  ArrowRight,
  Leaf,
  Users,
  DollarSign
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connecting African Farmers with
              <span className="text-green-600 block">Global Buyers</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A decentralized marketplace powered by blockchain technology, enabling secure, 
              transparent, and fair trade for African agricultural products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Trading
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/onboarding/farmer">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Join as Farmer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Lovitti Agro Mart?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for the future of agriculture with cutting-edge technology
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Blockchain Security</CardTitle>
                <CardDescription>
                  Secure transactions using Hedera Hashgraph with transparent escrow payments
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Globe className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Global Reach</CardTitle>
                <CardDescription>
                  Connect with buyers worldwide and expand your market reach
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Smartphone className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>USSD Access</CardTitle>
                <CardDescription>
                  Access marketplace features via USSD for feature phone users
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Truck className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Logistics Support</CardTitle>
                <CardDescription>
                  Integrated logistics and delivery tracking for seamless transactions
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <DollarSign className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Fair Pricing</CardTitle>
                <CardDescription>
                  Transparent pricing with no hidden fees or middleman markups
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-green-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Community Driven</CardTitle>
                <CardDescription>
                  Built by farmers, for farmers, with community governance
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Farmers Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from our community
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Lovitti Agro Mart has transformed my farming business. I can now sell directly to international buyers and get fair prices for my crops."
                </p>
                <div className="font-semibold">Sarah Okafor</div>
                <div className="text-sm text-gray-500">Rice Farmer, Nigeria</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "The blockchain technology gives me confidence that my payments are secure. No more worrying about payment delays or fraud."
                </p>
                <div className="font-semibold">John Mwangi</div>
                <div className="text-sm text-gray-500">Coffee Farmer, Kenya</div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "The USSD feature is amazing! I can manage my listings and check orders even with my basic phone. Technology for everyone!"
                </p>
                <div className="font-semibold">Amina Hassan</div>
                <div className="text-sm text-gray-500">Vegetable Farmer, Ghana</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Agricultural Business?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of farmers already using Lovitti Agro Mart to grow their business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Get Started Today
              </Button>
            </Link>
            <Link href="/onboarding/farmer">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-green-600">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-8 w-8 text-green-400" />
                <span className="text-2xl font-bold">Lovitti Agro Mart</span>
              </div>
              <p className="text-gray-400 mb-4">
                Connecting African farmers with global buyers through blockchain technology. 
                A comprehensive agricultural ecosystem for all stakeholders.
              </p>
              <div className="flex space-x-4">
                <Link href="/auth/signup" className="text-green-400 hover:text-green-300">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Get Started
                  </Button>
                </Link>
                <Link href="/learn-more" className="text-gray-400 hover:text-white">
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Farmers */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-400">Farmers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/onboarding/farmer" className="hover:text-white transition-colors">Join as Farmer</Link></li>
                <li><Link href="/dashboard/farmer" className="hover:text-white transition-colors">Farmer Dashboard</Link></li>
                <li><Link href="/listings/create" className="hover:text-white transition-colors">List Products</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Buyers */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Buyers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/onboarding/buyer" className="hover:text-white transition-colors">Join as Buyer</Link></li>
                <li><Link href="/dashboard/buyer" className="hover:text-white transition-colors">Buyer Dashboard</Link></li>
                <li><Link href="/listings/browse" className="hover:text-white transition-colors">Browse Products</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Distributors */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-400">Distributors</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Join as Distributor</Link></li>
                <li><Link href="/dashboard/distributor" className="hover:text-white transition-colors">Distributor Dashboard</Link></li>
                <li><Link href="/listings/browse" className="hover:text-white transition-colors">Manage Inventory</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Transporters */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-orange-400">Transporters</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Join as Transporter</Link></li>
                <li><Link href="/dashboard/transporter" className="hover:text-white transition-colors">Transporter Dashboard</Link></li>
                <li><Link href="/listings/browse" className="hover:text-white transition-colors">Find Deliveries</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Agro-Vets */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-400">Agro-Vets</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Join as Agro-Vet</Link></li>
                <li><Link href="/dashboard/agro-vet" className="hover:text-white transition-colors">Agro-Vet Dashboard</Link></li>
                <li><Link href="/listings/create" className="hover:text-white transition-colors">Sell Products</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
          </div>

          {/* Additional Links */}
          <div className="grid md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-gray-800">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/listings/browse" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/learn-more" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Lovitti Agro Mart. All rights reserved.</p>
            <p className="mt-2 text-sm">Empowering African agriculture through blockchain technology</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
