import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmptyState() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/deposit');
  };

  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
      <img
        src="/placeholder.svg"
        alt="Empty state illustration"
        className="w-64 h-64 mb-6"
      />
      <h3 className="text-2xl font-semibold mb-2">Welcome to Your Investment Journey</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start building your portfolio today. Make your first deposit and watch your investments grow.
      </p>
      <Button onClick={handleGetStarted}>
        Get Started
        <ArrowRightIcon className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}