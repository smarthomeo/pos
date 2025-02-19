import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/contexts/AuthContext";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { authApi } from "@/services/api";

interface FormValues {
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}

const validationSchema = Yup.object().shape({
  username: Yup.string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters"),
  phone: Yup.string()
    .required("Phone number is required")
    .matches(/^\+[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  password: Yup.string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: Yup.string()
    .required("Please confirm your password")
    .oneOf([Yup.ref("password")], "Passwords must match"),
  referralCode: Yup.string(),
});

interface RegisterFormProps {
  defaultReferralCode?: string | null;
}

const RegisterForm = ({ defaultReferralCode }: RegisterFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext) || {};

  if (!login) {
    throw new Error("RegisterForm must be used within an AuthProvider");
  }

  const initialValues: FormValues = {
    username: "",
    phone: "",
    password: "",
    confirmPassword: "",
    referralCode: defaultReferralCode || "",
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      // Register the user
      const response = await authApi.register({
        username: values.username,
        phone: values.phone,
        password: values.password,
        referralCode: values.referralCode,
      });

      // Log the user in
      await login(values.phone, values.password);
      
      toast({
        title: "Success",
        description: "Successfully registered! Welcome aboard.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to register",
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary/90">
          Welcome to Bluesky
        </h2>
        <p className="text-primary/70">
          Fill in your details to get started
        </p>
      </div>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue, handleBlur }) => (
          <Form className="space-y-4 sm:space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <div className="mt-1">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={values.username}
                    onChange={(e) => setFieldValue("username", e.target.value)}
                    onBlur={handleBlur}
                    className="block w-full h-9 sm:h-10 text-sm sm:text-base"
                  />
                  {errors.username && touched.username && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.username}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <PhoneInput
                    id="phone"
                    name="phone"
                    international
                    defaultCountry="KE"
                    value={values.phone}
                    onChange={(value) => setFieldValue("phone", value)}
                    onBlur={handleBlur}
                    className="block w-full text-sm sm:text-base"
                  />
                  {errors.phone && touched.phone && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={values.password}
                    onChange={(e) => setFieldValue("password", e.target.value)}
                    onBlur={handleBlur}
                    className="block w-full h-9 sm:h-10 text-sm sm:text-base"
                  />
                  {errors.password && touched.password && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={(e) => setFieldValue("confirmPassword", e.target.value)}
                    onBlur={handleBlur}
                    className="block w-full h-9 sm:h-10 text-sm sm:text-base"
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">
                  Referral Code (Optional)
                </label>
                <div className="mt-1">
                  <Input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    value={values.referralCode}
                    onChange={(e) => setFieldValue("referralCode", e.target.value)}
                    onBlur={handleBlur}
                    className="block w-full h-9 sm:h-10 text-sm sm:text-base"
                  />
                  {errors.referralCode && touched.referralCode && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.referralCode}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 sm:pt-4">
              <Button
                type="submit"
                className="w-full h-9 sm:h-10 text-sm sm:text-base"
              >
                Create Account
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default RegisterForm;
