import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SplashScreen } from '@/components/SplashScreen';
import { PageLoading } from '@/components/LoadingSpinner';
import { splashUtils } from '@/lib/splashUtils';

const Index = () => {
  const [showSplash, setShowSplash] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Determine if splash screen should be shown
    const shouldShow = splashUtils.shouldShowSplash(!!user, loading);
    setShowSplash(shouldShow);
  }, [user, loading]);

  useEffect(() => {
    if (!loading && !showSplash) {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }
  }, [user, loading, showSplash, navigate]);

  const handleSplashComplete = () => {
    // Mark that user has seen the splash screen
    splashUtils.markAsSeen();
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return <PageLoading text="Loading CryptoVault..." />;
  }

  return <PageLoading text="Redirecting..." />;
};

export default Index;
