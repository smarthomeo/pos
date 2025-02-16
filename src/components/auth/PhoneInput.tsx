import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { cn } from '@/lib/utils';

interface CustomPhoneInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (e: any) => void;
  error?: string;
  touched?: boolean;
}

const CustomPhoneInput = ({ 
  id,
  name,
  value, 
  onChange, 
  onBlur,
  error,
  touched 
}: CustomPhoneInputProps) => {
  return (
    <div className="space-y-2">
      <PhoneInput
        id={id}
        name={name}
        international
        defaultCountry="KE"
        value={value}
        onChange={(value) => onChange(value || '')}
        onBlur={onBlur}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          touched && error && "border-red-500 focus-visible:ring-red-500"
        )}
      />
      {touched && error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default CustomPhoneInput;