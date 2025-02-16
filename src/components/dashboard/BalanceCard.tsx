import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface BalanceCardProps {
  balance: number;
  previousBalance?: number;
}

export default function BalanceCard({ balance, previousBalance }: BalanceCardProps) {
  const [displayBalance, setDisplayBalance] = useState(previousBalance || balance);

  useEffect(() => {
    const steps = 30;
    const increment = (balance - displayBalance) / steps;
    let current = displayBalance;

    const timer = setInterval(() => {
      if (Math.abs(balance - current) < Math.abs(increment)) {
        setDisplayBalance(balance);
        clearInterval(timer);
      } else {
        current += increment;
        setDisplayBalance(current);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [balance]);

  const percentageChange = previousBalance 
    ? ((balance - previousBalance) / previousBalance) * 100 
    : 0;

  const formattedBalance = displayBalance.toLocaleString('en-KE', {
    style: 'currency',
    currency: 'KES'
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
        <span className={`text-sm ${percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {percentageChange >= 0 ? '↑' : '↓'} {Math.abs(percentageChange).toFixed(2)}%
        </span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedBalance}</div>
      </CardContent>
    </Card>
  );
}