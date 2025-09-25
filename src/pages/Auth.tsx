import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/hooks/useAuth';
import { PageLoading } from '@/components/LoadingSpinner';
import { TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react';

export default function Auth() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <PageLoading text="Checking authentication..." />;
  }

  if (user) {
    return <PageLoading text="Redirecting to dashboard..." />;
  }

  const features = [
    {
      icon: TrendingUp,
      title: "Track Everything",
      description: "Monitor spot trades, futures, wallets, and DeFi activities"
    },
    {
      icon: Shield,
      title: "Secure Sharing",
      description: "Share insights with other traders while keeping sensitive data private"
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Live crypto prices and portfolio valuations powered by CoinGecko"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Multi-currency cashflow analysis and performance insights"
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-accent/10 to-success/10 p-12 items-center">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CryptoVault Journal
            </h1>
            <p className="text-lg text-muted-foreground">
              The complete solution for crypto portfolio tracking and community insights
            </p>
          </div>
          
          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="flex items-start space-x-4 p-4 rounded-xl glass-card hover-scale"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <AuthForm 
            mode={authMode} 
            onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')} 
          />
          
          {/* Mobile features preview */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Join thousands of crypto traders tracking their journey with CryptoVault
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}