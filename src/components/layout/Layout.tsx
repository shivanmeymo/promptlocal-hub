import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import CookieConsent from '@/components/CookieConsent';
import { useLanguage } from '@/contexts/LanguageContext';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        {language === 'sv' ? 'Hoppa till huvudinnehåll' : 'Skip to main content'}
      </a>
      <Navbar />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      {/* Cookie consent banner */}
      <CookieConsent />
    </div>
  );
};
