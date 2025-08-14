import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload } from "lucide-react";

const AddProduct = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Add Product</span>
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
                  <Input id="productName" placeholder="Product Name" />
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
                      placeholder="Start typing..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Output</Label>
                  <div className="p-3 border rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    Set a description to the product for better visibility.
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
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
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
                <div className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center bg-primary/5">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-primary">Drop Thumbnail here to upload</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Publish" />
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
                  <div className="border rounded-lg p-3 text-sm text-muted-foreground">
                    Add product to a category.
                  </div>
                  <Button variant="outline" size="sm" className="text-primary">
                    + Add selected category
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="border rounded-lg p-3 text-sm text-muted-foreground">
                    Add tags for product.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full">Save Product</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddProduct;