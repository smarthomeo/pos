import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Investment {
  _id: string;
  forexPair: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  profit: number;
  dailyROI: number;
  createdAt: string;
  lastProfitUpdate: string;
}

interface InvestmentHistory {
  date: string;
  amount: number;
  type: string;
  balance: number;
}

interface PortfolioChartProps {
  investments?: Investment[];
  history?: InvestmentHistory[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-KE', {
    style: 'currency',
    currency: 'KES'
  });
};

export default function PortfolioChart({ investments = [], history = [], isLoading = false }: PortfolioChartProps) {
  if (isLoading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <div className="space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const processChartData = (period: 'all' | '7d' | '30d' = 'all') => {
    if (!history.length) return [];

    // Group history by date
    const dailyData = history.reduce((acc: { [key: string]: any }, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          totalEarnings: 0,
          totalInvestments: 0,
          referralEarnings: 0
        };
      }
      
      if (item.type === 'roi_earning') {
        acc[date].totalEarnings += item.amount;
      } else if (item.type === 'investment') {
        acc[date].totalInvestments += item.amount;
      } else if (item.type === 'referral_earning') {
        acc[date].referralEarnings += item.amount;
      }
      
      return acc;
    }, {});

    // Convert to array and sort by date
    let chartData = Object.values(dailyData)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: any) => ({
        ...item,
        date: formatDate(item.date)
      }));

    // Filter based on period
    if (period === '7d') {
      chartData = chartData.slice(-7);
    } else if (period === '30d') {
      chartData = chartData.slice(-30);
    }

    return chartData;
  };

  const chartData = processChartData();
  const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalProfit = investments.reduce((sum, inv) => sum + inv.profit, 0);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Investment</p>
            <p className="text-xl font-bold">{formatCurrency(totalInvestment)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Earnings</p>
            <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <ChartContent data={processChartData('all')} />
          </TabsContent>
          <TabsContent value="30d">
            <ChartContent data={processChartData('30d')} />
          </TabsContent>
          <TabsContent value="7d">
            <ChartContent data={processChartData('7d')} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ChartContentProps {
  data: Array<{
    date: string;
    totalEarnings: number;
    totalInvestments: number;
    referralEarnings: number;
  }>;
}

function ChartContent({ data }: ChartContentProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toLocaleString('en-KE', {
              style: 'currency',
              currency: 'KES',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalInvestments"
            name="Total Investments"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="totalEarnings"
            name="Total Earnings"
            stroke="#16a34a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="referralEarnings"
            name="Referral Earnings"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}