import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import InvestmentModal from "./InvestmentModal";

interface ForexPairProps {
  pair: string;
  price: number;
  previousPrice: number;
  dailyROI: number;
  minInvestment: number;

  flag1: string;
  flag2: string;
  disabled?: boolean;
  onInvestmentCreated?: (investment: any) => void;
}

export default function ForexPairCard({
  pair,
  price,
  previousPrice,
  dailyROI,
  minInvestment,

  flag1,
  flag2,
  disabled = false,
  onInvestmentCreated,
}: ForexPairProps) {
  const [showInvestModal, setShowInvestModal] = useState(false);
  const priceChange = price - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;


  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white">
                  <img
                    src={flag1}
                    alt={pair.split('/')[0]}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-white">
                  <img
                    src={flag2}
                    alt={pair.split('/')[1]}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="font-semibold">{pair}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{price.toFixed(4)}</span>
              <span
                className={`text-xs ${
                  priceChange >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {priceChange >= 0 ? (
                  <ArrowUpIcon className="w-4 h-4" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4" />
                )}
                {Math.abs(priceChangePercent).toFixed(2)}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Daily ROI</span>
                <span className="font-medium text-green-500">+{dailyROI}%</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Min Investment</span>
                <span className="font-medium">KES {minInvestment.toLocaleString()}</span>
              </div>

            </div>
            <Button 
              className="w-full" 
              onClick={() => setShowInvestModal(true)}
              disabled={disabled}
            >
              {disabled ? "Coming Soon" : "Invest Now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <InvestmentModal
        show={showInvestModal}
        onClose={() => setShowInvestModal(false)}
        pair={pair}
        price={price}
        dailyROI={dailyROI}
        minInvestment={minInvestment}
        onInvestmentCreated={onInvestmentCreated}
      />
    </>
  );
}