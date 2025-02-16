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

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      try {
        const user = localStorage.getItem('user');
        console.log('Checking auth, user from localStorage:', user);
        
        if (user) {
          // Verify the token with backend
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          console.log('Verifying token with backend:', `${backendUrl}/api/auth/verify`);
          
          const response = await fetch(`${backendUrl}/api/auth/verify`, {
            credentials: 'include'
          });
          
          console.log('Verify response:', { status: response.status });
          
          if (response.ok) {
            console.log('Token verified, setting isAuthenticated to true');
            setIsAuthenticated(true);
          } else {
            console.log('Token invalid, clearing localStorage');
            localStorage.removeItem('user');
          }
        } else {
          console.log('No user in localStorage');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = () => {
    console.log('handleAuthSuccess called, setting isAuthenticated to true');
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/login" element={<AuthForm />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <AppLayout>
                      <Profile />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/referrals"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <AppLayout>
                      <ReferralPage />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forex"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <AppLayout>
                      <ForexGrid />
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;