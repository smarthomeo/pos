import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import ReferralPage from "./pages/ReferralPage";
import AuthForm from "./components/auth/AuthForm";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import ForexGrid from "./components/dashboard/forex/ForexGrid";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      try {
        const user = localStorage.getItem('user');
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Verify the token with backend
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/api/auth/verify`, {
          credentials: 'include'
        });

        if (!response.ok) {
          localStorage.removeItem('user');
          setIsLoading(false);
          return;
        }

        // Update user data from verification response
        const data = await response.json();
        if (data.user) {
          const userData = {
            _id: data.user._id,
            username: data.user.username,
            phone: data.user.phone,
            balance: data.user.balance || 0,
            referralCode: data.user.referralCode,
            isAdmin: data.user.isAdmin || false,
            isActive: data.user.isActive || false,
            createdAt: data.user.createdAt,
            updatedAt: data.user.updatedAt
          };
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/login" element={<AuthForm />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Dashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Profile />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/referrals"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ReferralPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/forex"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ForexGrid />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AppLayout>
                        <AdminDashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;