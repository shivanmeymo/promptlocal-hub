import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, Calendar, LogOut, Shield, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const SwedishFlag = memo(() => (
  <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
    <rect width="24" height="18" fill="#006AA7" />
    <rect x="7" width="3" height="18" fill="#FECC00" />
    <rect y="7" width="24" height="4" fill="#FECC00" />
  </svg>
));
SwedishFlag.displayName = 'SwedishFlag';

const UKFlag = memo(() => (
  <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
    <rect width="24" height="18" fill="#012169" />
    <path d="M0 0L24 18M24 0L0 18" stroke="white" strokeWidth="3" />
    <path d="M0 0L24 18M24 0L0 18" stroke="#C8102E" strokeWidth="1.5" />
    <path d="M12 0V18M0 9H24" stroke="white" strokeWidth="5" />
    <path d="M12 0V18M0 9H24" stroke="#C8102E" strokeWidth="3" />
  </svg>
));
UKFlag.displayName = 'UKFlag';

const NavLinks = memo(({ mobile, onClose, t, user }: { 
  mobile?: boolean; 
  onClose?: () => void; 
  t: (key: string) => string;
  user: any;
}) => {
  const linkClass = `${mobile ? 'block py-2' : ''} text-foreground hover:text-primary transition-colors text-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`;
  
  return (
    <nav aria-label={mobile ? t('nav.mobileMenu') || 'Mobile menu' : t('nav.mainMenu') || 'Main menu'}>
      {user && (
        <Link to="/manage-events" className={linkClass} onClick={onClose} aria-label={t('nav.manageEvents')}>
          {t('nav.manageEvents')}
        </Link>
      )}
      <Link to="/create-event" className={linkClass} onClick={onClose} aria-label={t('nav.createEvent')}>
        {t('nav.createEvent')}
      </Link>
      <Link to="/about" className={linkClass} onClick={onClose} aria-label={t('nav.about')}>
        {t('nav.about')}
      </Link>
      <Link to="/contact" className={linkClass} onClick={onClose} aria-label={t('nav.contact')}>
        {t('nav.contact')}
      </Link>
    </nav>
  );
});
NavLinks.displayName = 'NavLinks';

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.uid)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  // Load city from localStorage and listen for updates
  useEffect(() => {
    try { 
      const city = localStorage.getItem('nit_user_city');
      console.log('🗺️ Navbar: Loading city from localStorage:', city);
      setUserCity(city);
    } catch {}
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      const newCity = ce.detail || (typeof localStorage !== 'undefined' ? localStorage.getItem('nit_user_city') : null);
      console.log('🗺️ Navbar: City updated event received:', newCity);
      setUserCity(newCity);
    };
    window.addEventListener('nit_city_updated', handler as EventListener);
    const storageHandler = () => {
      try { 
        const city = localStorage.getItem('nit_user_city');
        console.log('🗺️ Navbar: Storage event - city:', city);
        setUserCity(city);
      } catch {}
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('nit_city_updated', handler as EventListener);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
    setMobileMenuOpen(false);
  }, [signOut, navigate]);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'sv' : 'en');
  }, [language, setLanguage]);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="NowInTown Home">
          <span className="font-bold text-xl tracking-tight">
            <span style={{ color: '#1a3a5c' }}>Now</span>
            <span style={{ color: '#f5a623', marginLeft: '2px' }}>In</span>
            <span style={{ color: '#1a3a5c' }}>Town</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {userCity && (
            <span className="text-sm text-muted-foreground border rounded-full px-3 py-1" aria-live="polite">
              {language === 'sv' ? 'Din stad:' : 'Your city:'} <span className="font-medium text-foreground">{userCity}</span>
            </span>
          )}
          <button
            onClick={toggleLanguage}
            className="p-1 rounded hover:bg-muted transition-all duration-300 hover:scale-110"
            aria-label={`Switch to ${language === 'en' ? 'Swedish' : 'English'}`}
          >
            <span className="block transition-all duration-300 ease-in-out" style={{ transform: language === 'sv' ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
              {language === 'sv' ? <UKFlag /> : <SwedishFlag />}
            </span>
          </button>

          <Link to="/create-event">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              {t('nav.createEvent')}
            </Button>
          </Link>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 border-foreground/20 bg-secondary hover:bg-secondary/80 rounded-tr-none"
                >
                  <User className="w-4 h-4" />
                  {profile?.full_name || user.email?.split('@')[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    {t('nav.myAccount')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    {language === 'sv' ? 'Inställningar' : 'Settings'}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer text-primary">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Menu className="w-5 h-5" />
                <span className="text-sm">{t('nav.menu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-center">{t('nav.menu')}</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-4">
                {user && (
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <User className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">{profile?.full_name || user.email}</p>
                  </div>
                )}
                <NavLinks mobile onClose={closeMobileMenu} t={t} user={user} />
                {user ? (
                  <Button onClick={handleSignOut} variant="outline" className="w-full mt-4 justify-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
                ) : (
                  <Link to="/auth" onClick={closeMobileMenu}>
                    <Button className="w-full">{t('nav.signInUp')}</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          {userCity && (
            <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5" aria-live="polite">
              {language === 'sv' ? 'Din stad:' : 'Your city:'} <span className="font-medium text-foreground">{userCity}</span>
            </span>
          )}
          <button
            onClick={toggleLanguage}
            className="p-1 rounded hover:bg-muted transition-all duration-300 hover:scale-110"
            aria-label={`Switch to ${language === 'en' ? 'Swedish' : 'English'}`}
          >
            <span className="block transition-all duration-300 ease-in-out" style={{ transform: language === 'sv' ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
              {language === 'sv' ? <UKFlag /> : <SwedishFlag />}
            </span>
          </button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Menu className="w-5 h-5" />
                <span className="text-sm">{t('nav.menu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-center">{t('nav.menu')}</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-4">
                {user && (
                  <div className="bg-muted p-4 rounded-lg text-center">
                    <User className="w-6 h-6 mx-auto mb-2" />
                    <p className="font-medium">{profile?.full_name || user.email}</p>
                  </div>
                )}
                <NavLinks mobile onClose={closeMobileMenu} t={t} user={user} />
                {user ? (
                  <Button onClick={handleSignOut} variant="outline" className="w-full mt-4 justify-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
                ) : (
                  <Link to="/auth" onClick={closeMobileMenu}>
                    <Button className="w-full">{t('nav.signInUp')}</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};
