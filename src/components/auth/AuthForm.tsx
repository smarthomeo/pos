import { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/contexts/AuthContext";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface FormValues {
  phone: string;
  password: string;
}

const validationSchema = Yup.object().shape({
  phone: Yup.string()
    .required("Phone number is required")
    .matches(/^\+[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});

const AuthForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext) || {};

  if (!login) {
    throw new Error("AuthForm must be used within an AuthProvider");
  }

  const initialValues: FormValues = {
    phone: "",
    password: "",
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      await login(values.phone, values.password);
      
      toast({
        title: "Success",
        description: "Successfully logged in",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to login",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 relative overflow-hidden">
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
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-primary/80 text-base">
            Sign in to continue to your account
          </p>
        </div>

        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-2xl p-6 sm:p-8">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, values, setFieldValue, handleBlur }) => (
              <Form className="space-y-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-primary/90">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <PhoneInput
                        id="phone"
                        name="phone"
                        international
                        defaultCountry="KE"
                        value={values.phone}
                        onChange={(value) => setFieldValue("phone", value)}
                        onBlur={handleBlur}
                        className="block w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:outline-none transition-all duration-200 text-primary placeholder-primary/50"
                      />
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.phone && touched.phone && (
                      <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-primary/90">
                      Password
                    </label>
                    <div className="relative group">
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={values.password}
                        onChange={(e) => setFieldValue("password", e.target.value)}
                        onBlur={handleBlur}
                        className="w-full px-4 py-3 bg-white/50 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:outline-none transition-all duration-200 text-primary placeholder-primary/50"
                      />
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.password && touched.password && (
                      <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.password}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Sign In
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-primary/70">
                      Don't have an account?{" "}
                      <Link 
                        to="/signup" 
                        className="font-medium text-primary hover:text-primary/90 transition-colors duration-200 hover:underline"
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;