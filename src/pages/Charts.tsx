import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

const Charts = () => {
  const lineData = [
    { name: 'Jan', sales: 4000, profit: 2400, expenses: 1600 },
    { name: 'Feb', sales: 3000, profit: 1398, expenses: 1602 },
    { name: 'Mar', sales: 2000, profit: 9800, expenses: 800 },
    { name: 'Apr', sales: 2780, profit: 3908, expenses: 1128 },
    { name: 'May', sales: 1890, profit: 4800, expenses: 1090 },
    { name: 'Jun', sales: 2390, profit: 3800, expenses: 1290 },
    { name: 'Jul', sales: 3490, profit: 4300, expenses: 1190 },
  ];

  const barData = [
    { name: 'Product A', sales: 120, target: 100 },
    { name: 'Product B', sales: 98, target: 110 },
    { name: 'Product C', sales: 145, target: 130 },
    { name: 'Product D', sales: 87, target: 90 },
    { name: 'Product E', sales: 156, target: 140 },
    { name: 'Product F', sales: 112, target: 100 },
  ];

  const pieData = [
    { name: 'Desktop', value: 400, color: '#3b82f6' },
    { name: 'Mobile', value: 300, color: '#10b981' },
    { name: 'Tablet', value: 200, color: '#f59e0b' },
    { name: 'Other', value: 100, color: '#ef4444' },
  ];

  const radialData = [
    { name: 'Completed', value: 75, fill: '#3b82f6' },
    { name: 'In Progress', value: 50, fill: '#10b981' },
    { name: 'Pending', value: 25, fill: '#f59e0b' },
  ];

  const areaData = [
    { name: 'Week 1', users: 1000, sessions: 1200 },
    { name: 'Week 2', users: 1500, sessions: 1800 },
    { name: 'Week 3', users: 1200, sessions: 1400 },
    { name: 'Week 4', users: 1800, sessions: 2200 },
    { name: 'Week 5', users: 2200, sessions: 2800 },
    { name: 'Week 6', users: 2000, sessions: 2500 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>🏠</span>
          <span>/</span>
          <span className="text-primary">Charts</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radial Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={radialData}>
                  <RadialBar
                    label={{ position: 'insideStart', fill: 'white' }}
                    background
                    dataKey="value"
                  />
                  <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Area Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>User Engagement Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Mini Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mini Line Chart */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Revenue Trend</span>
                <span className="text-lg font-bold text-green-600">+12%</span>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <LineChart data={lineData.slice(0, 4)}>
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mini Bar Chart */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monthly Sales</span>
                <span className="text-lg font-bold text-blue-600">$45K</span>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <BarChart data={barData.slice(0, 4)}>
                  <Bar dataKey="sales" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mini Area Chart */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">User Growth</span>
                <span className="text-lg font-bold text-purple-600">2.4K</span>
              </div>
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={areaData.slice(0, 4)}>
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Charts;