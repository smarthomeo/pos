import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Wallet, ArrowUpRight, ArrowDownRight, User, Phone, Gift, Calendar } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { authApi } from "@/services/api";
import { useState } from "react";
import DepositModal from "@/components/dashboard/DepositModal";
import { WithdrawModal } from "@/components/dashboard/WithdrawModal";

const Profile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, mutate } = useUser();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleSignOut = async () => {
    try {
      // Navigate first, then logout
      navigate('/');
      
      await authApi.logout();
      mutate(null);
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
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

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4 space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Profile</h1>
        <Button variant="destructive" size="sm" onClick={handleSignOut} className="text-sm">
          <LogOut className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-sm">Your account details and preferences</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Username</p>
              </div>
              <p className="text-base sm:text-lg font-semibold truncate" title={user.username}>{user.username}</p>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Phone Number</p>
              </div>
              <p className="text-base sm:text-lg font-semibold truncate" title={user.phone}>{user.phone}</p>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2">
                <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Referral Code</p>
              </div>
              <p className="text-base sm:text-lg font-semibold truncate" title={user.referralCode}>{user.referralCode}</p>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Member Since</p>
              </div>
              <p className="text-base sm:text-lg font-semibold truncate" title={formatDate(user.createdAt)}>{formatDate(user.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
              Balance
            </CardTitle>
            <CardDescription className="text-sm">Your current account balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-primary">KES {(user.balance || 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              Quick Deposit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full h-9 sm:h-10 text-sm sm:text-base" 
              onClick={() => setShowDepositModal(true)}
            >
              Make a Deposit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full h-9 sm:h-10 text-sm sm:text-base" 
              onClick={() => setShowWithdrawModal(true)}
            >
              Make a Withdrawal
            </Button>
          </CardContent>
        </Card>
      </div>

      <DepositModal 
        isOpen={showDepositModal} 
        onClose={() => setShowDepositModal(false)} 
      />
      
      <WithdrawModal 
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        userBalance={user?.balance || 0}
        userPhone={user?.phone || ''}
      />
    </div>
  );
};

export default Profile;