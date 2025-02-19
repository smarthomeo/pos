import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, MessageSquare, MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { referralApi } from "@/services/api";

interface ReferralStats {
  counts: {
    level1: number;
    level2: number;
    level3: number;
    total: number;
  };
  earnings: {
    total: number;
  };
}

// Consider data fresh for 10 seconds
const STALE_TIME = 1000 * 10;

export function ReferralDashboard() {
  const { toast } = useToast();
  
  // Get user data from localStorage
  const userDataString = localStorage.getItem('user');
  const userData = userDataString ? JSON.parse(userDataString) : null;
  const referralCode = userData?.referralCode || '';
  
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['referralStats'],
    queryFn: async () => {
      const response = await referralApi.getStats();
      console.log('Referral stats response:', response);
      return response as ReferralStats;
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    onError: (err: any) => {
      console.error('Referral stats error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load referral stats',
      });
    }
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Success",
        description: "Referral link copied to clipboard!",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link",
      });
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Join me on our investment platform and let's grow together! Use my referral code: ${referralCode}\n${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(`Join me on our investment platform and let's grow together! Use my referral code: ${referralCode}\n${referralLink}`);
    window.open(`https://t.me/share/url?url=${referralLink}&text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading referral stats...</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={100} className="animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{(error as Error).message}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Referral Stats */}
      <Card>
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-lg sm:text-xl">Your Referral Stats</CardTitle>
          <CardDescription className="text-sm">Total Referrals: {stats?.counts.total || 0}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 sm:p-4 border rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium">Direct Referrals (Level 1)</h4>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats?.counts.level1 || 0}</p>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium">Level 2 Referrals</h4>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats?.counts.level2 || 0}</p>
            </div>
            <div className="p-3 sm:p-4 border rounded-lg">
              <h4 className="text-xs sm:text-sm font-medium">Level 3 Referrals</h4>
              <p className="text-xl sm:text-2xl font-bold mt-1">{stats?.counts.level3 || 0}</p>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Total Earnings</h4>
                <p className="text-2xl font-bold mt-1">KES {stats?.earnings.total.toLocaleString() || 0}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Combined earnings from one-time rewards and daily commissions
                </p>
              </div>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={handleCopyLink}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy referral link</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={handleShareWhatsApp}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share on WhatsApp</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={handleShareTelegram}>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share on Telegram</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}