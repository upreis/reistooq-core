import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, DollarSign, Eye, MoreVertical } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const CRM = () => {
  const lineChartData = [
    { name: 'Jan', orders: 400, expenses: 200 },
    { name: 'Feb', orders: 300, expenses: 250 },
    { name: 'Mar', orders: 550, expenses: 300 },
    { name: 'Apr', orders: 600, expenses: 280 },
    { name: 'May', orders: 650, expenses: 350 },
    { name: 'Jun', orders: 450, expenses: 300 },
    { name: 'Jul', orders: 350, expenses: 250 },
  ];

  const barChartData = [
    { name: 'JAN', value: 40 },
    { name: 'FEB', value: 60 },
    { name: 'MAR', value: 80 },
    { name: 'APR', value: 100 },
    { name: 'MAY', value: 85 },
    { name: 'JUN', value: 65 },
  ];

  const pieChartData = [
    { name: 'Completed', value: 75, color: '#10b981' },
    { name: 'Remaining', value: 25, color: '#e5e7eb' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
                  <p className="text-2xl font-bold">$14,673</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Profit</p>
                  <p className="text-2xl font-bold">$9,281</p>
                </div>
                <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                  <p className="text-2xl font-bold">45.1k</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Expense</p>
                  <p className="text-2xl font-bold">$4,673</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overall Balance */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Overall Balance</CardTitle>
                    <div className="flex items-center space-x-4 mt-2">
                      <Button variant="outline" size="sm">Orders</Button>
                      <Button variant="ghost" size="sm">Expenses</Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">$2,538,942</p>
                    <div className="flex items-center text-emerald-600 text-sm">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      16.3% last 12 months
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#e5e7eb" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Return On Investment */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Return On Investment</CardTitle>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-3xl font-bold">283%</p>
                    <p className="text-sm text-muted-foreground">ROI</p>
                  </div>
                  <div className="flex items-center justify-center text-emerald-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+24% January</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barChartData}>
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total followers */}
          <Card className="bg-pink-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span>Total followers</span>
                </CardTitle>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">4,562</p>
                  <div className="flex items-center text-pink-600 text-sm mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +23% last month
                  </div>
                </div>
                <ResponsiveContainer width={80} height={60}>
                  <BarChart data={barChartData.slice(0, 4)}>
                    <Bar dataKey="value" fill="#ec4899" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Total Income */}
          <Card className="bg-purple-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span>Total Income</span>
                </CardTitle>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">$6,280</p>
                  <div className="flex items-center text-purple-600 text-sm mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +18% last month
                  </div>
                </div>
                <ResponsiveContainer width={80} height={60}>
                  <LineChart data={lineChartData.slice(0, 4)}>
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Current Balance */}
          <Card className="bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span>Current Balance</span>
                </CardTitle>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">$2,529</p>
                  <div className="flex items-center text-green-600 text-sm mt-1">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +42% last month
                  </div>
                </div>
                <ResponsiveContainer width={80} height={60}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={30}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Marketing Report */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Marketing Report</CardTitle>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-pink-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Search Volume</p>
                  <p className="text-xl font-bold">+2.9k</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Return Ratio</p>
                  <p className="text-xl font-bold">1.22</p>
                </div>
                <ResponsiveContainer width={100} height={50}>
                  <PieChart>
                    <Pie
                      data={[{ value: 75 }, { value: 25 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={25}
                      dataKey="value"
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center">
                <p className="text-4xl font-bold">275</p>
                <p className="text-sm text-muted-foreground">
                  Learn insights how to manage all aspects of your startup.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Methods</CardTitle>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visa Card */}
              <div className="bg-gray-900 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg">•••• 8942</span>
                  <span className="font-bold">VISA</span>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Balance</p>
                  <p className="text-2xl font-bold">$26,561.50</p>
                </div>
              </div>

              {/* Mastercard */}
              <div className="bg-gray-100 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg">•••• 8942</span>
                  <div className="flex space-x-1">
                    <div className="w-6 h-6 bg-red-500 rounded-full opacity-80"></div>
                    <div className="w-6 h-6 bg-yellow-500 rounded-full -ml-3"></div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Balance</p>
                  <p className="text-2xl font-bold">$26,561.50</p>
                </div>
              </div>

              {/* Transactions */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Transactions</span>
                <Button variant="link" className="text-primary">See All</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CRM;