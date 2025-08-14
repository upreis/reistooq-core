import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Heart, ShoppingCart, Plus, Minus } from "lucide-react";
import { useState } from "react";

const ProductDetail = () => {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("red");

  const productImages = [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg"
  ];

  return (
    <div className="space-y-6 p-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Shop Detail</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <img 
                src="/placeholder.svg" 
                alt="Product" 
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="grid grid-cols-6 gap-2">
              {productImages.map((image, index) => (
                <div key={index} className="aspect-square bg-muted rounded border-2 border-primary/20 hover:border-primary cursor-pointer">
                  <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                In Stock
              </Badge>
              <Badge className="ml-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                fashion
              </Badge>
            </div>

            <h1 className="text-3xl font-bold">Derma-E</h1>
            
            <p className="text-muted-foreground">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do arcu, tincidunt 
              bibendum felis.
            </p>

            <div className="flex items-center space-x-4">
              <span className="text-2xl font-bold text-primary">$125</span>
              <span className="text-lg text-muted-foreground line-through">$197</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(236 reviews)</span>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Colors:</label>
              <div className="flex space-x-2">
                {["red", "blue", "green"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? "border-primary" : "border-muted"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">QTY:</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="px-4 py-2 border rounded text-center min-w-[60px]">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button className="flex-1">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy now
              </Button>
              <Button variant="destructive" className="flex-1">
                <Heart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Dispatched in 2-3 weeks</p>
              <p className="font-medium text-foreground">Why the longer time for delivery?</p>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="space-y-4 mt-6">
                <p>
                  Sed at diam elit. Vivamus tortor odio, pellentesque eu tincidunt a, aliquet sit amet lorem pellentesque eu tincidunt a, aliquet sit 
                  amet lorem.
                </p>
                <p className="text-muted-foreground">
                  Cras eget elit semper, congue sapien id, pellentesque diam. Nulla faucibus diam nec fermentum ullamcorper. Praesent sed ipsum ut augue vestibulum malesuada. 
                  Duis vitae volutpat odio. Integer sit amet elit ac justo sagittis dignissim.
                </p>
              </TabsContent>
              <TabsContent value="reviews" className="space-y-4 mt-6">
                <p>Reviews content would go here...</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
};

export default ProductDetail;