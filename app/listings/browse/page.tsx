'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Leaf,
  Package,
  Calendar,
  DollarSign,
  SlidersHorizontal
} from 'lucide-react';
import ProductActions from '@/components/ProductActions';
import SafeImage from '@/components/ui/safe-image';

interface Listing {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  quantity: number;
  unit: string;
  category: string;
  location?: string;
  images: string[];
  harvestDate?: string;
  seller: {
    id: string;
    email: string;
  };
  createdAt: string;
  isVerified: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function BrowseListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const categories = [
    'All', 'Vegetables', 'Fruits', 'Grains', 'Spices', 'Nuts', 
    'Herbs', 'Dairy', 'Meat', 'Poultry', 'Seafood', 'Beverages'
  ];

  const fetchListings = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        verified: 'true',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory && selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);

      const response = await fetch(`/api/listings?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      const data = await response.json();
      setListings(data.listings);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, priceRange, sortBy]);

  useEffect(() => {
    fetchListings(currentPage);
  }, [currentPage, fetchListings]);

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchListings(1);
  };

  const formatPrice = (priceCents: number) => {
    return `₦${(priceCents / 100).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <Button onClick={() => fetchListings(1)} className="mt-4">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">Marketplace</span>
            </div>
            <div className="text-sm text-gray-600">
              {pagination ? `${pagination.total} products found` : 'Loading...'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search products, farmers, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </Button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
            <Button onClick={handleFilterChange}>Apply</Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category Filter */}
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label className="text-sm font-medium">Price Range (₦)</Label>
                    <div className="mt-1 flex space-x-2">
                      <Input
                        placeholder="Min"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        type="number"
                      />
                      <Input
                        placeholder="Max"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        type="number"
                      />
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory('All');
                        setPriceRange({ min: '', max: '' });
                        setSearchQuery('');
                        setCurrentPage(1);
                        fetchListings(1);
                      }}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Products Grid */}
        {listings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                  <SafeImage
                    src={listing.images[0] || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center'}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Title and Category */}
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                        {listing.title}
                      </h3>
                      <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        {listing.category}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {listing.description}
                    </p>

                    {/* Price and Quantity */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-green-600">
                          {formatPrice(listing.priceCents)}
                        </p>
                        <p className="text-sm text-gray-500">
                          per {listing.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {listing.quantity} {listing.unit}
                        </p>
                        <p className="text-xs text-gray-500">available</p>
                      </div>
                    </div>

                    {/* Location and Harvest Date */}
                    <div className="space-y-1">
                      {listing.location && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{listing.location}</span>
                        </div>
                      )}
                      {listing.harvestDate && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          <span>Harvested: {formatDate(listing.harvestDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <ProductActions
                      productId={listing.id}
                      listingId={listing.id}
                      sellerId={listing.seller.id}
                      sellerType="FARMER"
                      name={listing.title}
                      description={listing.description}
                      price={listing.priceCents / 100}
                      currency="NGN"
                      unit={listing.unit}
                      images={listing.images}
                      category={listing.category}
                      location={listing.location || ''}
                      harvestDate={listing.harvestDate ? new Date(listing.harvestDate) : undefined}
                      certifications={['Organic', 'Fresh']}
                      className="pt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-8 flex justify-center">
            <Button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="px-4 py-2">Page {currentPage} of {pagination.pages}</span>
            <Button 
              onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
              disabled={currentPage === pagination.pages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}