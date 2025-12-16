import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Logo and tagline */}
          <div className="flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span className="font-display font-bold text-xl">
                <span className="text-primary">Now</span>
                <span className="text-accent">In</span>
                <span className="text-foreground">Town</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3">{t('footer.quickLinks')}</h3>
            <nav className="flex flex-wrap gap-4 text-sm">
              <Link to="/" className="text-accent hover:underline">
                {t('nav.home')}
              </Link>
              <Link to="/create-event" className="text-accent hover:underline">
                {t('nav.createEvent')}
              </Link>
              <Link to="/about" className="text-accent hover:underline">
                {t('nav.about')}
              </Link>
              <Link to="/contact" className="text-accent hover:underline">
                {t('nav.contact')}
              </Link>
              <Link to="/data-integrity" className="text-accent hover:underline">
                {t('nav.dataIntegrity')}
              </Link>
              <Link to="/terms" className="text-accent hover:underline">
                {t('nav.terms')}
              </Link>
            </nav>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-4 text-center text-sm text-muted-foreground">
          © {currentYear} NowInTown. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};
