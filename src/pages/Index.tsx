import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <WelcomeCard />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-pink-100 to-pink-200 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sales</p>
                <p className="text-2xl font-bold text-gray-900">2358</p>
                <p className="text-xs text-green-600">+23%</p>
              </div>
              <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-100 to-purple-200 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Refunds</p>
                <p className="text-2xl font-bold text-gray-900">434</p>
                <p className="text-xs text-red-600">-12%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-emerald-100 to-emerald-200 border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">$245k</p>
                <p className="text-xs text-green-600">+8%</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Sales Profit</CardTitle>
                <div className="flex gap-4 mt-2">
                  <span className="text-sm text-muted-foreground">Profit</span>
                  <span className="text-sm text-muted-foreground">Expenses</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sales chart visualization</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div>
                    <div className="text-2xl font-bold">$63,489.50</div>
                    <div className="text-sm text-green-600">+8% Profit this year</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">$38,496.00</div>
                    <div className="text-sm text-muted-foreground">Profit last year</div>
                  </div>
                </div>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Sales Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full border-8 border-gray-200 relative">
                    {/* Donut chart simulation */}
                    <div className="absolute inset-0 rounded-full border-8 border-orange-500" style={{
                      background: `conic-gradient(
                        #f97316 0deg 130deg,
                        #3b82f6 130deg 210deg,
                        #8b5cf6 210deg 290deg,
                        #ef4444 290deg 360deg
                      )`,
                      WebkitMask: 'radial-gradient(circle at center, transparent 40%, black 41%)',
                      mask: 'radial-gradient(circle at center, transparent 40%, black 41%)'
                    }}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold">8364</div>
                        <div className="text-sm text-green-600">✓ Best Seller</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">36% Modernize</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm">17% Spike</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">22% Ample</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">31% MaterialM</span>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">
                This is overview of the sales happened this month for the material website
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Marketing Report */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Marketing Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Google Ads</p>
                    <p className="text-lg font-bold">+2.9k</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Referral</p>
                    <p className="text-lg font-bold">1.22</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Organic</p>
                    <p className="text-lg font-bold">24.3K</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">Learn insigs how to manage</p>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 rounded-full w-8 h-8">
                  <span className="text-xs">▶</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold">12,389</div>
                <div className="text-sm text-red-600">-3.8%</div>
                <div className="text-xs text-muted-foreground">Last 7 days</div>
              </div>
              
              {/* Bar chart simulation */}
              <div className="flex items-end justify-center gap-1 h-20 mb-4">
                {[40, 60, 35, 80, 45, 90, 55].map((height, i) => (
                  <div key={i} className="bg-orange-500 w-6 rounded-t" style={{height: `${height}%`}}></div>
                ))}
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground mb-4">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Paypal</span>
                  </div>
                  <span className="text-sm">52%</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm">Credit Card</span>
                  </div>
                  <span className="text-sm">48%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Annual Profit */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Annual Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="text-sm text-muted-foreground">Conversion Rate</div>
                <div className="text-2xl font-bold">18.4%</div>
              </div>
              
              {/* Wave chart simulation */}
              <div className="h-20 flex items-end justify-center mb-4">
                <svg viewBox="0 0 200 50" className="w-full h-full">
                  <path d="M 0 25 Q 50 10 100 25 T 200 25" stroke="#f97316" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Added to Cart</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">$21,120.70</div>
                    <div className="text-xs text-green-600">+13.2%</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">5 clicks</div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reached to Checkout</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">$16,100.00</div>
                    <div className="text-xs text-red-600">-7.4%</div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">12 clicks</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Package className="w-6 h-6" />
                <span>Adicionar Produto</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <ShoppingCart className="w-6 h-6" />
                <span>Novo Pedido</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <Users className="w-6 h-6" />
                <span>Relatório de Vendas</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Index;
