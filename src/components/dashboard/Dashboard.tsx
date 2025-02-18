import { useEffect, useState } from 'react';
import { userApi, transactionApi, investmentApi } from '@/services/api';
import BalanceCard from './BalanceCard';
import TransactionTable from './TransactionTable';
import PortfolioChart from './PortfolioChart';
import QuickActions from './QuickActions';
import { useToast } from '@/hooks/use-toast';
import EmptyState from './EmptyState';
import { Skeleton } from "@/components/ui/skeleton";
import PortfolioTable from "./forex/PortfolioTable";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

interface UserData {
  balance: number;
  phone: string;
  referralCode: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

interface Investment {
  _id: string;
  forexPair: string;
  amount: number;
  type: string;
  entryPrice: number;
  currentPrice: number;
  profit: number;
  status: string;
}

interface InvestmentHistory {
  date: string;
  amount: number;
  type: string;
  balance: number;
}

export function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentHistory, setInvestmentHistory] = useState<InvestmentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [userResponse, transactionsResponse, investmentsResponse, historyResponse] = await Promise.all([
          userApi.getProfile(),
          transactionApi.getTransactions(),
          investmentApi.getInvestments(),
          investmentApi.getHistory()
        ]);

        setUserData(userResponse.user);
        setTransactions(transactionsResponse.transactions || []);
        setInvestments(investmentsResponse.investments || []);
        setInvestmentHistory(historyResponse.history || []);
      } catch (error: any) {
        console.error('Dashboard data fetch error:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to load dashboard data',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleClosePosition = async (investmentId: string) => {
    try {
      // Implementation for closing position
      toast({
        title: "Coming Soon",
        description: "Position closing will be available soon!",
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to close position',
      });
    }
  };

  const handleDeposit = () => {
    navigate('/deposit');
  };

  const handleWithdraw = () => {
    if (!userData?.balance || userData.balance <= 0) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: 'Please make a deposit first before withdrawing.',
      });
      return;
    }
    navigate('/withdraw');
  };

  const handleInvest = () => {
    navigate('/forex');
  };

  const handleInvestmentCreated = (newInvestment: any) => {
    // Update investments list
    setInvestments((prevInvestments) => [newInvestment, ...prevInvestments]);
    
    // Update user balance
    if (userData) {
      setUserData({
        ...userData,
        balance: newInvestment.userBalance
      });
    }
    
    // Refresh investment stats
    // fetchInvestmentStats(); // This function is not defined in the provided code
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* User Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Balance Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Balance</h3>
            <p className="text-3xl font-bold text-green-600">
              KES {userData?.balance?.toLocaleString() || "0"}
            </p>
          </div>

          {/* Total Investments Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Invested</h3>
            <p className="text-3xl font-bold text-blue-600">
              KES {investments.reduce((acc, investment) => acc + investment.amount, 0).toLocaleString() || "0"}
            </p>
          </div>

          {/* Total Earnings Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Earnings</h3>
            <p className="text-3xl font-bold text-purple-600">
              KES {investments.reduce((acc, investment) => acc + investment.profit, 0).toLocaleString() || "0"}
            </p>
          </div>

          {/* Referral Earnings Card */}
          <div className="bg-white rounded-lg shadow p-6 cursor-pointer" onClick={handleInvest}>
            <h3 className="text-lg font-medium text-gray-900">Referral Earnings</h3>
            <p className="text-3xl font-bold text-orange-600">
              KES {0}
            </p>
          </div>
        </div>

        {/* Portfolio Chart */}
        <div className="bg-white rounded-lg shadow">
          <PortfolioChart 
            investments={investments} 
            history={investmentHistory}
            isLoading={isLoading} 
          />
        </div>

        {/* Portfolio Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Your Portfolio</h2>
            <Button onClick={handleInvest}>Make Investment</Button>
          </div>
          <PortfolioTable investments={investments} />
        </div>
      </div>
    </div>
  );
}