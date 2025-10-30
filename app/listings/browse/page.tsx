'use client';

import { useState, useEffect } from 'react';
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

// Mock data outside component to avoid hydration issues
const mockListings = [
  {
    id: '1',
    title: 'Fresh Organic Tomatoes',
    description: 'Premium organic tomatoes from our certified farm',
    priceCents: 50000, // ℏ500
    quantity: 100,
    unit: 'kg',
    category: 'Vegetables',
    location: 'Lagos, Nigeria',
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop&crop=center'],
    harvestDate: '2024-01-15',
    seller: { id: '1', email: 'farmer1@example.com' },
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    title: 'Premium Rice',
    description: 'High-quality rice grains, perfect for cooking',
    priceCents: 80000, // ℏ800
    quantity: 50,
    unit: 'kg',
    category: 'Grains',
    location: 'Kano, Nigeria',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop&crop=center'],
    harvestDate: '2024-01-10',
    seller: { id: '2', email: 'farmer2@example.com' },
    createdAt: '2024-01-18'
  },
  {
    id: '3',
    title: 'Fresh Cocoa Beans',
    description: 'Premium cocoa beans for chocolate production',
    priceCents: 120000, // ℏ1200
    quantity: 25,
    unit: 'kg',
    category: 'Spices',
    location: 'Ondo, Nigeria',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&crop=center'],
    harvestDate: '2024-01-05',
    seller: { id: '3', email: 'farmer3@example.com' },
    createdAt: '2024-01-15'
  }
];

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
}

export default function BrowseListingsPage() {
  const [listings] = useState<Listing[]>(mockListings);
  const [filteredListings, setFilteredListings] = useState<Listing[]>(mockListings);
  const [isLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  console.log('Component rendering, isLoading:', isLoading);

  const categories = [
    'All', 'Vegetables', 'Fruits', 'Grains', 'Spices', 'Nuts',
    'Herbs', 'Dairy', 'Meat', 'Poultry', 'Seafood', 'Beverages'
  ];

  // No complex useEffect needed - using static mock data

  // Filter and search logic
  useEffect(() => {
    let filtered = listings;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(listing => listing.category === selectedCategory);
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(listing => listing.priceCents >= parseInt(priceRange.min) * 100);
    }
    if (priceRange.max) {
      filtered = filtered.filter(listing => listing.priceCents <= parseInt(priceRange.max) * 100);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.priceCents - b.priceCents);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.priceCents - a.priceCents);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
    }

    setFilteredListings(filtered);
  }, [listings, searchQuery, selectedCategory, priceRange, sortBy]);

  const formatPrice = (priceCents: number) => {
    return `ℏ${(priceCents / 100).toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Simple loading check with timeout
  if (isLoading && listings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
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
              {filteredListings.length} products found
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
                    <Label className="text-sm font-medium">Price Range (ℏ)</Label>
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
                        setSelectedCategory('');
                        setPriceRange({ min: '', max: '' });
                        setSearchQuery('');
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
        {filteredListings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
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
      </div>
    </div>
  );
}