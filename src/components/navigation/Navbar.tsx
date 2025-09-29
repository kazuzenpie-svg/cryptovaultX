import { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  Home,
  BookOpen,
  PieChart,
  BarChart3,
  Settings as SettingsIcon,
  Share2,
  LogOut,
  User,
  Wallet,
  Info,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Portfolio', href: '/portfolio', icon: PieChart },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Sharing', href: '/sharing', icon: Share2 },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Memoize avatar initial to prevent unnecessary re-renders
  const avatarInitial = useMemo(() => user?.email?.charAt(0).toUpperCase() || 'U', [user?.email]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavItem = ({ item, mobile = false }: { item: typeof navigation[0], mobile?: boolean }) => (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 hover-scale ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-lg'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        } ${mobile ? 'text-base' : 'text-sm'}`
      }
      onClick={() => mobile && setIsOpen(false)}
    >
      <item.icon className="w-5 h-5" />
      {item.name}
    </NavLink>
  );

  const BottomNavItem = ({ item }: { item: typeof navigation[0] }) => (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 ${
          isActive ? 'text-primary' : 'text-muted-foreground'
        }`
      }
    >
      <item.icon className="w-5 h-5 mb-1" />
      <span className="text-xs font-medium">{item.name}</span>
    </NavLink>
  );

  if (!user) return null;

  return (
    <>
      {/* Desktop/Tablet Top Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block hidden">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2 hover-scale">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CryptoVault
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="flex items-center gap-2">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* User Menu (temporarily simplified to avoid re-render loop) */}
          <div className="flex items-center">
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover-scale">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Top Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden block">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CryptoVault
            </span>
          </NavLink>

          {/* User Avatar (temporarily simplified) */}
          <div className="flex items-center">
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:hidden">
        <div className="grid grid-cols-5 h-16 px-2">
          {navigation.map((item) => (
            <BottomNavItem key={item.name} item={item} />
          ))}
        </div>
      </nav>
    </>
  );
}