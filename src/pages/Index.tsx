import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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
}

const Index: React.FC = () => {
  const { t, language } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    date: '',
    location: '',
    category: '',
    freeOnly: false,
    keywords: [] as string[],
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'approved')
      .order('start_date', { ascending: true });

    if (!error && data) {
      setEvents(data as Event[]);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let result = [...events];

    // Apply keyword search
    if (filters.keywords.length > 0) {
      result = result.filter((e) =>
        filters.keywords.some(keyword => {
          const kw = keyword.toLowerCase();
          return (
            e.title.toLowerCase().includes(kw) ||
            e.description.toLowerCase().includes(kw) ||
            e.location.toLowerCase().includes(kw)
          );
        })
      );
    } else if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(searchLower) ||
          e.description.toLowerCase().includes(searchLower) ||
          e.location.toLowerCase().includes(searchLower)
      );
    }

    if (filters.location) {
      result = result.filter((e) =>
        e.location.toLowerCase().includes(filters.location.toLowerCase())
      );
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

    setFilteredEvents(result);
  };

  const scrollToEvents = () => {
    const element = document.getElementById('events-section');
    if (element) {
      const offset = 80; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {language === 'sv' ? 'Upptäck Event i Sverige' : 'Discover Events in Sweden'}</title>
        <meta
          name="description"
          content={
            language === 'sv'
              ? 'Upptäck tusentals event och aktiviteter över hela Sverige. Hitta konserter, sportevent, workshops och mer.'
              : 'Discover thousands of events and activities across Sweden. Find concerts, sports events, workshops and more.'
          }
        />
      </Helmet>

      {/* Hero Section */}
      <section
        className="relative min-h-[70vh] flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80')`,
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 opacity-90">
            {t('hero.subtitle')}
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg"
            onClick={scrollToEvents}
          >
            {t('hero.cta')}
            <ArrowDown className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Filters Section */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <EventFilters
          onSearchChange={(value) => setFilters((f) => ({ ...f, search: value }))}
          onDateChange={(value) => setFilters((f) => ({ ...f, date: value }))}
          onLocationChange={(value) => setFilters((f) => ({ ...f, location: value }))}
          onCategoryChange={(value) => setFilters((f) => ({ ...f, category: value }))}
          onFreeOnlyChange={(value) => setFilters((f) => ({ ...f, freeOnly: value }))}
          onKeywordsChange={(keywords) => setFilters((f) => ({ ...f, keywords }))}
        />
      </section>

      {/* Events Section */}
      <section id="events-section" className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold">{t('events.upcoming')}</h2>
          <p className="text-muted-foreground">
            {filteredEvents.length} {t('events.found')}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-muted animate-pulse rounded-xl h-80" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted rounded-xl">
            <p className="text-xl text-muted-foreground">{t('events.noEvents')}</p>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Index;
