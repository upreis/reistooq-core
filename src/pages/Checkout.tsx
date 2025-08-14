import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Checkout = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Checkout</span>
        </div>

        {/* Checkout Steps */}
        <div className="flex items-center justify-center space-x-8 mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="text-sm font-medium text-primary">Cart</span>
          </div>
          <div className="w-16 h-px bg-muted"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-sm text-muted-foreground">Billing & address</span>
          </div>
          <div className="w-16 h-px bg-muted"></div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="text-sm text-muted-foreground">Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground">
                  <div>Product</div>
                  <div className="text-center">Quantity</div>
                  <div className="text-right">Price</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  No items in cart
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Sub Total</span>
                  <span>$0</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Discount 5%</span>
                  <span>-$0</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>$0</span>
                  </div>
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button variant="outline" className="flex-1">
                    Previous
                  </Button>
                  <Button className="flex-1">
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Checkout;