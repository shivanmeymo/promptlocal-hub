import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto" role="contentinfo">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Logo and tagline */}
          <div className="flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded" aria-label="NowInTown - Hem">
              <span className="text-2xl" aria-hidden="true">✨</span>
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
          <nav aria-label={t('footer.quickLinks')}>
            <h3 className="font-semibold mb-3">{t('footer.quickLinks')}</h3>
            <ul className="flex flex-wrap gap-4 text-sm list-none p-0 m-0">
              <li>
                <Link to="/" className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/create-event" className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded">
                  {t('nav.createEvent')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded">
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded">
                  {t('nav.contact')}
                </Link>
              </li>
              <li>
                <Link to="/data-integrity" className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded">
                  {t('nav.dataIntegrity')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded">
                  {t('nav.terms')}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-border mt-8 pt-4 text-center text-sm text-muted-foreground">
          <p>© {currentYear} NowInTown. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};
