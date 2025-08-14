import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  MoreHorizontal,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const salesData = [
  { month: 'Aug', profit: 30, expense: 20 },
  { month: 'Sep', profit: 35, expense: 25 },
  { month: 'Oct', profit: 25, expense: 30 },
  { month: 'Nov', profit: 40, expense: 35 },
  { month: 'Dec', profit: 60, expense: 45 },
  { month: 'Jan', profit: 55, expense: 40 },
  { month: 'Feb', profit: 70, expense: 50 },
  { month: 'Mar', profit: 65, expense: 45 },
  { month: 'Apr', profit: 80, expense: 55 },
];

const productSalesData = [
  { name: 'Modernize', value: 36, color: '#ff9f43' },
  { name: 'Ample', value: 22, color: '#1e88e5' },
  { name: 'Spike', value: 17, color: '#00c851' },
  { name: 'MaterialM', value: 31, color: '#ff5722' },
];

const paymentsData = [
  { day: 'M', value: 20 },
  { day: 'T', value: 35 },
  { day: 'W', value: 45 },
  { day: 'T', value: 25 },
  { day: 'F', value: 60 },
  { day: 'S', value: 40 },
  { day: 'S', value: 30 },
];

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <WelcomeCard />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Sales"
            value="2358"
            change="+23%"
            changeType="positive"
            icon={TrendingUp}
            gradient="primary"
          />
          <StatsCard
            title="Refunds"
            value="434"
            change="-12%"
            changeType="negative"
            icon={ShoppingCart}
            gradient="warning"
          />
          <StatsCard
            title="Earnings"
            value="$245k"
            change="+8%"
            changeType="positive"
            icon={DollarSign}
            gradient="success"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Profit Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Sales Profit</CardTitle>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Profit</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-muted rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Expenses</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div>
                  <div className="flex items-center space-x-1">
                    <ArrowUp className="h-4 w-4 text-success" />
                    <span className="text-2xl font-bold">$63,489.50</span>
                  </div>
                  <p className="text-sm text-muted-foreground">+8% Profit this year</p>
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">$38,496.00</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Profit last year</p>
                </div>
                <Button>View Details</Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Sales Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Product Sales</CardTitle>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productSalesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {productSalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center">
                  <div className="text-2xl font-bold">8364</div>
                  <div className="text-sm text-muted-foreground">Best Seller</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {productSalesData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm">{item.value}% {item.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                This is overview of the sales happened this month for the material website
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Marketing Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm">Google Ads</span>
                </div>
                <span className="font-semibold">+2.9k</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm">Referral</span>
                </div>
                <span className="font-semibold">1.22</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-sm">Organic</span>
                </div>
                <span className="font-semibold">24.3k</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Payments</CardTitle>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">12,389</div>
              <p className="text-sm text-destructive mb-4">-3.8% Last 7 days</p>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentsData}>
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Annual Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <div className="text-2xl font-bold">18.4%</div>
                </div>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesData.slice(-5)}>
                      <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Added to cart: $21,120.70 <span className="text-success">+13.2%</span></span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Reached to checkout: $16,100.00 <span className="text-destructive">-7.4%</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
