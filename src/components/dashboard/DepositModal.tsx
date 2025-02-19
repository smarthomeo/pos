import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transactionApi } from "@/services/api";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TILL_NUMBER = "123456"; // Replace with your actual till number
const TELEGRAM_GROUP_LINK = "https://t.me/+254747275132"; // Replace with your actual Telegram group link

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const copyTillNumber = () => {
    navigator.clipboard.writeText(TILL_NUMBER);
    toast({
      description: "Till number copied to clipboard",
    });
  };

  const handleMpesa = () => {
    // This will open the dialer with the till number
    window.location.href = `tel:*174*${TILL_NUMBER}#`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const depositAmount = Number(amount);
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create deposit transaction
      const response = await transactionApi.initiateDeposit(depositAmount);
      
      // Format the telegram message
      const message = encodeURIComponent(
        `💰 Deposit Notification\n\n` +
        `Amount: KES ${depositAmount}\n` +
        `Till Number: ${TILL_NUMBER}\n` +
        `Transaction ID: ${response.transaction._id}\n\n` +
        `Please confirm this deposit.`
      );

      // Open telegram with pre-filled message
      window.open(`${TELEGRAM_GROUP_LINK}?text=${message}`, '_blank');
      
      // Close the modal
      onClose();
      
      // Show success message
      toast({
        title: "Deposit initiated",
        description: "Please complete the M-Pesa payment and notify us on Telegram",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create deposit request",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit Funds</DialogTitle>
          <DialogDescription>
            Send money to the following till number via M-Pesa
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-secondary p-4 rounded-lg flex-1 text-center">
                <p className="text-sm text-muted-foreground">Till Number</p>
                <p className="text-2xl font-bold">{TILL_NUMBER}</p>
              </div>
              <Button size="icon" variant="outline" onClick={copyTillNumber}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to deposit"
                min={1}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Create Deposit Request"}
            </Button>
            <Button 
              type="button"
              className="w-full" 
              onClick={handleMpesa}
              disabled={isLoading}
            >
              Open M-Pesa
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-4">
              After sending money, please notify us on Telegram for faster processing
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 