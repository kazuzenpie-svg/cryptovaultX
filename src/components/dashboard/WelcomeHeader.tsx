import { useAuth } from '@/hooks/useAuth';

export function WelcomeHeader() {
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-xl sm:rounded-2xl glass-card">
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {getTimeGreeting()}! 👋
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Welcome back to your crypto journey. Ready to track some trades?
        </p>
      </div>
    </div>
  );
}