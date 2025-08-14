import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Share2, ShoppingCart, TrendingUp, Users, Eye } from "lucide-react";

const Cards = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Cards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Product Card */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-gradient-to-r from-purple-400 to-pink-400 relative">
              <div className="absolute top-4 left-4">
                <Badge>NEW</Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Wireless Headphones</h3>
              <div className="flex items-center space-x-1 mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(124)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-x-2">
                  <span className="text-lg font-bold">$89.99</span>
                  <span className="text-sm text-muted-foreground line-through">$120.00</span>
                </div>
                <Button size="sm">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold">$45,231</p>
                  <div className="flex items-center text-green-600 text-sm mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12.5% from last month
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Card */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                JD
              </div>
              <h3 className="font-semibold mb-1">John Doe</h3>
              <p className="text-sm text-muted-foreground mb-4">Product Designer</p>
              <div className="flex justify-center space-x-4 mb-4">
                <div className="text-center">
                  <p className="font-bold">120</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">1.2k</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">540</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" className="flex-1">Follow</Button>
                <Button size="sm" variant="outline" className="flex-1">Message</Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Card */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Website Analytics</h3>
                <Eye className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Page Views</span>
                  <span className="font-semibold">24,567</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Unique Visitors</span>
                  <span className="font-semibold">12,345</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-90">Bounce Rate</span>
                  <span className="font-semibold">24.5%</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-white/20 hover:bg-white/30 border-0">
                View Details
              </Button>
            </CardContent>
          </Card>

          {/* Social Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div>
                  <h4 className="font-semibold">Alex Johnson</h4>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <p className="text-sm mb-4">
                Just finished working on an amazing new project! Can't wait to share the results with everyone. 🚀
              </p>
              <div className="aspect-video bg-gradient-to-r from-orange-400 to-red-400 rounded-lg mb-4"></div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Heart className="w-4 h-4 mr-2" />
                  24 Likes
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Feature Card */}
          <Card className="border-2 border-dashed border-primary">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Invite team members and collaborate on projects in real-time.
              </p>
              <Button>Get Started</Button>
            </CardContent>
          </Card>
        </div>

        {/* Large Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 text-white overflow-hidden">
            <CardContent className="p-8 relative">
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/10 rounded-full"></div>
              <h3 className="text-2xl font-bold mb-2">Premium Features</h3>
              <p className="text-lg opacity-90 mb-6">
                Unlock advanced analytics, unlimited projects, and priority support.
              </p>
              <Button className="bg-white text-purple-600 hover:bg-white/90">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-16 flex-col">
                  <ShoppingCart className="w-6 h-6 mb-2" />
                  New Order
                </Button>
                <Button variant="outline" className="h-16 flex-col">
                  <Users className="w-6 h-6 mb-2" />
                  Add User
                </Button>
                <Button variant="outline" className="h-16 flex-col">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  Analytics
                </Button>
                <Button variant="outline" className="h-16 flex-col">
                  <Eye className="w-6 h-6 mb-2" />
                  Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Cards;