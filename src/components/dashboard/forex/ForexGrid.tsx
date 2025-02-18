import { useState, useEffect } from 'react';
import ForexPairCard from './ForexPairCard';
import { useToast } from '@/hooks/use-toast';
import { investmentApi } from '@/services/api';

interface ForexPair {
  pair: string;
  price: number;
  previousPrice: number;
  dailyROI: number;
  minInvestment: number;
  flag1: string;
  flag2: string;
  disabled?: boolean;
}

const FOREX_PAIRS: ForexPair[] = [
  {
    pair: 'EUR/USD',
    price: 1.0921,
    previousPrice: 1.0916,
    dailyROI: 5.0,
    minInvestment: 600,
    flag1: '/images/eur.jpg',
    flag2: '/images/usd.jpg'
  },
  {
    pair: 'GBP/USD',
    price: 1.2650,
    previousPrice: 1.2645,
    dailyROI: 5.3,
    minInvestment: 1500,
    flag1: '/images/gbp.jpg',
    flag2: '/images/usd.jpg'
  },
  {
    pair: 'USD/JPY',
    price: 148.35,
    previousPrice: 148.40,
    dailyROI: 5.8,
    minInvestment: 3000,
    flag1: '/images/usd.jpg',
    flag2: '/images/jpy.jpg'
  },
  {
    pair: 'USD/CHF',
    price: 0.8650,
    previousPrice: 0.8645,
    dailyROI: 6.0,
    minInvestment: 5000,
    flag1: '/images/usd.jpg',
    flag2: '/images/chf.jpg'
  },
  {
    pair: 'AUD/USD',
    price: 0.6580,
    previousPrice: 0.6575,
    dailyROI: 6.3,
    minInvestment: 8000,
    flag1: '/images/aud.jpg',
    flag2: '/images/usd.jpg' 
  },
  {
    pair: 'EUR/GBP',
    price: 0.8635,
    previousPrice: 0.8630,
    dailyROI: 6.5,
    minInvestment: 15000,
    flag1: '/images/eur.jpg',
    flag2: '/images/gbp.jpg'
  },
  {
    pair: 'EUR/AUD',
    price: 1.6580,
    previousPrice: 1.6575,
    dailyROI: 7.0,
    minInvestment: 20000,
    flag1: '/images/eur.jpg',
    flag2: '/images/aud.jpg'
  },
  {
    pair: 'USD/CAD',
    price: 1.3450,
    previousPrice: 1.3445,
    dailyROI: 7.4,
    minInvestment: 40000,
    flag1: '/images/usd.jpg',
    flag2: '/images/cad.jpg',
    disabled: true
  },
  {
    pair: 'NZD/USD',
    price: 0.6120,
    previousPrice: 0.6115,
    dailyROI: 8.0,
    minInvestment: 100000,
    flag1: '/images/nzd.jpg',
    flag2: '/images/usd.jpg',
    disabled: true
  }
];

export default function ForexGrid() {
  const { toast } = useToast();
  const [investments, setInvestments] = useState<any[]>([]);
  const [forexPairs, setForexPairs] = useState<ForexPair[]>(FOREX_PAIRS);

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await investmentApi.getInvestments();
        setInvestments(response.investments || []);
      } catch (error) {
        console.error('Error fetching investments:', error);
      }
    };

    fetchInvestments();
  }, []);

  const handleInvestmentCreated = (newInvestment: any) => {
    setInvestments((prev) => [newInvestment, ...prev]);
    toast({
      title: "Investment Created",
      description: `Successfully invested in ${newInvestment.forexPair}`,
      variant: "success",
    });
  };

  // In a real app, you would fetch real-time forex data here
  useEffect(() => {
    const interval = setInterval(() => {
      setForexPairs(pairs => 
        pairs.map(pair => ({
          ...pair,
          previousPrice: pair.price,
          price: pair.price + (Math.random() - 0.5) * 0.001
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {forexPairs.map((pair) => (
        <ForexPairCard
          key={pair.pair}
          {...pair}
          onInvestmentCreated={handleInvestmentCreated}
        />
      ))}
    </div>
  );
}