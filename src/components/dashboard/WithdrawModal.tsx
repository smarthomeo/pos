import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { transactionApi } from "@/services/api";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: number;
  userPhone: string;
}

const MIN_WITHDRAWAL = 200;
const TELEGRAM_GROUP_LINK = "https://t.me/+254747275132"; // Replace with your actual Telegram group link

export function WithdrawModal({ isOpen, onClose, userBalance, userPhone }: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmount = Number(amount);
    
    if (isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAWAL) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: `Minimum withdrawal amount is KES ${MIN_WITHDRAWAL}`,
      });
      return;
    }

    if (withdrawAmount > userBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "Withdrawal amount exceeds your available balance",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create withdrawal transaction
      const response = await transactionApi.initiateWithdrawal(withdrawAmount);
      
      // Format the telegram message
      const message = encodeURIComponent(
        `🔄 Withdrawal Request\n\n` +
        `📱 Phone: ${userPhone}\n` +
        `💰 Amount: KES ${withdrawAmount}\n` +
        `⚖️ Current Balance: KES ${userBalance}\n\n` +
        `Transaction ID: ${response.transaction._id}\n\n` +
        `Please process this withdrawal request.`
      );

      // Open telegram with pre-filled message
      window.open(`${TELEGRAM_GROUP_LINK}?text=${message}`, '_blank');
      
      // Close the modal
      onClose();
      
      // Show success message
      toast({
        title: "Withdrawal request sent",
        description: "Please wait for admin approval on Telegram",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create withdrawal request",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Enter amount to withdraw. Minimum withdrawal is KES {MIN_WITHDRAWAL}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to withdraw"
              min={MIN_WITHDRAWAL}
              max={userBalance}
              required
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Available balance: KES {userBalance}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Request Withdrawal"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Withdrawal requests are processed within 24 hours
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
} 