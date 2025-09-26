import { Navbar } from '@/components/navigation/Navbar';

export default function About() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="fade-in text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              About CryptoVaultX
            </h1>
            <p className="text-muted-foreground">
              Your comprehensive cryptocurrency portfolio tracker
            </p>
          </div>
          
          <div className="glass-card p-6 md:p-8 rounded-xl fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <img 
                  src="/resources/images/dev.jpg" 
                  alt="Kent Asna" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Kent Asna</h2>
                <p className="text-primary font-medium">Software Manager</p>
                <p className="text-muted-foreground max-w-md">
                  Leading the development of CryptoVaultX to provide users with the best 
                  cryptocurrency portfolio tracking experience.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-xl fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
              <p className="text-muted-foreground">
                To empower cryptocurrency investors with intuitive tools for tracking, 
                analyzing, and optimizing their digital asset portfolios.
              </p>
            </div>
            
            <div className="glass-card p-6 rounded-xl fade-in" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xl font-semibold mb-3">Key Features</h3>
              <ul className="text-muted-foreground space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Real-time price tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Portfolio performance analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Multi-exchange integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Secure data encryption</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-xl fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-xl font-semibold mb-3 text-center">Technology Stack</h3>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">React</span>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">TypeScript</span>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Supabase</span>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Tailwind CSS</span>
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">TokenMetrics API</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
