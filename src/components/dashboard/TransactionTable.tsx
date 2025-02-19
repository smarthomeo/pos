import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

function TransactionTable({ transactions }: TransactionTableProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'pending':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const formattedAmount = Math.abs(amount).toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES'
    });
    
    return (
      <div className="flex items-center">
        {type === 'deposit' || type === 'profit' ? (
          <ArrowUpIcon className="w-4 h-4 mr-1 text-green-500" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 mr-1 text-red-500" />
        )}
        {formattedAmount}
      </div>
    );
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

  if (!transactions.length) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Type</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Amount</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Status</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm hidden md:table-cell">Description</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell className="font-medium capitalize whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4">
                  {transaction.type}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4">
                  {formatAmount(transaction.amount, transaction.type)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4">
                  <Badge 
                    className={`${getStatusColor(transaction.status)} border`}
                    variant="outline"
                  >
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4 hidden md:table-cell">
                  <span className="block truncate max-w-[200px]" title={transaction.description}>
                    {transaction.description}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-4">
                  {formatDate(transaction.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default TransactionTable;