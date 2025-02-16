import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { referralApi } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferralRecord {
  id: string;
  username: string;
  phone: string;
  joinedAt: string;
  isActive: boolean;
  referralCount: number;
  earnings: number;
}

export function ReferralTable() {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await referralApi.getHistory();
        console.log('Referral history response:', response);
        setReferrals(response.referrals || []);
      } catch (err: any) {
        console.error('Referral history error:', err);
        setError(err.message || 'Failed to load referral history');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load referral history',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Referral History</h3>
        <div className="rounded-md border">
          <div className="p-4 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Referral History</h3>
        <div className="rounded-md border p-4 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!referrals || referrals.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Referral History</h3>
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">No referral history yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Share your referral code to start earning rewards!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Referral History</h3>
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">Date</TableHead>
                <TableHead className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">Username</TableHead>
                <TableHead className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">Phone</TableHead>
                <TableHead className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">Status</TableHead>
                <TableHead className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">Referrals</TableHead>
                <TableHead className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">
                    {new Date(referral.joinedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">
                    {referral.username}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">
                    {referral.phone}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">
                    <Badge 
                      variant={referral.isActive ? "default" : "secondary"}
                      className="text-xs px-2 py-0.5"
                    >
                      {referral.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">
                    {referral.referralCount}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs sm:text-sm py-2 sm:py-3">
                    <span className="font-medium">
                      KES {referral.earnings.toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}