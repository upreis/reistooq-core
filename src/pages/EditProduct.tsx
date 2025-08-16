
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";

const EditProduct = () => {
  return (
    <>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Edit Product</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Information */}
            <Card>
              <CardHeader>
                <CardTitle>General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input id="productName" defaultValue="Derma-E Vitamin C Daily Cleansing Paste" />
                  <p className="text-sm text-muted-foreground">
                    A product name is required and recommended to be unique.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="border rounded-lg">
                    <div className="flex items-center space-x-2 p-3 border-b bg-muted/50">
                      <Button variant="ghost" size="sm">B</Button>
                      <Button variant="ghost" size="sm">I</Button>
                      <Button variant="ghost" size="sm">U</Button>
                      <Button variant="ghost" size="sm">H1</Button>
                      <Button variant="ghost" size="sm">H2</Button>
                      <Button variant="ghost" size="sm">H3</Button>
                    </div>
                    <Textarea 
                      className="border-0 min-h-[100px]" 
                      defaultValue="This gentle daily cleanser effectively removes makeup, dirt, and impurities while nourishing the skin with Vitamin C."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Output</Label>
                  <div className="p-3 border rounded-lg bg-muted/50 text-sm">
                    This gentle daily cleanser effectively removes makeup, dirt, and impurities while nourishing the skin with Vitamin C.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media */}
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <img src="/placeholder.svg" alt="Product" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center aspect-square flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Add Image</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Thumbnail */}
            <Card>
              <CardHeader>
                <CardTitle>Thumbnail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-2">
                  <img src="/placeholder.svg" alt="Thumbnail" className="w-full h-full object-cover rounded-lg" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Set the product thumbnail image. Only *.png, *.jpg and *.jpeg image files are accepted
                </p>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Status</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tax Class *</Label>
                  <Select defaultValue="publish">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publish">Publish</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Set the product status.</p>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Categories *</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="secondary">Fashion</Badge>
                    <Badge variant="secondary">Beauty</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="text-primary">
                    + Add selected category
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline">skincare</Badge>
                    <Badge variant="outline">vitamin-c</Badge>
                    <Badge variant="outline">cleanser</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full">Update Product</Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProduct;