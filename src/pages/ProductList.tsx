import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ProductList = () => {
  const products = [
    {
      id: 1,
      name: "Cute Soft Teddybear",
      category: "toys",
      image: "/placeholder.svg",
      date: "Wed, Aug 13 2025",
      status: "In Stock",
      price: "$285"
    },
    {
      id: 2,
      name: "MacBook Air Pro",
      category: "electronics",
      image: "/placeholder.svg",
      date: "Tue, Aug 12 2025",
      status: "Out of Stock",
      price: "$650"
    },
    {
      id: 3,
      name: "Gaming Console",
      category: "electronics",
      image: "/placeholder.svg",
      date: "Tue, Aug 12 2025",
      status: "In Stock",
      price: "$25"
    },
    {
      id: 4,
      name: "Boat Headphone",
      category: "electronics",
      image: "/placeholder.svg",
      date: "Sun, Aug 10 2025",
      status: "In Stock",
      price: "$50"
    },
    {
      id: 5,
      name: "Toy Dino for Fun",
      category: "toys",
      image: "/placeholder.svg",
      date: "Fri, Aug 8 2025",
      status: "In Stock",
      price: "$210"
    },
    {
      id: 6,
      name: "Red Velvet Dress",
      category: "fashion",
      image: "/placeholder.svg",
      date: "Fri, Aug 8 2025",
      status: "In Stock",
      price: "$150"
    },
    {
      id: 7,
      name: "Shoes for Girls",
      category: "fashion",
      image: "/placeholder.svg",
      date: "Thu, Aug 7 2025",
      status: "In Stock",
      price: "$320"
    }
  ];

  return (
    <div className="space-y-6 p-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Product list</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product list</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search Products" className="pl-10" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 py-3 px-4 bg-muted/50 rounded-lg mb-4 text-sm font-medium">
              <div>Products</div>
              <div>Date</div>
              <div>Status</div>
              <div>Price</div>
              <div>Action</div>
              <div></div>
            </div>

            {/* Product List */}
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-6 gap-4 py-4 px-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  {/* Product */}
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <img src={product.image} alt={product.name} className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center text-sm text-muted-foreground">
                    {product.date}
                  </div>

                  {/* Status */}
                  <div className="flex items-center">
                    <Badge
                      variant={product.status === "In Stock" ? "default" : "destructive"}
                      className={
                        product.status === "In Stock"
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                      }
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        product.status === "In Stock" ? "bg-emerald-500" : "bg-red-500"
                      }`} />
                      {product.status}
                    </Badge>
                  </div>

                  {/* Price */}
                  <div className="flex items-center font-medium">
                    {product.price}
                  </div>

                  {/* Action */}
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default ProductList;