import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { transactionApi } from '@/services/api';

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MpesaPaymentModal({ isOpen, onClose, onSuccess }: MpesaPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const response = await transactionApi.initiateDeposit(numAmount);
      
      toast({
        title: 'Payment Initiated',
        description: `Please check your phone for the M-Pesa prompt. Reference: ${response.reference}`,
      });

      // Simulate M-Pesa confirmation (in real app, this would be handled by webhook)
      setTimeout(async () => {
        try {
          await transactionApi.confirmDeposit(response.transactionId);
          toast({
            title: 'Payment Successful',
            description: 'Your deposit has been confirmed',
          });
          onSuccess?.();
          onClose();
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Confirmation Failed',
            description: error.message || 'Failed to confirm payment',
          });
        }
      }, 5000);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: error.message || 'Failed to initiate payment',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>M-Pesa Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Pay with M-Pesa'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}