import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MpesaPaymentModal } from "./MpesaPaymentModal";
import { Phone } from "lucide-react";

interface MpesaPaymentButtonProps {
  phoneNumber?: string;
  onSuccess?: () => void;
  className?: string;
}

export function MpesaPaymentButton({ 
  phoneNumber, 
  onSuccess,
  className 
}: MpesaPaymentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        <Phone className="mr-2 h-4 w-4" />
        Pay with M-Pesa
      </Button>

      <MpesaPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        phoneNumber={phoneNumber}
        onSuccess={onSuccess}
      />
    </>
  );
}