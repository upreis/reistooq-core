import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Star, TrendingUp, Users, Zap } from "lucide-react";

const Banners = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Banners</span>
        </div>

        <div className="space-y-6">
          {/* Hero Banner */}
          <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
            <CardContent className="p-8 relative">
              {/* Background decoration */}
              <div className="absolute top-8 right-8 w-32 h-32 bg-white/10 rounded-full"></div>
              <div className="absolute bottom-4 right-16 w-16 h-16 bg-white/10 rounded-full"></div>
              <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-white/10 rounded-full"></div>
              
              <div className="relative z-10 max-w-2xl">
                <Badge className="bg-white/20 text-white hover:bg-white/30 mb-4">
                  ⚡ New Feature
                </Badge>
                <h1 className="text-4xl font-bold mb-4">
                  Transform Your Business with Advanced Analytics
                </h1>
                <p className="text-xl opacity-90 mb-6">
                  Get real-time insights, predictive analytics, and actionable data to drive your business forward.
                </p>
                <div className="flex space-x-4">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    <Play className="w-4 h-4 mr-2" />
                    Watch Demo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Banners Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Banner */}
            <Card className="bg-gradient-to-br from-green-400 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8" />
                  <Badge className="bg-white/20 text-white">+25%</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2">Performance Boost</h3>
                <p className="opacity-90 mb-4">
                  Experience 25% faster load times with our optimized infrastructure.
                </p>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            {/* Team Banner */}
            <Card className="bg-gradient-to-br from-orange-400 to-red-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8" />
                  <Badge className="bg-white/20 text-white">1000+</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2">Join Our Community</h3>
                <p className="opacity-90 mb-4">
                  Connect with over 1000 professionals in our growing community.
                </p>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Join Now
                </Button>
              </CardContent>
            </Card>

            {/* Premium Banner */}
            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Star className="w-8 h-8" />
                  <Badge className="bg-white/20 text-white">Premium</Badge>
                </div>
                <h3 className="text-xl font-bold mb-2">Go Premium</h3>
                <p className="opacity-90 mb-4">
                  Unlock advanced features and priority support with Premium.
                </p>
                <Button variant="outline" className="border-white text-white hover:bg-white/10">
                  Upgrade
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Promotional Banners */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sale Banner */}
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white overflow-hidden">
              <CardContent className="p-6 relative">
                <div className="absolute top-4 right-4 text-6xl opacity-20">🔥</div>
                <Badge className="bg-red-500 text-white mb-3">
                  Limited Time
                </Badge>
                <h2 className="text-2xl font-bold mb-2">Summer Sale!</h2>
                <p className="text-lg mb-4">Get up to 50% off on all premium plans</p>
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold">50% OFF</div>
                  <Button className="bg-white text-orange-500 hover:bg-white/90">
                    Claim Offer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Banner */}
            <Card className="bg-gradient-to-r from-teal-400 to-blue-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
                    <p className="opacity-90 mb-4">
                      Subscribe to our newsletter for the latest updates and insights.
                    </p>
                    <div className="flex space-x-2">
                      <input 
                        type="email" 
                        placeholder="Enter your email"
                        className="flex-1 px-3 py-2 rounded bg-white/20 placeholder-white/70 text-white border-0"
                      />
                      <Button className="bg-white text-teal-500 hover:bg-white/90">
                        Subscribe
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Banner */}
          <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl opacity-90 mb-6 max-w-2xl mx-auto">
                Join thousands of satisfied customers who have transformed their business with our platform.
              </p>
              <div className="flex justify-center space-x-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Contact Sales
                </Button>
              </div>
              <div className="flex justify-center items-center space-x-8 mt-8 opacity-60">
                <div className="text-sm">✓ No credit card required</div>
                <div className="text-sm">✓ 14-day free trial</div>
                <div className="text-sm">✓ Cancel anytime</div>
              </div>
            </CardContent>
          </Card>

          {/* Image Banner */}
          <Card className="overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative flex items-center justify-center">
              <div className="text-center text-white">
                <h3 className="text-2xl font-bold mb-2">Beautiful Design Meets Functionality</h3>
                <p className="text-lg opacity-90">Crafted with attention to detail and user experience</p>
              </div>
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">Modern Interface</h4>
                  <p className="text-sm text-muted-foreground">
                    Clean, intuitive design that your users will love
                  </p>
                </div>
                <Button>
                  Explore
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Banners;