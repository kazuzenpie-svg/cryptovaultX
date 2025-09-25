import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, Shield } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Wallet, text: "Initializing CryptoVault", color: "text-primary" },
    { icon: TrendingUp, text: "Loading Trading Data", color: "text-accent" },
    { icon: Shield, text: "Securing Your Assets", color: "text-success" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setTimeout(onComplete, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [onComplete, steps.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-20">
        <div className="h-full w-full animate-gradient bg-gradient-to-br from-primary via-accent to-success bg-[length:400%_400%]" />
      </div>

      <div className="relative flex flex-col items-center space-y-8 px-8">
        {/* Logo and title */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-2xl">
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CryptoVault
            </h1>
            <p className="text-muted-foreground text-sm mt-2">Your Personal Crypto Journal</p>
          </div>
        </div>

        {/* Loading steps */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div
                key={index}
                className={`flex items-center space-x-4 transition-all duration-500 ${
                  isActive ? 'scale-110 opacity-100' : isCompleted ? 'opacity-60' : 'opacity-30'
                }`}
              >
                <div className={`p-3 rounded-xl ${isActive ? 'glow pulse-glow' : ''} bg-card`}>
                  <Icon className={`w-6 h-6 ${step.color} ${isActive ? 'animate-pulse' : ''}`} />
                </div>
                <span className={`text-lg font-medium ${isActive ? step.color : 'text-muted-foreground'}`}>
                  {step.text}
                </span>
                {isActive && (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}