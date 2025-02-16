import { Button } from "@/components/ui/button";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  LineChartIcon 
} from "lucide-react";

interface QuickActionProps {
  onDeposit: () => void;
  onWithdraw: () => void;
  onInvest: () => void;
}

export default function QuickActions({ onDeposit, onWithdraw, onInvest }: QuickActionProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <Button
        variant="outline"
        className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start px-2 sm:px-4 py-4 sm:py-2 h-auto sm:h-10"
        onClick={onDeposit}
      >
        <ArrowUpIcon className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
        <span className="text-xs sm:text-sm">Deposit</span>
      </Button>
      <Button
        variant="outline"
        className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start px-2 sm:px-4 py-4 sm:py-2 h-auto sm:h-10"
        onClick={onWithdraw}
      >
        <ArrowDownIcon className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
        <span className="text-xs sm:text-sm">Withdraw</span>
      </Button>
      <Button
        variant="outline"
        className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start px-2 sm:px-4 py-4 sm:py-2 h-auto sm:h-10"
        onClick={onInvest}
      >
        <LineChartIcon className="h-4 w-4 mb-1 sm:mb-0 sm:mr-2" />
        <span className="text-xs sm:text-sm">Invest</span>
      </Button>
    </div>
  );
}