import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, ShoppingCart, Star, Plus } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  image: string;
  isOnSale?: boolean;
  category: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "Cute Soft Teddybear",
    price: 285,
    originalPrice: 345,
    rating: 3,
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=300&fit=crop",
    isOnSale: true,
    category: "toys"
  },
  {
    id: 2,
    name: "MacBook Air Pro",
    price: 650,
    originalPrice: 900,
    rating: 3,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop",
    isOnSale: true,
    category: "electronics"
  },
  {
    id: 3,
    name: "Gaming Console",
    price: 25,
    originalPrice: 31,
    rating: 3,
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop",
    isOnSale: true,
    category: "electronics"
  },
  {
    id: 4,
    name: "Boat Headphone",
    price: 50,
    originalPrice: 65,
    rating: 3,
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop",
    isOnSale: true,
    category: "electronics"
  },
  {
    id: 5,
    name: "Toy Dino for Fun",
    price: 210,
    originalPrice: 250,
    rating: 3,
    image: "https://images.unsplash.com/photo-1559081842-559de29b8ad3?w=300&h=300&fit=crop",
    isOnSale: true,
    category: "toys"
  },
  {
    id: 6,
    name: "Red Velvet Dress",
    price: 150,
    originalPrice: 200,
    rating: 3,
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=300&fit=crop",
    isOnSale: true,
    category: "fashion"
  },
];

const categories = [
  { id: "all", name: "All", icon: "🛍️" },
  { id: "fashion", name: "Fashion", icon: "👕" },
  { id: "books", name: "Books", icon: "📚" },
  { id: "toys", name: "Toys", icon: "🧸" },
  { id: "electronics", name: "Electronics", icon: "📱" },
];

const sortOptions = [
  { id: "newest", name: "Newest" },
  { id: "price-high-low", name: "Price: High-Low" },
  { id: "price-low-high", name: "Price: Low-High" },
  { id: "discounted", name: "Discounted" },
];

const genderOptions = [
  { id: "all", name: "All" },
  { id: "men", name: "Men" },
  { id: "women", name: "Women" },
  { id: "kids", name: "Kids" },
];

const priceRanges = [
  { id: "all", name: "All" },
  { id: "0-50", name: "0-50" },
  { id: "50-100", name: "50-100" },
  { id: "100-200", name: "100-200" },
];

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "text-orange-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-foreground">Shop App</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>🏠</span>
            <span>/</span>
            <span className="text-orange-500">Shop</span>
          </div>
        </div>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          Shop
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filter By Category */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Filter By Category</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    selectedCategory === category.id
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Sort By */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Sort By</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={selectedSort === option.id ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    selectedSort === option.id
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setSelectedSort(option.id)}
                >
                  {option.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* By Gender */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">By Gender</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {genderOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`gender-${option.id}`}
                    name="gender"
                    checked={selectedGender === option.id}
                    onChange={() => setSelectedGender(option.id)}
                    className="text-orange-500"
                  />
                  <label
                    htmlFor={`gender-${option.id}`}
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    {option.name}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* By Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">By Pricing</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {priceRanges.map((range) => (
                <div key={range.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`price-${range.id}`}
                    name="price"
                    checked={selectedPriceRange === range.id}
                    onChange={() => setSelectedPriceRange(range.id)}
                    className="text-orange-500"
                  />
                  <label
                    htmlFor={`price-${range.id}`}
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    {range.name}
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Products</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button size="icon" variant="ghost" className="bg-white/80 hover:bg-white">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button size="icon" className="bg-blue-500 hover:bg-blue-600 text-white">
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                    {product.isOnSale && (
                      <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600">
                        Sale
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold">${product.price}</span>
                    {product.originalPrice && (
                      <span className="text-muted-foreground line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {renderStars(product.rating)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button variant="default" className="bg-blue-500 hover:bg-blue-600">
              1
            </Button>
            <Button variant="outline">2</Button>
            <Button variant="outline">3</Button>
            <Button variant="outline">
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}