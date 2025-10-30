"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserButton, useUser, useAuth } from "@clerk/nextjs";
import { hasValidClerkKeys } from "@/lib/clerk-config";
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
  Settings,
  List,
  Info,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useCart } from "@/hooks/useCart";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { AGRO_CONTRACT_ABI } from "@/types/agro-contract";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT ||
  process.env.NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS ||
  "";
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.RPC_URL ||
  "https://testnet.hashio.io/api";

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const clerkKeysValid = hasValidClerkKeys();
  const {
    isLoaded: isLoadedUser,
    isSignedIn: isSignedInUser,
    user: userUser,
  } = useUser();

  // Prevent hydration mismatch by only rendering dynamic content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // If Clerk keys are not valid, do NOT call useUser (would throw) –
  // render a simplified Navbar without auth-dependent UI.
  if (!isLoadedUser || !isSignedInUser || !userUser || !isMounted) {
    const navigation = [
      { name: "Marketplace", href: "/listings/browse", public: true },
      { name: "Services", href: "/services", public: true },
      { name: "Pricing", href: "/pricing", public: true },
      { name: "Learn More", href: "/learn-more", public: true },
    ];

    const isActive = (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }
      return pathname.startsWith(href);
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
                Lovtiti Agro Mart
              </span>
            </Link>

            {/* Desktop Navigation (no auth state) */}
            <div className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "text-green-600 bg-green-50 shadow-sm"
                      : "text-gray-700 hover:text-green-600 hover:bg-green-50 hover:shadow-sm"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {/* Fallback auth actions */}
              <div className="hidden md:flex items-center space-x-4">
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-sm">
                    Get Started
                  </Button>
                </Link>
              </div>
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
                        ? "text-green-600 bg-green-50 shadow-sm"
                        : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Mobile auth */}
                <div className="mt-4 pt-4 border-t border-green-200 space-y-2">
                  <Link href="/auth/login" className="block">
                    <Button
                      variant="outline"
                      className="w-full hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Keys are valid – safe to use Clerk hooks
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const [dbRole, setDbRole] = useState<string | null>(null);
  const { totalItems } = useCart();
  const { toast } = useToast();
  const {
    connectWallet,
    wallet,
    createFarmerAccount,
    addProduct,
    getFarmerProducts,
    getFarmerInfo,
  } = useWallet();
  const [isRegisteringFarmer, setIsRegisteringFarmer] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isViewingProducts, setIsViewingProducts] = useState(false);
  const [isFetchingFarmerInfo, setIsFetchingFarmerInfo] = useState(false);

  // Get user role from metadata or user object
  useEffect(() => {
    let isMounted = true;

    const fetchRoleFromDb = async () => {
      if (!user) {
        if (isMounted) setDbRole(null);
        return;
      }

      try {
        const response = await fetch("/api/auth/sync-user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && data.user?.role) {
          setDbRole(data.user.role);
        }
      } catch (error) {
        console.error("Failed to fetch user role from database:", error);
      }
    };

    fetchRoleFromDb();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const normalizeRoleValue = (value?: string | null) => {
    if (!value || value === "UserRole") return null;
    return value.toString().toUpperCase();
  };

  const getUserRole = () => {
    if (!user) return null;

    const metadataRole = normalizeRoleValue(
      user.publicMetadata?.role as string | undefined
    );
    if (metadataRole) {
      return metadataRole;
    }

    const unsafeRole = normalizeRoleValue(
      user.unsafeMetadata?.role as string | undefined
    );
    if (unsafeRole) {
      return unsafeRole;
    }

    return normalizeRoleValue(dbRole);
  };

  const userRole = getUserRole();
  const isFarmerRole = userRole === "FARMER";

  // Get display name for role
  const getRoleDisplayName = (role: string | null) => {
    if (!role) return "User";

    switch (role) {
      case "BUYER":
        return "Buyer";
      case "FARMER":
        return "Farmer";
      case "DISTRIBUTOR":
        return "Distributor";
      case "TRANSPORTER":
        return "Transporter";
      case "AGROEXPERT":
        return "Agro Expert";
      case "ADMIN":
        return "Admin";
      default:
        return role;
    }
  };

  const navigation = [
    { name: "Marketplace", href: "/listings/browse", public: true },
    { name: "Services", href: "/services", public: true },
    { name: "Pricing", href: "/pricing", public: true },
    { name: "Learn More", href: "/learn-more", public: true },
  ];

  const dashboards = [
    {
      name: "Farmer Dashboard",
      href: "/dashboard/farmer",
      icon: Package,
      description: "Manage products & orders",
      color: "text-green-600",
      bgColor: "bg-green-100",
      roles: ["FARMER", "ADMIN"],
    },
    {
      name: "Buyer Dashboard",
      href: "/dashboard/buyer",
      icon: ShoppingCart,
      description: "Browse & purchase products",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      roles: ["BUYER", "ADMIN"],
    },
    {
      name: "Distributor Dashboard",
      href: "/dashboard/distributor",
      icon: Package,
      description: "Manage inventory & suppliers",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      roles: ["DISTRIBUTOR", "ADMIN"],
    },
    {
      name: "Transporter Dashboard",
      href: "/dashboard/transporter",
      icon: Truck,
      description: "Route optimization & tracking",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      roles: ["TRANSPORTER", "ADMIN"],
    },
    {
      name: "Agro Expert Dashboard",
      href: "/dashboard/agro-vet",
      icon: Stethoscope,
      description: "Products, equipment & advice",
      color: "text-red-600",
      bgColor: "bg-red-100",
      roles: ["AGROEXPERT", "ADMIN"],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const canAccessDashboard = (dashboard: (typeof dashboards)[0]) => {
    if (!userRole) return false;
    if (userRole === "ADMIN") return true;
    return dashboard.roles.includes(userRole);
  };

  const getAvailableDashboards = () => {
    if (!userRole) {
      return [];
    }
    return dashboards.filter(canAccessDashboard);
  };

  const shortAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const getOrConnectWallet = useCallback(async () => {
    let currentWallet = wallet;

    if (!currentWallet?.address) {
      const connection = await connectWallet();
      if (!connection?.address) {
        throw new Error("Wallet connection was cancelled.");
      }
      currentWallet = connection;
    }

    if (!currentWallet?.address) {
      throw new Error("Wallet connection was not established.");
    }

    return currentWallet;
  }, [wallet, connectWallet]);

  const fetchFarmerStatus = useCallback(async (targetAddress: string) => {
    if (!CONTRACT_ADDRESS) {
      throw new Error("Contract address is not configured.");
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      AGRO_CONTRACT_ABI,
      provider
    );

    try {
      const response = await contract.whoFarmer(targetAddress);
      const exists = response?.exists ?? response?.[2];
      return { exists: Boolean(exists) };
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "";
      const code = error?.code?.toString().toLowerCase() ?? "";

      const notFound =
        message.toLowerCase().includes("farmer does not exist") ||
        code === "bad_data" ||
        code === "not_found";
      // message.includes('0x0000000000000000000000000000000000000000');

      if (notFound) {
        return { exists: false };
      }

      throw error;
    }
  }, []);

  const handleFarmerSync = useCallback(async () => {
    if (!isFarmerRole || isRegisteringFarmer) {
      return;
    }

    setIsRegisteringFarmer(true);
    try {
      const currentWallet = await getOrConnectWallet();
      const farmerStatus = await fetchFarmerStatus(currentWallet.address);
      if (farmerStatus.exists) {
        toast({
          title: "Already registered on-chain",
          description: `Wallet ${shortAddress(
            currentWallet.address
          )} is synced with the contract.`,
        });
        return;
      }

      toast({
        title: "Registering farmer on blockchain",
        description: "Please approve the transaction in your wallet.",
      });

      const createResult = await createFarmerAccount();
      if (!createResult.success) {
        throw new Error(createResult.error || "Contract call failed");
      }

      toast({
        title: "Farmer registration complete",
        description: createResult.transactionHash
          ? `Transaction hash: ${shortAddress(createResult.transactionHash)}`
          : "Transaction confirmed on-chain.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Blockchain sync failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsRegisteringFarmer(false);
    }
  }, [
    isFarmerRole,
    isRegisteringFarmer,
    getOrConnectWallet,
    fetchFarmerStatus,
    createFarmerAccount,
    toast,
  ]);

  const handleCreateProduct = useCallback(async () => {
    if (!isFarmerRole || isCreatingProduct) {
      return;
    }

    setIsCreatingProduct(true);
    try {
      const currentWallet = await getOrConnectWallet();
      const samplePrice = "1";
      const sampleAmount = "10";
      const result = await addProduct(samplePrice, sampleAmount);

      if (!result.success) {
        throw new Error(result.error || "Contract call failed");
      }

      const productData = result.data as
        | { productId?: bigint | null }
        | undefined;
      const productId = productData?.productId;

      toast({
        title: "Sample product created",
        description: `Wallet ${shortAddress(
          currentWallet.address
        )} added product${
          productId != null ? ` #${productId.toString()}` : ""
        } at ${samplePrice} HBAR for ${sampleAmount} units.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Create product failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsCreatingProduct(false);
    }
  }, [isFarmerRole, isCreatingProduct, getOrConnectWallet, addProduct, toast]);

  const handleViewProducts = useCallback(async () => {
    if (!isFarmerRole || isViewingProducts) {
      return;
    }

    setIsViewingProducts(true);
    try {
      const currentWallet = await getOrConnectWallet();
      const response = await getFarmerProducts(currentWallet.address);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch products");
      }

      const products = response.data ?? [];
      if (!products.length) {
        toast({
          title: "No products found",
          description: `Wallet ${shortAddress(
            currentWallet.address
          )} has no products yet.`,
        });
        return;
      }

      const summary = products
        .slice(0, 3)
        .map((product) => {
          const price = ethers.formatEther(product.price);
          return `#${product.id.toString()} • ${price} HBAR • ${product.stock.toString()} units`;
        })
        .join(" | ");

      toast({
        title: `Found ${products.length} product${
          products.length === 1 ? "" : "s"
        }`,
        description: summary + (products.length > 3 ? " …" : ""),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "View products failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsViewingProducts(false);
    }
  }, [
    isFarmerRole,
    isViewingProducts,
    getOrConnectWallet,
    getFarmerProducts,
    toast,
  ]);

  const handleWhoFarmer = useCallback(async () => {
    if (!isFarmerRole || isFetchingFarmerInfo) {
      return;
    }

    setIsFetchingFarmerInfo(true);
    try {
      const currentWallet = await getOrConnectWallet();
      const response = await getFarmerInfo(currentWallet.address);

      if (!response.success) {
        throw new Error(response.error || "Failed to fetch farmer info");
      }

      const info = response.data;
      if (!info || !info.exists) {
        toast({
          title: "Farmer not found",
          description: `No farmer record for wallet ${shortAddress(
            currentWallet.address
          )}.`,
        });
        return;
      }

      const balance = ethers.formatEther(info.balance);
      toast({
        title: "Farmer profile found",
        description: `Balance ${balance} HBAR • ${
          info.products.length
        } product${info.products.length === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "whoFarmer failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsFetchingFarmerInfo(false);
    }
  }, [
    isFarmerRole,
    isFetchingFarmerInfo,
    getOrConnectWallet,
    getFarmerInfo,
    toast,
  ]);

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
              Lovtiti Agro Mart
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
                    ? "text-green-600 bg-green-50 shadow-sm"
                    : "text-gray-700 hover:text-green-600 hover:bg-green-50 hover:shadow-sm"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* Dashboard Dropdown */}
            <div className="relative group">
              <button
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  pathname.startsWith("/dashboard")
                    ? "text-green-600 bg-green-50 shadow-sm"
                    : "text-gray-700 hover:text-green-600 hover:bg-green-50 hover:shadow-sm"
                }`}
                onMouseEnter={() => setIsDashboardDropdownOpen(true)}
                onMouseLeave={() => setIsDashboardDropdownOpen(false)}
              >
                <Users className="h-4 w-4 mr-2" />
                Dashboards
                <ChevronDown
                  className={`h-4 w-4 ml-1 transition-transform duration-200 ${
                    isDashboardDropdownOpen ? "rotate-180" : ""
                  }`}
                />
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
                              ? "bg-green-50 text-green-700 border-r-2 border-green-500"
                              : "text-gray-700 hover:text-green-600"
                          }`}
                          onClick={() => setIsDashboardDropdownOpen(false)}
                        >
                          <div
                            className={`w-10 h-10 rounded-lg ${dashboard.bgColor} flex items-center justify-center mr-3`}
                          >
                            <Icon className={`w-5 h-5 ${dashboard.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{dashboard.name}</div>
                            <div className="text-xs text-gray-500">
                              {dashboard.description}
                            </div>
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
                        <p className="text-sm text-gray-500">
                          No dashboards available
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Complete your profile to access dashboards
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
            {!isMounted ? (
              // Static placeholder to prevent hydration mismatch
              <div className="flex items-center space-x-4">
                <div className="h-10 w-20 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-10 w-28 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ) : isSignedIn ? (
              // Signed in - show user profile
              <div className="flex items-center space-x-3">
                {isFarmerRole && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFarmerSync}
                      disabled={isRegisteringFarmer}
                      className="hidden lg:flex items-center space-x-2 border-green-200"
                    >
                      <Leaf className="w-4 h-4 text-green-600" />
                      <span>
                        {isRegisteringFarmer ? "Syncing..." : "Sync Farmer"}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateProduct}
                      disabled={isCreatingProduct}
                      className="hidden lg:flex items-center space-x-2 border-green-200"
                    >
                      <Package className="w-4 h-4 text-green-600" />
                      <span>
                        {isCreatingProduct ? "Creating..." : "Create Product"}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewProducts}
                      disabled={isViewingProducts}
                      className="hidden lg:flex items-center space-x-2 border-green-200"
                    >
                      <List className="w-4 h-4 text-green-600" />
                      <span>
                        {isViewingProducts ? "Loading..." : "View Products"}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleWhoFarmer}
                      disabled={isFetchingFarmerInfo}
                      className="hidden lg:flex items-center space-x-2 border-green-200"
                    >
                      <Info className="w-4 h-4 text-green-600" />
                      <span>
                        {isFetchingFarmerInfo ? "Checking..." : "whoFarmer"}
                      </span>
                    </Button>
                  </>
                )}
                <Link href="/settings">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden lg:flex items-center justify-center w-10 h-10 p-0"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleDisplayName(userRole)}
                  </p>
                </div>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              // Not signed in - show auth buttons
              <>
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
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
                      ? "text-green-600 bg-green-50 shadow-sm"
                      : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Dashboard Section */}
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
                          ? "text-green-600 bg-green-50 shadow-sm"
                          : "text-gray-700 hover:text-green-600 hover:bg-green-50"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg ${dashboard.bgColor} flex items-center justify-center mr-3`}
                      >
                        <Icon className={`w-4 h-4 ${dashboard.color}`} />
                      </div>
                      <div>
                        <div className="font-medium">{dashboard.name}</div>
                        <div className="text-xs text-gray-500">
                          {dashboard.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {getAvailableDashboards().length === 0 && (
                  <div className="px-3 py-4 text-center">
                    <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No dashboards available
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Complete your profile to access dashboards
                    </p>
                  </div>
                )}
              </div>

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
                {!isMounted ? (
                  // Static placeholder to prevent hydration mismatch
                  <div className="space-y-2">
                    <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-10 w-full bg-gray-100 rounded animate-pulse"></div>
                  </div>
                ) : isSignedIn ? (
                  // Signed in - show user profile
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName || "User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRoleDisplayName(userRole)}
                        </p>
                      </div>
                      <UserButton afterSignOutUrl="/" />
                    </div>
                    {isFarmerRole && (
                      <>
                        <Button
                          onClick={handleFarmerSync}
                          disabled={isRegisteringFarmer}
                          className="w-full mt-3 bg-green-600 hover:bg-green-700"
                        >
                          {isRegisteringFarmer
                            ? "Syncing Farmer..."
                            : "Sync Farmer on Blockchain"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCreateProduct}
                          disabled={isCreatingProduct}
                          className="w-full mt-2 border-green-200 text-green-700 hover:bg-green-50"
                        >
                          {isCreatingProduct ? "Creating..." : "Create Product"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleViewProducts}
                          disabled={isViewingProducts}
                          className="w-full mt-2 border-green-200 text-green-700 hover:bg-green-50"
                        >
                          {isViewingProducts ? "Loading..." : "View Products"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleWhoFarmer}
                          disabled={isFetchingFarmerInfo}
                          className="w-full mt-2 border-green-200 text-green-700 hover:bg-green-50"
                        >
                          {isFetchingFarmerInfo ? "Checking..." : "whoFarmer"}
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  // Not signed in - show auth buttons
                  <>
                    <Link href="/auth/login" className="block">
                      <Button
                        variant="outline"
                        className="w-full hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup" className="block">
                      <Button className="w-full bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-sm">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
