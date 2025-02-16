import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const LandingPage = () => {
  // Set the background image in localStorage on component mount
  useEffect(() => {
    localStorage.setItem('landing_bg_image', '/images/background.jpg');
  }, []);

  const [bgImage] = useState<string | null>(localStorage.getItem('landing_bg_image'));

  const backgroundStyle = bgImage
    ? {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/90 via-primary to-primary/90 relative overflow-hidden"
      style={backgroundStyle}
    >
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm -z-10" />
      
      {/* Animated circles in background */}
      <div className="absolute inset-0 overflow-hidden -z-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="container mx-auto px-4 flex flex-col items-center space-y-12 relative z-10">
        {/* Logo and Title Section */}
        <div className="text-center space-y-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse blur-xl bg-white/20 rounded-full" />
              <img src="/logo.svg" alt="Bluesky Investments" className="h-24 w-24 relative drop-shadow-2xl" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
              Bluesky Investments
            </h1>
          </div>
          <p className="text-white/90 max-w-2xl text-xl md:text-2xl font-light leading-relaxed">
            Start your investment journey today with our secure and easy-to-use platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mx-auto mb-12">
          {[
            { title: 'Secure', description: 'Bank-grade security for your investments' },
            { title: 'Easy', description: 'Simple and intuitive trading interface' },
            { title: 'Professional', description: 'Expert support and market analysis' },
          ].map((feature) => (
            <div key={feature.title} className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center transform hover:scale-105 transition-transform duration-300">
              <h3 className="text-white text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/80">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
          <Button 
            size="lg" 
            className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl" 
            asChild
          >
            <Link to="/signup">Get Started</Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto border-white text-white hover:bg-white/20 transform hover:scale-105 transition-all duration-300" 
            asChild
          >
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
