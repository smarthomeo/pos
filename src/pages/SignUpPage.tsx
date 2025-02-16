import RegisterForm from "@/components/auth/RegisterForm";
import { Link, useLocation } from "react-router-dom";

const SignUpPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const referralCode = searchParams.get('ref');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-block p-3 rounded-full bg-white/80 shadow-xl mb-2">
            <img src="/logo.svg" alt="Logo" className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Create Your Account
          </h1>

          {referralCode && (
            <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-700 font-medium">
                🎉 Signing up with referral code: <span className="font-bold">{referralCode}</span>
              </p>
            </div>
          )}
        </div>

        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-2xl p-6 sm:p-8">
          <RegisterForm defaultReferralCode={referralCode} />
          <div className="mt-6 text-center">
            <p className="text-primary/70">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className="font-medium text-primary hover:text-primary/90 transition-colors duration-200 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;