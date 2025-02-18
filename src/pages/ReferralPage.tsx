import { ReferralDashboard } from "@/components/referral/ReferralDashboard";
import { ReferralTable } from "@/components/referral/ReferralTable";
import { ReferralRewards } from "@/components/referral/ReferralRewards";

const ReferralPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Referral Program</h1>
      <ReferralDashboard />
      <ReferralRewards />
      <ReferralTable />
    </div>
  );
};

export default ReferralPage;