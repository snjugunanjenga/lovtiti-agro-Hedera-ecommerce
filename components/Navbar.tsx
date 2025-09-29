'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { 
  Leaf,
  ShoppingCart,
  Menu,
  X,
  Package,
  Truck,
  Stethoscope,
  Users,
  ChevronDown,
  Shield,
  Lock,
  Settings
} from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);
  const { user } = useUser();
  const { totalItems } = useCart();

  // Get user role from metadata or user object
  const getUserRole = () => {
    if (!user) return null;
    // This would typically come from your user metadata or database
    return user.publicMetadata?.role as string || 'FARMER';
  };

  const userRole = getUserRole();

  const navigation = [
    { name: 'Marketplace', href: '/listings/browse', public: true },
    { name: 'Pricing', href: '/pricing', public: true },
    { name: 'Learn More', href: '/learn-more', public: true },
  ];

  const dashboards = [
    {
      name: 'Farmer Dashboard',
      href: '/dashboard/farmer',
      icon: Package,
      description: 'Manage products & orders',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      roles: ['FARMER', 'ADMIN']
    },
    {
      name: 'Buyer Dashboard',
      href: '/dashboard/buyer',
      icon: ShoppingCart,
      description: 'Browse & purchase products',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      roles: ['BUYER', 'ADMIN']
    },
    {
      name: 'Distributor Dashboard',
      href: '/dashboard/distributor',
      icon: Package,
      description: 'Manage inventory & suppliers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      roles: ['DISTRIBUTOR', 'ADMIN']
    },
    {
      name: 'Transporter Dashboard',
      href: '/dashboard/transporter',
      icon: Truck,
      description: 'Route optimization & tracking',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      roles: ['TRANSPORTER', 'ADMIN']
    },
    {
      name: 'Agro-Vet Dashboard',
      href: '/dashboard/agro-vet',
      icon: Stethoscope,
      description: 'Products, equipment & advice',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      roles: ['VETERINARIAN', 'ADMIN']
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const canAccessDashboard = (dashboard: typeof dashboards[0]) => {
    if (!user) return false;
    return dashboard.roles.includes(userRole || '');
  };

  const getAvailableDashboards = () => {
    return dashboards.filter(canAccessDashboard);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-green-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Leaf className="h-8 w-8 text-green-600 group-hover:text-green-700 transition-colors" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <span className="text-2xl font-bold text-green-800 group-hover:text-green-900 transition-colors">
              Lovitti Agro Mart
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-green-600 bg-green-50 shadow-sm'
                    : 'text-gray-700 hover:text-green-600 hover:bg-green-50 hover:shadow-sm'
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Dashboard Dropdown */}
            <SignedIn>
              <div className="relative group">
                <button
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    pathname.startsWith('/dashboard')
                      ? 'text-green-600 bg-green-50 shadow-sm'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50 hover:shadow-sm'
                  }`}
                  onMouseEnter={() => setIsDashboardDropdownOpen(true)}
                  onMouseLeave={() => setIsDashboardDropdownOpen(false)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Dashboards
                  <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${
                    isDashboardDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {isDashboardDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                    onMouseEnter={() => setIsDashboardDropdownOpen(true)}
                    onMouseLeave={() => setIsDashboardDropdownOpen(false)}
                  >
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Your Dashboards
                      </div>
                      {getAvailableDashboards().map((dashboard) => {
                        const Icon = dashboard.icon;
                        return (
                          <Link
                            key={dashboard.name}
                            href={dashboard.href}
                            className={`flex items-center px-4 py-3 text-sm transition-all duration-200 hover:bg-gray-50 ${
                              isActive(dashboard.href)
                                ? 'bg-green-50 text-green-700 border-r-2 border-green-500'
                                : 'text-gray-700 hover:text-green-600'
                            }`}
                            onClick={() => setIsDashboardDropdownOpen(false)}
                          >
                            <div className={`w-10 h-10 rounded-lg ${dashboard.bgColor} flex items-center justify-center mr-3`}>
                              <Icon className={`w-5 h-5 ${dashboard.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{dashboard.name}</div>
                              <div className="text-xs text-gray-500">{dashboard.description}</div>
                            </div>
                            {isActive(dashboard.href) && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </Link>
                        );
                      })}
                      
                      {getAvailableDashboards().length === 0 && (
                        <div className="px-4 py-6 text-center">
                          <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No dashboards available</p>
                          <p className="text-xs text-gray-400 mt-1">Complete your profile to access dashboards</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SignedIn>
            
            
            {/* Cart Button */}
            <Link href="/cart">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Cart</span>
                {totalItems > 0 && (
                  <div className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                    {totalItems}
                  </div>
                )}
              </Button>
            </Link>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            <SignedOut>
              <Link href="/auth/login">
                <Button variant="outline" className="hover:bg-green-50 hover:border-green-300 transition-all duration-200">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-sm">
                  Get Started
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <div className="flex items-center space-x-3">
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="hidden lg:flex items-center justify-center w-10 h-10 p-0">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userRole?.toLowerCase() || 'Member'}
                  </p>
                </div>
                <UserButton 
                  afterSignOutUrl="/" 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 ring-2 ring-green-200 hover:ring-green-300 transition-all duration-200"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hover:bg-green-50 hover:border-green-300 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-green-200 py-4 bg-white/95 backdrop-blur-md">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-green-600 bg-green-50 shadow-sm'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Dashboard Section */}
              <SignedIn>
                <div className="pt-4 border-t border-green-200">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Your Dashboards
                  </div>
                  {getAvailableDashboards().map((dashboard) => {
                    const Icon = dashboard.icon;
                    return (
                      <Link
                        key={dashboard.name}
                        href={dashboard.href}
                        className={`flex items-center px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                          isActive(dashboard.href)
                            ? 'text-green-600 bg-green-50 shadow-sm'
                            : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <div className={`w-8 h-8 rounded-lg ${dashboard.bgColor} flex items-center justify-center mr-3`}>
                          <Icon className={`w-4 h-4 ${dashboard.color}`} />
                        </div>
                        <div>
                          <div className="font-medium">{dashboard.name}</div>
                          <div className="text-xs text-gray-500">{dashboard.description}</div>
                        </div>
                      </Link>
                    );
                  })}
                  
                  {getAvailableDashboards().length === 0 && (
                    <div className="px-3 py-4 text-center">
                      <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No dashboards available</p>
                      <p className="text-xs text-gray-400 mt-1">Complete your profile to access dashboards</p>
                    </div>
                  )}
                </div>
              </SignedIn>
              
              {/* Mobile Cart */}
              <Link href="/cart" className="block">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4 flex items-center justify-center space-x-2 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Cart</span>
                  {totalItems > 0 && (
                    <div className="w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                      {totalItems}
                    </div>
                  )}
                </Button>
              </Link>
              
              {/* Mobile Auth */}
              <div className="mt-4 pt-4 border-t border-green-200 space-y-2">
                <SignedOut>
                  <Link href="/auth/login" className="block">
                    <Button variant="outline" className="w-full hover:bg-green-50 hover:border-green-300 transition-all duration-200">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-sm">
                      Get Started
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {userRole?.toLowerCase() || 'Member'}
                      </p>
                    </div>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}