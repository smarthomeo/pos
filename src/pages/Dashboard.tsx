import { useEffect, useState } from 'react';
import { userApi, transactionApi, investmentApi, referralApi } from '@/services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BalanceCard from '@/components/dashboard/BalanceCard';
import TransactionTable from '@/components/dashboard/TransactionTable';
import PortfolioChart from '@/components/dashboard/PortfolioChart';
import DepositModal from "@/components/dashboard/DepositModal";import { WithdrawModal } from '@/components/dashboard/WithdrawModal';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PortfolioTable from '@/components/dashboard/forex/PortfolioTable';

// Consider data fresh for 10 seconds
const STALE_TIME = 1000 * 10;

export default function Dashboard() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => userApi.getProfile(),
    select: (data) => data.user,
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  // Fetch investments
  const { data: investments = [], isLoading: isInvestmentsLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: async () => {
      const response = await investmentApi.getInvestments();
      return response.investments || [];
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  // Fetch investment history
  const { data: investmentHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['investmentHistory'],
    queryFn: async () => {
      const response = await investmentApi.getHistory();
      return response.history || [];
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await transactionApi.getTransactions();
      return response.transactions || [];
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  // Fetch referral stats
  const { data: referralStats = { earnings: { total: 0 } } } = useQuery({
    queryKey: ['referralStats'],
    queryFn: async () => {
      const response = await referralApi.getStats();
      return response;
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  // Function to manually refresh data
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
    queryClient.invalidateQueries({ queryKey: ['investments'] });
    queryClient.invalidateQueries({ queryKey: ['investmentHistory'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const handleModalClose = () => {
    refreshData();
  };

  const isLoading = isUserLoading || isInvestmentsLoading || isHistoryLoading || isTransactionsLoading;

  const totalInvested = investments.reduce((acc: number, inv: any) => acc + inv.amount, 0);
  const totalEarnings = investments.reduce((acc: number, inv: any) => acc + inv.profit, 0);
  const referralEarnings = referralStats.earnings.total || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Balance Card */}
          <Card className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold text-primary mt-1">
                KES {userData?.balance?.toLocaleString() || "0"}
              </p>
            </div>
          </Card>

          {/* Total Invested Card */}
          <Card className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                KES {totalInvested.toLocaleString()}
              </p>
            </div>
          </Card>

          {/* Total Earnings Card */}
          <Card className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
              <p className={`text-2xl font-bold ${totalEarnings >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                KES {totalEarnings.toLocaleString()}
              </p>
            </div>
          </Card>

          {/* Referral Earnings Card */}
          <Card className="p-6">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-muted-foreground">Referral Earnings</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                KES {referralEarnings.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button 
            size="lg"
            className="flex-1 max-w-[200px]"
            onClick={() => setShowDepositModal(true)}
          >
            Deposit
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="flex-1 max-w-[200px]"
            onClick={() => setShowWithdrawModal(true)}
          >
            Withdraw
          </Button>
        </div>

        {/* Portfolio Chart */}
        <Card className="p-6">
          <PortfolioChart 
            investments={investments} 
            history={investmentHistory}
            isLoading={isLoading} 
          />
        </Card>

        {/* Portfolio Table */}
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Your Portfolio</h2>
          <PortfolioTable investments={investments} isLoading={isLoading} />
        </Card>

        {/* Transaction History */}
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">Recent Transactions</h2>
          <TransactionTable transactions={transactions} />
        </Card>
      </div>

      {/* Modals */}
      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => {
          setShowDepositModal(false);
          handleModalClose();
        }} 
      />
      
      <WithdrawModal 
        isOpen={showWithdrawModal}
        onClose={() => {
          setShowWithdrawModal(false);
          handleModalClose();
        }}
        userBalance={userData?.balance || 0}
        userPhone={userData?.phone || ''}
      />
    </div>
  );
}