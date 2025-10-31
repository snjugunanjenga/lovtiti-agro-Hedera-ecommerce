"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardGuard from "@/components/DashboardGuard";
import {
  Leaf,
  Plus,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Bell,
  Search,
  Filter,
  Stethoscope,
  Wrench,
  BookOpen,
  Calendar,
  Star,
  Clock,
  MapPin,
  Video,
  MessageCircle,
  List,
  Info,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useAuth, useUser } from "@clerk/nextjs";
import { AGRO_CONTRACT_ABI } from "@/types/agro-contract";
import { ethers } from "ethers";

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT ||
  process.env.NEXT_PUBLIC_AGRO_CONTRACT_ADDRESS ||
  "";
const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  process.env.RPC_URL ||
  "https://testnet.hashio.io/api";

function FarmerDashboardContent() {
  const [activeTab, setActiveTab] = useState("overview");

  const [isRegisteringFarmer, setIsRegisteringFarmer] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isViewingProducts, setIsViewingProducts] = useState(false);
  const [isFetchingFarmerInfo, setIsFetchingFarmerInfo] = useState(false);

  // Keys are valid – safe to use Clerk hooks
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const [dbRole, setDbRole] = useState<string | null>(null);
  const { toast } = useToast();
  const {
    connectWallet,
    wallet,
    createFarmerAccount,
    addProduct,
    getFarmerProducts,
    getFarmerInfo,
  } = useWallet();

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

  // Mock data - in real app, this would come from API
  const stats = {
    totalListings: 12,
    totalSales: 45,
    totalRevenue: 125000,
    pendingOrders: 8,
  };

  const recentListings = [
    {
      id: 1,
      name: "Fresh Tomatoes",
      price: 1000,
      quantity: 100,
      status: "Active",
    },
    { id: 2, name: "Organic Rice", price: 800, quantity: 50, status: "Active" },
    { id: 3, name: "Cocoa Beans", price: 600, quantity: 25, status: "Active" },
    {
      id: 4,
      name: "Fertilizer Mix",
      price: 420,
      quantity: 100,
      status: "Active",
    },
  ];

  const recentOrders = [
    {
      id: 1,
      buyer: "John Doe",
      product: "Fresh Tomatoes",
      quantity: 20,
      total: 10000,
      status: "Pending",
    },
    {
      id: 2,
      buyer: "Jane Smith",
      product: "Organic Rice",
      quantity: 10,
      total: 8000,
      status: "Shipped",
    },
    {
      id: 3,
      buyer: "Mike Johnson",
      product: "Cocoa Beans",
      quantity: 5,
      total: 6000,
      status: "Delivered",
    },
  ];

  const agroVetProducts = [
    {
      id: 1,
      name: "Organic Seeds - Tomato",
      vendor: "Dr. Ahmed Vet",
      price: 2500,
      category: "Seeds",
      rating: 4.8,
      location: "Lagos",
    },
    {
      id: 2,
      name: "Cattle Vaccine",
      vendor: "AgroVet Solutions",
      price: 5000,
      category: "Vaccines",
      rating: 4.9,
      location: "Abuja",
    },
    {
      id: 3,
      name: "Organic Pesticide",
      vendor: "Green Farm Vet",
      price: 3500,
      category: "Pesticides",
      rating: 4.7,
      location: "Kano",
    },
    {
      id: 4,
      name: "Fertilizer Mix",
      vendor: "Dr. Sarah Agro",
      price: 4200,
      category: "Fertilizers",
      rating: 4.6,
      location: "Port Harcourt",
    },
  ];

  const equipmentLeases = [
    {
      id: 1,
      name: "Tractor - John Deere",
      vendor: "Farm Equipment Co.",
      price: 15000,
      duration: "Monthly",
      rating: 4.8,
      location: "Ibadan",
    },
    {
      id: 2,
      name: "Irrigation System",
      vendor: "Water Solutions",
      price: 8000,
      duration: "Weekly",
      rating: 4.7,
      location: "Kaduna",
    },
    {
      id: 3,
      name: "Harvesting Machine",
      vendor: "Agro Tools Ltd",
      price: 12000,
      duration: "Daily",
      rating: 4.9,
      location: "Enugu",
    },
    {
      id: 4,
      name: "Soil Testing Kit",
      vendor: "Lab Equipment",
      price: 3000,
      duration: "Weekly",
      rating: 4.5,
      location: "Lagos",
    },
  ];

  const tutorials = [
    {
      id: 1,
      title: "Organic Farming Best Practices",
      author: "Dr. Ahmed Vet",
      duration: "15 min",
      category: "Farming",
      views: 1250,
      rating: 4.8,
    },
    {
      id: 2,
      title: "Crop Rotation Techniques",
      author: "AgroVet Solutions",
      duration: "22 min",
      category: "Crop Management",
      views: 980,
      rating: 4.7,
    },
    {
      id: 3,
      title: "Soil Health Management",
      author: "Green Farm Vet",
      duration: "18 min",
      category: "Soil Science",
      views: 1450,
      rating: 4.9,
    },
    {
      id: 4,
      title: "Pest Control Methods",
      author: "Dr. Sarah Agro",
      duration: "25 min",
      category: "Pest Management",
      views: 1100,
      rating: 4.6,
    },
    {
      id: 5,
      title: "Water Conservation Tips",
      author: "Water Solutions",
      duration: "12 min",
      category: "Water Management",
      views: 850,
      rating: 4.8,
    },
    {
      id: 6,
      title: "Harvest Timing Guide",
      author: "Agro Tools Ltd",
      duration: "20 min",
      category: "Harvesting",
      views: 1200,
      rating: 4.7,
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "listings", label: "My Listings", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "agro-products", label: "Agro Expert Products", icon: Stethoscope },
    { id: "equipment", label: "Equipment Lease", icon: Wrench },
    { id: "tutorials", label: "Tutorials", icon: BookOpen },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Leaf className="h-8 w-8 text-green-600" />
                <span className="text-xl font-bold text-gray-900">
                  Farmer Dashboard
                </span>
              </div>
            </div>
            <div className="flex gap-3 items-center justify-center">
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
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Listings
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalListings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Sales
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalSales}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₦{stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pendingOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from buyers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{order.buyer}</h4>
                        <p className="text-sm text-gray-600">
                          {order.product} • {order.quantity} units
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ₦{order.total.toLocaleString()}
                        </p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "Shipped"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline">
                  View All Orders
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "listings" && (
          <div className="space-y-6">
            {/* Add New Listing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add New Listing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input id="productName" placeholder="Enter product name" />
                  </div>
                  <div>
                    <Label htmlFor="price">Price per Unit (₦)</Label>
                    <Input id="price" type="number" placeholder="Enter price" />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity Available</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Vegetables, Grains"
                    />
                  </div>
                </div>
                <Button className="mt-4">Create Listing</Button>
              </CardContent>
            </Card>

            {/* Listings Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Listings</CardTitle>
                    <CardDescription>
                      Manage your product listings
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Search listings..."
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentListings?.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{listing.name}</h4>
                        <p className="text-sm text-gray-600">
                          ₦{listing.price} per unit • {listing.quantity} units
                          available
                        </p>
                        <p className="text-sm text-gray-500">
                          {listing?.views} views
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          {listing.status === "Active"
                            ? "Deactivate"
                            : "Activate"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "orders" && (
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Track and manage your orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">Order #{order.id}</h4>
                      <p className="text-sm text-gray-600">
                        Buyer: {order.buyer}
                      </p>
                      <p className="text-sm text-gray-600">
                        Product: {order.product} • {order.quantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ₦{order.total.toLocaleString()}
                      </p>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          order.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Shipped"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="ml-4">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>Your sales metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>Sales chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Your best performing products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Fresh Tomatoes</span>
                    <span className="font-medium">₦45,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Organic Rice</span>
                    <span className="font-medium">₦32,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cocoa Beans</span>
                    <span className="font-medium">₦28,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agro Expert Products Tab */}
        {activeTab === "agro-products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Agro Expert Products
                </h2>
                <p className="text-gray-600">
                  Browse products from agricultural professionals
                </p>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agroVetProducts.map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Stethoscope className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium text-red-600">
                          {product.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {product.rating}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>by {product.vendor}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">
                          ₦{product.price.toLocaleString()}
                        </span>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{product.location}</span>
                        </div>
                      </div>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Equipment Lease Tab */}
        {activeTab === "equipment" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Equipment Lease
                </h2>
                <p className="text-gray-600">
                  Rent agricultural equipment from professionals
                </p>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search equipment..."
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {equipmentLeases.map((equipment) => (
                <Card
                  key={equipment.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">
                          {equipment.duration}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {equipment.rating}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{equipment.name}</CardTitle>
                    <CardDescription>by {equipment.vendor}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-green-600">
                          ₦{equipment.price.toLocaleString()}
                        </span>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{equipment.location}</span>
                        </div>
                      </div>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        Request Lease
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tutorials Tab */}
        {activeTab === "tutorials" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Agricultural Tutorials
                </h2>
                <p className="text-gray-600">
                  Learn from agro-professionals through video tutorials
                </p>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tutorials..."
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorials.map((tutorial) => (
                <Card
                  key={tutorial.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          {tutorial.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">
                          {tutorial.rating}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                    <CardDescription>by {tutorial.author}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{tutorial.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{tutorial.views.toLocaleString()} views</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                          <Video className="w-4 h-4 mr-2" />
                          Watch Now
                        </Button>
                        <Button variant="outline">
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
      allowedRoles={["FARMER", "ADMIN"]}
      dashboardName="Farmer Dashboard"
      dashboardDescription="Manage your products, orders, and farming operations"
    >
      <FarmerDashboardContent />
    </DashboardGuard>
  );
}
