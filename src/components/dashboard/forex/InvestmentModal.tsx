import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { investmentApi, userApi } from "@/services/api";
import { useUser } from "@/hooks/use-user";

interface InvestmentModalProps {
  show: boolean;
  onClose: () => void;
  pair: string;
  price: number;
  dailyROI: number;
  minInvestment: number;
  onInvestmentCreated: (investment: any) => void;
}

export default function InvestmentModal({
  show,
  onClose,
  pair,
  price,
  dailyROI,
  minInvestment,
  onInvestmentCreated,
}: InvestmentModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, mutate: updateUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await investmentApi.createInvestment({
        pair,
        amount: parseFloat(amount),
        dailyROI: parseFloat(dailyROI.toString()),
      });
      
      // Add the new investment to the list
      if (response.investment) {
        if (typeof onInvestmentCreated === 'function') {
          onInvestmentCreated(response.investment);
        }
        onClose();
        toast({
          title: "Success",
          description: "Investment created successfully!",
          variant: "success",
        });
      }
    } catch (error: any) {
      console.error('Investment creation error:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to create investment',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invest in {pair}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Price</span>
              <span className="font-medium">{price.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Daily ROI</span>
              <span className="font-medium text-green-500">+{dailyROI}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Minimum Investment</span>
              <span className="font-medium">KES {minInvestment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Your Balance</span>
              <span className="font-medium">KES {(user?.balance || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Investment Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to invest"
              min={minInvestment}
              step={1000}
            />
          </div>
          {amount && (
            <div className="space-y-2 p-4 bg-secondary rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Daily Earnings</span>
                <span className="font-medium text-green-500">
                  +KES {((parseFloat(amount) || 0) * (dailyROI / 100)).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !amount || parseFloat(amount) < minInvestment}
            >
              {isLoading ? "Processing..." : "Confirm Investment"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}