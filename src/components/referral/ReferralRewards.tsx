import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FOREX_REWARDS = [
  { pair: 'EUR/USD', reward: 100 },
  { pair: 'GBP/USD', reward: 300 },
  { pair: 'USD/JPY', reward: 500 },
  { pair: 'USD/CHF', reward: 600 },
  { pair: 'AUD/USD', reward: 700 },
  { pair: 'EUR/GBP', reward: 1000 },
  { pair: 'EUR/AUD', reward: 1500 },
  { pair: 'USD/CAD', reward: 2500 },
  { pair: 'NZD/USD', reward: 5000 }
];

export function ReferralRewards() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Referral Rewards</CardTitle>
          <CardDescription>
            Earn rewards for referring new users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* One-time Rewards Table */}
          <div>
            <h4 className="font-medium mb-3">One-time Rewards per Forex Pair</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Forex Pair</TableHead>
                    <TableHead>One-time Reward</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FOREX_REWARDS.map((reward) => (
                    <TableRow key={reward.pair}>
                      <TableCell>{reward.pair}</TableCell>
                      <TableCell>${reward.reward}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Daily Commission Rates */}
          <div>
            <h4 className="font-medium mb-3">Daily Commission Rates</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Level 1</CardTitle>
                  <CardDescription>Direct Referrals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">10%</div>
                  <p className="text-sm text-muted-foreground">
                    of referral's daily ROI
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Level 2</CardTitle>
                  <CardDescription>Indirect Referrals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5%</div>
                  <p className="text-sm text-muted-foreground">
                    of referral's daily ROI
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Level 3</CardTitle>
                  <CardDescription>Extended Network</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2%</div>
                  <p className="text-sm text-muted-foreground">
                    of referral's daily ROI
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
