import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

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

function PortfolioChart({ investments = [], history = [], isLoading = false }: PortfolioChartProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES'
    });
  };

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

  const formatDate = (dateString: string, includeTime: boolean = false) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...(includeTime && {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const processChartData = () => {
    if (!history.length) return [];

    // Group history by date
    const dailyData = history.reduce((acc: { [key: string]: any }, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          earnings: 0,
          balance: item.balance
        };
      }
      if (item.type === 'roi_earning') {
        acc[date].earnings += item.amount;
      }
      return acc;
    }, {});

    // Convert to array and sort by date
    const chartData = Object.values(dailyData)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: any) => ({
        ...item,
        date: formatDate(item.date),
        isWeekend: isWeekend(new Date(item.date))
      }));

    return chartData;
  };

  const chartData = processChartData();
  const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalProfit = investments.reduce((sum, inv) => sum + inv.profit, 0);
  const averageROI = investments.length 
    ? (investments.reduce((sum, inv) => sum + inv.dailyROI, 0) / investments.length).toFixed(2)
    : '0.00';

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
            <p className="text-muted-foreground">Total Profit</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalProfit)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Average Daily ROI</p>
            <p className="text-xl font-bold">{averageROI}%</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value: any) => formatCurrency(Number(value))}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              name="Portfolio Value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="earnings"
              name="Daily Earnings"
              stroke="#16a34a"
              strokeWidth={2}
              dot={false}
              strokeDasharray={({ isWeekend }) => isWeekend ? "3 3" : "0"}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default PortfolioChart;