import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Investment {
  _id: string;
  forexPair: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  profit: number;
  status: string;
  createdAt: string;
}

interface PortfolioTableProps {
  investments?: Investment[];
  isLoading?: boolean;
  onClosePosition?: (investmentId: string) => void;
}

export default function PortfolioTable({ 
  investments = [], 
  isLoading = false,
  onClosePosition 
}: PortfolioTableProps) {
  const { toast } = useToast();
  console.log('PortfolioTable investments:', investments);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES'
    });
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      return new Intl.DateTimeFormat('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Nairobi'
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Forex Pair</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Entry Price</TableHead>
              <TableHead>Current Price</TableHead>
              <TableHead>Profit/Loss</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  console.log('Rendering portfolio table with investments:', investments);
  
  if (!investments || !investments.length) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No active investments</p>
        <p className="text-sm text-muted-foreground mt-1">Start investing to see your portfolio here</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Forex Pair</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Amount</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm hidden md:table-cell">Entry Price</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm hidden md:table-cell">Current Price</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Profit/Loss</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Status</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm hidden sm:table-cell">Date</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.map((investment) => (
              <TableRow key={investment._id || investment.id}>
                <TableCell className="font-medium whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4">
                  {investment.forexPair}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4">
                  {formatCurrency(investment.amount)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4 hidden md:table-cell">
                  {investment.entryPrice.toFixed(4)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4 hidden md:table-cell">
                  {investment.currentPrice.toFixed(4)}
                </TableCell>
                <TableCell className={`whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4 ${investment.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {formatCurrency(investment.profit)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4">
                  <Badge 
                    variant={investment.status === 'open' ? 'default' : 'secondary'}
                    className="text-xs whitespace-nowrap px-2 py-0.5"
                  >
                    {investment.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4 hidden sm:table-cell">
                  {formatDate(investment.createdAt)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4">
                  {investment.status === 'open' && onClosePosition && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                      onClick={() => onClosePosition(investment._id)}
                    >
                      Close
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}