import { useEffect, useState } from 'react';
import zxcvbn from 'zxcvbn';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (password) {
      const result = zxcvbn(password);
      setScore(result.score);
      setFeedback(result.feedback.warning || result.feedback.suggestions[0] || '');
    } else {
      setScore(0);
      setFeedback('');
    }
  }, [password]);

  const getColor = () => {
    switch (score) {
      case 0:
        return 'bg-red-500';
      case 1:
        return 'bg-orange-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-green-500';
      case 4:
        return 'bg-emerald-500';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 h-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`flex-1 rounded-full transition-all duration-300 ${
              index <= score ? getColor() : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
      {feedback && (
        <p className="text-sm text-muted-foreground">{feedback}</p>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;