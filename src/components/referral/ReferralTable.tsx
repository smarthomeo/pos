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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";

interface ReferralRecord {
  _id: string;
  username: string;
  phone: string;
  joinedAt: string;
  isActive: boolean;
  referralCount: number;
  level: number;
  earnings: {
    oneTimeRewards: number;
    dailyCommissions: number;
    total: number;
  };
}

// Consider data fresh for 10 seconds
const STALE_TIME = 1000 * 10;

export function ReferralTable() {
  const { toast } = useToast();

  const { data: referrals = [], isLoading, error } = useQuery({
    queryKey: ['referralHistory'],
    queryFn: async () => {
      const response = await referralApi.getHistory();
      if (response && Array.isArray(response.referrals)) {
        return response.referrals.map((ref: any) => ({
          _id: ref._id || ref.id,
          username: ref.username || '',
          phone: ref.phone || '',
          joinedAt: ref.joinedAt || new Date().toISOString(),
          isActive: ref.isActive || false,
          referralCount: ref.referralCount || 0,
          level: ref.level || 1,
          earnings: {
            oneTimeRewards: ref.earnings?.oneTimeRewards || 0,
            dailyCommissions: ref.earnings?.dailyCommissions || 0,
            total: ref.earnings?.total || 0
          }
        }));
      }
      return [];
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    onError: (err: any) => {
      console.error('Referral history error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load referral history',
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error: {(error as Error).message}
      </div>
    );
  }

  if (!referrals.length) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No referrals found
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Earnings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((referral) => (
            <TableRow key={referral._id}>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{referral.username}</span>
                    <Badge variant={referral.level === 1 ? "default" : referral.level === 2 ? "secondary" : "outline"}>
                      L{referral.level}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{referral.phone}</span>
                  <span className="text-xs text-muted-foreground">
                    Joined {new Date(referral.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <Badge variant={referral.isActive ? "success" : "secondary"}>
                    {referral.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-muted-foreground mt-1">
                    {referral.referralCount} referrals
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end">
                  <span className="font-medium">KES {referral.earnings.total.toLocaleString()}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" className="h-6 px-2">
                          <span className="text-xs text-muted-foreground">Details</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <div className="text-xs">
                            One-time: KES {referral.earnings.oneTimeRewards.toLocaleString()}
                          </div>
                          <div className="text-xs">
                            Daily: KES {referral.earnings.dailyCommissions.toLocaleString()}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}