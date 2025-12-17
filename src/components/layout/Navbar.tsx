import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, Calendar, LogOut, Shield, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const CITIES = [
  { slug: 'stockholm', name: 'Stockholm' },
  { slug: 'goteborg', name: 'Göteborg' },
  { slug: 'malmo', name: 'Malmö' },
  { slug: 'uppsala', name: 'Uppsala' },
  { slug: 'lund', name: 'Lund' },
  { slug: 'linkoping', name: 'Linköping' },
  { slug: 'umea', name: 'Umeå' },
];

const SwedishFlag = () => (
  <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="18" fill="#006AA7" />
    <rect x="7" width="3" height="18" fill="#FECC00" />
    <rect y="7" width="24" height="4" fill="#FECC00" />
  </svg>
);

const UKFlag = () => (
  <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="18" fill="#012169" />
    <path d="M0 0L24 18M24 0L0 18" stroke="white" strokeWidth="3" />
    <path d="M0 0L24 18M24 0L0 18" stroke="#C8102E" strokeWidth="1.5" />
    <path d="M12 0V18M0 9H24" stroke="white" strokeWidth="5" />
    <path d="M12 0V18M0 9H24" stroke="#C8102E" strokeWidth="3" />
  </svg>
);

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data);
    };

    checkAdminRole();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'sv' : 'en');
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {mobile && (
        <div className="py-2">
          <p className="text-sm font-medium text-muted-foreground mb-2 px-2">
            {language === 'sv' ? 'Evenemang per stad' : 'Events by city'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CITIES.map((city) => (
              <Link
                key={city.slug}
                to={`/events/${city.slug}`}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MapPin className="w-3.5 h-3.5" />
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {user && (
        <Link
          to="/manage-events"
          className={`${mobile ? 'block py-2' : ''} text-foreground hover:text-primary transition-colors text-center`}
          onClick={() => mobile && setMobileMenuOpen(false)}
        >
          {t('nav.manageEvents')}
        </Link>
      )}
      <Link
        to="/create-event"
        className={`${mobile ? 'block py-2' : ''} text-foreground hover:text-primary transition-colors text-center`}
        onClick={() => mobile && setMobileMenuOpen(false)}
      >
        {t('nav.createEvent')}
      </Link>
      <Link
        to="/about"
        className={`${mobile ? 'block py-2' : ''} text-foreground hover:text-primary transition-colors text-center`}
        onClick={() => mobile && setMobileMenuOpen(false)}
      >
        {t('nav.about')}
      </Link>
      <Link
        to="/contact"
        className={`${mobile ? 'block py-2' : ''} text-foreground hover:text-primary transition-colors text-center`}
        onClick={() => mobile && setMobileMenuOpen(false)}
      >
        {t('nav.contact')}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" aria-label="NowInTown Home">
          <span className="text-2xl">✨</span>
          <span className="font-display font-bold text-xl">
            <span className="text-primary">Now</span>
            <span className="text-accent">In</span>
            <span className="text-foreground">Town</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* Cities Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1.5">
                <MapPin className="w-4 h-4" />
                {language === 'sv' ? 'Städer' : 'Cities'}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 bg-popover">
              {CITIES.map((city) => (
                <DropdownMenuItem key={city.slug} asChild>
                  <Link to={`/events/${city.slug}`} className="cursor-pointer">
                    <MapPin className="w-4 h-4 mr-2" />
                    {city.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={toggleLanguage}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label={`Switch to ${language === 'en' ? 'Swedish' : 'English'}`}
          >
            {language === 'sv' ? <SwedishFlag /> : <UKFlag />}
          </button>

          <Link to="/create-event">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              {t('nav.createEvent')}
            </Button>
          </Link>

          {user ? (
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
                  <Link to="/manage-events" className="cursor-pointer">
                    {t('nav.manageEvents')}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer text-primary">
                        <Shield className="w-4 h-4 mr-2" />
                        {language === 'sv' ? 'Admin Dashboard' : 'Admin Dashboard'}
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
          ) : null}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:flex gap-2">
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
                <NavLinks mobile />
                {user ? (
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full mt-4 justify-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">{t('nav.signInUp')}</Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label={`Switch to ${language === 'en' ? 'Swedish' : 'English'}`}
          >
            {language === 'sv' ? <SwedishFlag /> : <UKFlag />}
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
                <NavLinks mobile />
                {user ? (
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="w-full mt-4 justify-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
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
