import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/services/api';

// Consider data fresh for 10 seconds
const STALE_TIME = 1000 * 10;

interface Transaction {
  _id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  phone: string;
  username: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending transactions
  const { data: pendingTransactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['adminTransactions'],
    queryFn: async () => {
      const response = await adminApi.getPendingTransactions();
      return response.transactions || [];
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  // Fetch user verifications
  const { data: pendingVerifications = [], isLoading: isVerificationsLoading } = useQuery({
    queryKey: ['adminVerifications'],
    queryFn: async () => {
      const response = await adminApi.getPendingVerifications();
      return response.verifications || [];
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });

  const handleApproveTransaction = async (transactionId: string) => {
    try {
      await adminApi.approveTransaction(transactionId);
      queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
      toast({
        description: 'Transaction approved successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to approve transaction',
      });
    }
  };

  const handleRejectTransaction = async (transactionId: string) => {
    try {
      await adminApi.rejectTransaction(transactionId);
      queryClient.invalidateQueries({ queryKey: ['adminTransactions'] });
      toast({
        description: 'Transaction rejected successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to reject transaction',
      });
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      await adminApi.verifyUser(userId);
      queryClient.invalidateQueries({ queryKey: ['adminVerifications'] });
      toast({
        description: 'User verified successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to verify user',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Pending Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isTransactionsLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : !pendingTransactions.length ? (
                <div className="text-center py-4 text-muted-foreground">
                  No pending transactions
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingTransactions.map((transaction: Transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{transaction.username}</span>
                              <span className="text-sm text-muted-foreground">
                                {transaction.phone}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                          <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                transaction.status === 'pending' 
                                  ? 'default' 
                                  : transaction.status === 'approved' 
                                  ? 'success' 
                                  : 'destructive'
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproveTransaction(transaction._id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectTransaction(transaction._id)}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verifications">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              {isVerificationsLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : !pendingVerifications.length ? (
                <div className="text-center py-4 text-muted-foreground">
                  No pending verifications
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingVerifications.map((user: any) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <span className="font-medium">{user.username}</span>
                          </TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <Badge variant={user.isVerified ? 'success' : 'default'}>
                              {user.isVerified ? 'Verified' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleVerifyUser(user._id)}
                              disabled={user.isVerified}
                            >
                              Verify
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 