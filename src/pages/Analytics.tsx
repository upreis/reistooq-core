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

const Analytics = () => {
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
    { name: 'Product A', sales: 4000, profit: 2400 },
    { name: 'Product B', sales: 3000, profit: 1398 },
    { name: 'Product C', sales: 2000, profit: 9800 },
    { name: 'Product D', sales: 2780, profit: 3908 },
    { name: 'Product E', sales: 1890, profit: 4800 },
  ];

  const pieData = [
    { name: 'Desktop', value: 400, color: '#0088FE' },
    { name: 'Mobile', value: 300, color: '#00C49F' },
    { name: 'Tablet', value: 200, color: '#FFBB28' },
    { name: 'Other', value: 100, color: '#FF8042' },
  ];

  const radialData = [
    { name: 'Completed', value: 70, fill: '#10b981' },
    { name: 'In Progress', value: 40, fill: '#f59e0b' },
    { name: 'Pending', value: 30, fill: '#ef4444' },
  ];

  const areaData = [
    { name: 'Jan', users: 1000, sessions: 2400, pageViews: 4000 },
    { name: 'Feb', users: 1200, sessions: 1398, pageViews: 3000 },
    { name: 'Mar', users: 1500, sessions: 9800, pageViews: 2000 },
    { name: 'Apr', users: 1800, sessions: 3908, pageViews: 2780 },
    { name: 'May', users: 2200, sessions: 4800, pageViews: 1890 },
    { name: 'Jun', users: 2500, sessions: 3800, pageViews: 2390 },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>🏠</span>
        <span>/</span>
        <span className="text-primary">Analytics</span>
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#8884d8" />
                <Bar dataKey="profit" fill="#82ca9d" />
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
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData}>
                <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                <Legend />
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="users"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="pageViews"
                  stackId="1"
                  stroke="#ffc658"
                  fill="#ffc658"
                  fillOpacity={0.6}
                />
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
              <span className="text-lg font-bold text-blue-600">2.4k</span>
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
              <span className="text-lg font-bold text-purple-600">8.2%</span>
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
  );
};

export default Analytics;