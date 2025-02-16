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
  createdAt: string;
}

interface PortfolioChartProps {
  investments?: Investment[];
  isLoading?: boolean;
}

function PortfolioChart({ investments = [], isLoading = false }: PortfolioChartProps) {
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
        timeZone: 'Africa/Nairobi',
        ...(includeTime ? {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        } : {
          month: 'short',
          day: 'numeric'
        })
      };

      return new Intl.DateTimeFormat('en-KE', options).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  // Transform investment data for the chart
  const chartData = investments.map(inv => ({
    date: inv.createdAt,
    formattedDate: formatDate(inv.createdAt),
    value: inv.amount + inv.profit,
    profit: inv.profit
  }));

  const totalValue = investments.reduce((sum, inv) => sum + inv.amount + inv.profit, 0);
  const totalProfit = investments.reduce((sum, inv) => sum + inv.profit, 0);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Portfolio Performance</CardTitle>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Value</p>
            <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Profit/Loss</p>
            <p className={`text-lg sm:text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] overflow-hidden">
        {investments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-sm sm:text-base text-muted-foreground">No investments yet</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">Start investing to see your portfolio performance</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => formatDate(value)}
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
                width={60}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Value']}
                labelFormatter={(label) => {
                  if (typeof label === 'string') {
                    return formatDate(label, true);
                  }
                  return 'N/A';
                }}
                contentStyle={{
                  fontSize: '12px',
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <Line 
                type="monotone"
                dataKey="value"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default PortfolioChart;