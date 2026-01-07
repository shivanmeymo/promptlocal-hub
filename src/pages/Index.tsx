import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getCurrentPosition, reverseGeocode } from '@/lib/geo';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { EventCard } from '@/components/events/EventCard';
import { EventFilters } from '@/components/events/EventFilters';

import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  category: string;
  is_free: boolean;
  price?: number;
  image_url?: string;
  status: string;
  organizer_name?: string;
  source?: 'local' | 'tickster';
  source_url?: string;
}

interface TicksterEvent {
  external_id: string;
  title: string;
  description: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location: string;
  category: string;
  is_free: boolean;
  price?: number;
  image_url?: string;
  organizer_name?: string;
  source: string;
  source_url?: string;
}

interface Filters {
  search: string;
  date: string;
  location: string;
  category: string;
  freeOnly: boolean;
  keywords: string[];
}

const Index: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    date: '',
    location: '',
    category: '',
    freeOnly: false,
    keywords: [],
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      
      const [localResult, ticksterResult] = await Promise.all([
        supabase.from('events').select('*').eq('status', 'approved').order('start_date', { ascending: true }),
        supabase.functions.invoke('fetch-tickster-events', { body: { limit: 50 } }).catch(() => ({ data: null }))
      ]);

      const localEvents: Event[] = (localResult.data || []).map((e: any) => ({ ...e, source: 'local' as const }));

      let ticksterEvents: Event[] = [];
      if (ticksterResult.data?.events) {
        ticksterEvents = ticksterResult.data.events.map((e: TicksterEvent) => ({
          id: e.external_id,
          title: e.title,
          description: e.description,
          start_date: e.start_date,
          start_time: e.start_time,
          end_date: e.end_date,
          end_time: e.end_time,
          location: e.location,
          category: e.category,
          is_free: e.is_free,
          price: e.price,
          image_url: e.image_url,
          status: 'approved',
          organizer_name: e.organizer_name,
          source: 'tickster' as const,
          source_url: e.source_url
        }));
      }

      const allEvents = [...localEvents, ...ticksterEvents].sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );

      setEvents(allEvents);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  // On first load, ask for location and set city filter + header city
  useEffect(() => {
    (async () => {
      try {
        const coords = await getCurrentPosition();
        const cities = ['Stockholm','Göteborg','Malmö','Umeå','Västerås','Uppsala'];
        const { reverseGeocodeCity } = await import('@/lib/geo');
        const matched = await reverseGeocodeCity(coords, cities);
        if (matched) {
          setFilters(f => ({ ...f, location: matched }));
          try { 
            localStorage.setItem('nit_user_city', matched);
            window.dispatchEvent(new CustomEvent('nit_city_updated', { detail: matched }));
          } catch {}
        }
      } catch {
        // ignore if user denies
      }
    })();
  }, []);

  const filteredEvents = useMemo(() => {
    let result = events;

    if (filters.keywords.length > 0) {
      result = result.filter((e) =>
        filters.keywords.some(keyword => {
          const kw = keyword.toLowerCase();
          return e.title.toLowerCase().includes(kw) || e.description.toLowerCase().includes(kw) || e.location.toLowerCase().includes(kw);
        })
      );
    } else if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(searchLower) || e.description.toLowerCase().includes(searchLower) || e.location.toLowerCase().includes(searchLower)
      );
    }

    if (filters.location) {
      result = result.filter((e) => e.location.toLowerCase().includes(filters.location.toLowerCase()));
    }

    if (filters.category) {
      result = result.filter((e) => e.category === filters.category);
    }

    if (filters.freeOnly) {
      result = result.filter((e) => e.is_free);
    }

    if (filters.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      result = result.filter((e) => {
        const eventDate = new Date(e.start_date);
        eventDate.setHours(0, 0, 0, 0);
        
        switch (filters.date) {
          case 'today':
            return eventDate.getTime() === today.getTime();
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return eventDate.getTime() === tomorrow.getTime();
          case 'this-week':
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return eventDate >= today && eventDate <= weekEnd;
          case 'this-month':
            const monthEnd = new Date(today);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            return eventDate >= today && eventDate <= monthEnd;
          default:
            return true;
        }
      });
    }

    return result;
  }, [events, filters]);

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(f => ({ ...f, [key]: value }));
    // After any filter change, scroll to show filters + upcoming events
    // Use a timeout to allow layout to update before scrolling
    setTimeout(() => {
      const element = document.getElementById('filters-section');
      if (element) {
        const offset = 40;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 0);
  }, []);


  const scrollToEvents = useCallback(() => {
    const element = document.getElementById('events-section');
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, []);


  return (
    <Layout>
      <Helmet>
        <html lang={language} />
        <link rel="preload" as="image" href="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80" fetchPriority="high" />
        <title>
          {language === 'sv' 
            ? 'NowInTown - Evenemang i Uppsala & Sverige | Aktiviteter & Events' 
            : 'NowInTown - Events in Uppsala & Sweden | Activities & Events'}
        </title>
        <meta
          name="description"
          content={
            language === 'sv'
              ? 'Hitta evenemang och aktiviteter i Uppsala och hela Sverige. Konserter, sport, konst, mat, utbildning och community events. Gratis och betalda evenemang.'
              : 'Find events and activities in Uppsala and across Sweden. Concerts, sports, art, food, education and community events. Free and paid events.'
          }
        />
        <meta 
          name="keywords" 
          content={
            language === 'sv'
              ? 'evenemang Uppsala, aktiviteter Uppsala, events Sverige, konserter Uppsala, sport Uppsala, gratis evenemang, vad göra Uppsala, evenemang idag'
              : 'events Uppsala, activities Uppsala, events Sweden, concerts Uppsala, sports Uppsala, free events, things to do Uppsala, events today'
          }
        />
        <link rel="canonical" href="https://nowintown.se" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://nowintown.se" />
        <meta property="og:title" content={language === 'sv' ? 'NowInTown - Evenemang i Uppsala & Sverige' : 'NowInTown - Events in Uppsala & Sweden'} />
        <meta property="og:description" content={language === 'sv' ? 'Hitta evenemang och aktiviteter i Uppsala och hela Sverige' : 'Find events and activities in Uppsala and across Sweden'} />
        <meta property="og:image" content="https://nowintown.se/og-image.jpg" />
        <meta property="og:locale" content={language === 'sv' ? 'sv_SE' : 'en_US'} />
        <meta property="og:site_name" content="NowInTown" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://nowintown.se" />
        <meta name="twitter:title" content={language === 'sv' ? 'NowInTown - Evenemang i Uppsala & Sverige' : 'NowInTown - Events in Uppsala & Sweden'} />
        <meta name="twitter:description" content={language === 'sv' ? 'Hitta evenemang och aktiviteter i Uppsala och hela Sverige' : 'Find events and activities in Uppsala and across Sweden'} />
        <meta name="twitter:image" content="https://nowintown.se/og-image.jpg" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <link rel="alternate" hrefLang="sv" href="https://nowintown.se?lang=sv" />
        <link rel="alternate" hrefLang="en" href="https://nowintown.se?lang=en" />
        <link rel="alternate" hrefLang="x-default" href="https://nowintown.se" />
        
        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'name': 'NowInTown',
            'alternateName': 'NowInTown Events',
            'url': 'https://nowintown.se',
            'description': language === 'sv' ? 'Hitta evenemang och aktiviteter i Uppsala och hela Sverige' : 'Find events and activities in Uppsala and across Sweden',
            'inLanguage': [language],
            'potentialAction': {
              '@type': 'SearchAction',
              'target': {
                '@type': 'EntryPoint',
                'urlTemplate': 'https://nowintown.se/?search={search_term_string}'
              },
              'query-input': 'required name=search_term_string'
            }
          })}
        </script>
      </Helmet>

      {/* Hero Section */}
      <main>
        <section
          className="relative min-h-[70vh] flex items-center justify-center bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80')`,
          }}
          aria-labelledby="hero-title"
        >
          <div className="container mx-auto px-4 text-center text-white">
            <h1 id="hero-title" className="font-display text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 opacity-90">
              {t('hero.subtitle')}
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={scrollToEvents}
              aria-label={language === 'sv' ? 'Scrolla till evenemang' : 'Scroll to events'}
            >
              {t('hero.cta')}
              <ArrowDown className="ml-2 w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </section>

        {/* Filters Section */}
        <section 
          id="filters-section"
          aria-label={language === 'sv' ? 'Sök och filtrera evenemang' : 'Search and filter events'}
          className="container mx-auto px-4 -mt-8 relative z-10"
        >
          <EventFilters
            onSearchChange={(value) => updateFilter('search', value)}
            onDateChange={(value) => updateFilter('date', value)}
            onLocationChange={(value) => updateFilter('location', value)}
            onCategoryChange={(value) => updateFilter('category', value)}
            onFreeOnlyChange={(value) => updateFilter('freeOnly', value)}
            onKeywordsChange={(keywords) => updateFilter('keywords', keywords)}
          />
        </section>

        {/* Events Section */}
        <section 
          id="events-section" 
          aria-label={language === 'sv' ? 'Lista över evenemang' : 'Events listing'}
          className="container mx-auto px-4 py-12"
        >
          <header className="mb-8">
            <h2 className="font-display text-3xl font-bold">{t('events.upcoming')}</h2>
            <p className="text-muted-foreground" aria-live="polite">
              {filteredEvents.length} {t('events.found')}
            </p>
          </header>

          {loading ? (
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              aria-busy="true"
              aria-label={language === 'sv' ? 'Laddar evenemang...' : 'Loading events...'}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="bg-muted animate-pulse rounded-xl h-80" 
                  role="status"
                  aria-label={language === 'sv' ? 'Laddar...' : 'Loading...'}
                />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <ul 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0"
              role="list"
              aria-label={language === 'sv' ? 'Evenemang' : 'Events'}
            >
              {filteredEvents.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-16 bg-muted rounded-xl" role="status">
              <p className="text-xl text-muted-foreground">{t('events.noEvents')}</p>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default Index;
