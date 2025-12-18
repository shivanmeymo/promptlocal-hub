import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/components/layout/Layout';
import { EventCard } from '@/components/events/EventCard';
import { EventFilters } from '@/components/events/EventFilters';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location: string;
  category: string;
  is_free: boolean;
  price: number | null;
  image_url: string | null;
  organizer_name: string;
  is_online: boolean | null;
  is_recurring: boolean | null;
  recurring_pattern: string | null;
  status: string;
}

interface CityConfig {
  name: string;
  nameSv: string;
  slug: string;
  region: string;
  regionSv: string;
}

const cities: CityConfig[] = [
  { name: 'Uppsala', nameSv: 'Uppsala', slug: 'uppsala', region: 'Uppsala County', regionSv: 'Uppsala län' },
  { name: 'Stockholm', nameSv: 'Stockholm', slug: 'stockholm', region: 'Stockholm County', regionSv: 'Stockholms län' },
  { name: 'Gothenburg', nameSv: 'Göteborg', slug: 'goteborg', region: 'Västra Götaland', regionSv: 'Västra Götalands län' },
  { name: 'Malmö', nameSv: 'Malmö', slug: 'malmo', region: 'Skåne', regionSv: 'Skåne län' },
  { name: 'Lund', nameSv: 'Lund', slug: 'lund', region: 'Skåne', regionSv: 'Skåne län' },
  { name: 'Linköping', nameSv: 'Linköping', slug: 'linkoping', region: 'Östergötland', regionSv: 'Östergötlands län' },
  { name: 'Umeå', nameSv: 'Umeå', slug: 'umea', region: 'Västerbotten', regionSv: 'Västerbottens län' },
];

const CityEvents: React.FC = () => {
  const { city } = useParams<{ city: string }>();
  const { language, t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);

  const cityConfig = useMemo(() => 
    cities.find(c => c.slug === city?.toLowerCase()) || cities[0],
    [city]
  );

  const cityDisplayName = language === 'sv' ? cityConfig.nameSv : cityConfig.name;
  const regionDisplayName = language === 'sv' ? cityConfig.regionSv : cityConfig.region;

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Search for both Swedish and English city names
        const searchTerms = [cityConfig.nameSv];
        if (cityConfig.name !== cityConfig.nameSv) {
          searchTerms.push(cityConfig.name);
        }
        
        // Build OR query for multiple city name variations
        const orFilter = searchTerms.map(term => `location.ilike.%${term}%`).join(',');
        
        const { data, error } = await supabase
          .from('public_events')
          .select('*')
          .eq('status', 'approved')
          .or(orFilter)
          .gte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [cityConfig]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !event.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (categoryFilter && event.category !== categoryFilter) return false;
      if (freeOnly && !event.is_free) return false;
      
      if (dateFilter) {
        const eventDate = new Date(event.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (dateFilter) {
          case 'today':
            if (eventDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (eventDate.toDateString() !== tomorrow.toDateString()) return false;
            break;
          case 'this-week':
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            if (eventDate > weekEnd) return false;
            break;
          case 'this-month':
            const monthEnd = new Date(today);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            if (eventDate > monthEnd) return false;
            break;
        }
      }
      
      return true;
    });
  }, [events, searchTerm, dateFilter, categoryFilter, freeOnly]);

  // SEO metadata
  const titleEn = `Events in ${cityConfig.name}, Sweden | Activities & Things to Do`;
  const titleSv = `Evenemang i ${cityConfig.nameSv} | Aktiviteter och saker att göra`;
  const title = language === 'sv' ? titleSv : titleEn;

  const descriptionEn = `Discover events, activities, concerts, workshops, and things to do in ${cityConfig.name}, ${cityConfig.region}, Sweden. Find ${cityConfig.name} events this weekend, conferences, festivals, and more.`;
  const descriptionSv = `Upptäck evenemang, aktiviteter, konserter, workshops och saker att göra i ${cityConfig.nameSv}, ${cityConfig.regionSv}. Hitta ${cityConfig.nameSv} evenemang denna helg, konferenser, festivaler och mer.`;
  const description = language === 'sv' ? descriptionSv : descriptionEn;

  const keywordsEn = `events in ${cityConfig.name}, ${cityConfig.name} events, activities in ${cityConfig.name}, things to do in ${cityConfig.name}, ${cityConfig.name} events this weekend, concerts ${cityConfig.name}, workshops ${cityConfig.name}, festivals ${cityConfig.name}, conferences ${cityConfig.name}, ${cityConfig.region} events, Sweden events`;
  const keywordsSv = `evenemang i ${cityConfig.nameSv}, ${cityConfig.nameSv} evenemang, aktiviteter i ${cityConfig.nameSv}, saker att göra i ${cityConfig.nameSv}, ${cityConfig.nameSv} evenemang denna helg, konserter ${cityConfig.nameSv}, workshops ${cityConfig.nameSv}, festivaler ${cityConfig.nameSv}, konferenser i ${cityConfig.nameSv}, ${cityConfig.regionSv} evenemang, Sverige evenemang`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": `https://nowintown.se/events/${cityConfig.slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": filteredEvents.length,
      "itemListElement": filteredEvents.slice(0, 10).map((event, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Event",
          "name": event.title,
          "description": event.description,
          "startDate": `${event.start_date}T${event.start_time}`,
          "endDate": `${event.end_date}T${event.end_time}`,
          "location": {
            "@type": event.is_online ? "VirtualLocation" : "Place",
            "name": event.location,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": cityConfig.nameSv,
              "addressCountry": "SE"
            }
          },
          "organizer": {
            "@type": "Organization",
            "name": event.organizer_name
          },
          "offers": event.is_free ? {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "SEK"
          } : event.price ? {
            "@type": "Offer",
            "price": event.price.toString(),
            "priceCurrency": "SEK"
          } : undefined,
          "image": event.image_url
        }
      }))
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": language === 'sv' ? "Hem" : "Home",
          "item": "https://nowintown.se/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": language === 'sv' ? "Evenemang" : "Events",
          "item": "https://nowintown.se/events"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": cityDisplayName,
          "item": `https://nowintown.se/events/${cityConfig.slug}`
        }
      ]
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={`${keywordsEn}, ${keywordsSv}`} />
        <link rel="canonical" href={`https://nowintown.se/events/${cityConfig.slug}`} />
        
        {/* Alternate language versions */}
        <link rel="alternate" hrefLang="en" href={`https://nowintown.se/events/${cityConfig.slug}?lang=en`} />
        <link rel="alternate" hrefLang="sv" href={`https://nowintown.se/events/${cityConfig.slug}?lang=sv`} />
        <link rel="alternate" hrefLang="x-default" href={`https://nowintown.se/events/${cityConfig.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://nowintown.se/events/${cityConfig.slug}`} />
        <meta property="og:locale" content={language === 'sv' ? 'sv_SE' : 'en_US'} />
        <meta property="og:locale:alternate" content={language === 'sv' ? 'en_US' : 'sv_SE'} />
        <meta property="og:site_name" content="NowInTown" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        
        {/* Geo tags */}
        <meta name="geo.region" content="SE" />
        <meta name="geo.placename" content={cityConfig.nameSv} />
        
        {/* JSON-LD */}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="container mx-auto px-4 py-8" role="main" aria-label={`${cityDisplayName} events`}>

        {/* Hero Section */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild className="p-0 h-auto">
              <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                {language === 'sv' ? 'Alla evenemang' : 'All events'}
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-8 h-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold">
              {language === 'sv' 
                ? `Evenemang i ${cityDisplayName}`
                : `Events in ${cityDisplayName}`
              }
            </h1>
          </div>
          
          <p className="text-lg text-muted-foreground max-w-3xl">
            {language === 'sv'
              ? `Upptäck kommande evenemang, aktiviteter, konserter, workshops och mer i ${cityDisplayName}, ${regionDisplayName}. Hitta saker att göra denna helg eller planera framåt.`
              : `Discover upcoming events, activities, concerts, workshops, and more in ${cityDisplayName}, ${regionDisplayName}. Find things to do this weekend or plan ahead.`
            }
          </p>
        </header>

        <section aria-label={language === 'sv' ? 'Filter' : 'Filters'} className="mb-8">
          <EventFilters
            onSearchChange={setSearchTerm}
            onDateChange={setDateFilter}
            onLocationChange={() => {}}
            onCategoryChange={setCategoryFilter}
            onFreeOnlyChange={setFreeOnly}
            initialLocation={cityConfig.nameSv.toLowerCase()}
          />
        </section>

        {/* Events Count */}
        <div className="mb-6" aria-live="polite" aria-atomic="true">
          <p className="text-muted-foreground">
            {language === 'sv'
              ? `Visar ${filteredEvents.length} evenemang i ${cityDisplayName}`
              : `Showing ${filteredEvents.length} events in ${cityDisplayName}`
            }
          </p>
        </div>

        {/* Events Grid */}
        <section 
          aria-label={language === 'sv' ? `Evenemang i ${cityDisplayName}` : `Events in ${cityDisplayName}`}
          aria-busy={loading}
        >
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold mb-2">
                {language === 'sv' 
                  ? `Inga evenemang hittades i ${cityDisplayName}`
                  : `No events found in ${cityDisplayName}`
                }
              </h2>
              <p className="text-muted-foreground mb-6">
                {language === 'sv'
                  ? 'Prova att ändra dina filter eller utforska andra städer.'
                  : 'Try adjusting your filters or explore other cities.'
                }
              </p>
              <Button asChild>
                <Link to="/">
                  {language === 'sv' ? 'Se alla evenemang' : 'View all events'}
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* SEO Content Section */}
        <section className="mt-16 prose prose-neutral dark:prose-invert max-w-none" aria-label={language === 'sv' ? 'Om evenemang i ' + cityDisplayName : 'About events in ' + cityDisplayName}>
          <h2 className="text-2xl font-bold mb-4">
            {language === 'sv'
              ? `Hitta evenemang och aktiviteter i ${cityDisplayName}`
              : `Find Events and Activities in ${cityDisplayName}`
            }
          </h2>
          <p className="text-muted-foreground">
            {language === 'sv'
              ? `${cityDisplayName} erbjuder ett rikt utbud av evenemang året runt. Från konserter och festivaler till workshops, konferenser och community-evenemang - det finns alltid något att uppleva i ${cityDisplayName}. Oavsett om du letar efter gratisevenemang, kulturella upplevelser, sportevenemang eller affärsnätverk, hjälper vår plattform dig att hitta precis det du söker i ${regionDisplayName}.`
              : `${cityDisplayName} offers a rich variety of events throughout the year. From concerts and festivals to workshops, conferences, and community events - there's always something to experience in ${cityDisplayName}. Whether you're looking for free events, cultural experiences, sports events, or business networking, our platform helps you find exactly what you're looking for in ${regionDisplayName}.`
            }
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">
            {language === 'sv' ? 'Populära evenemangskategorier' : 'Popular Event Categories'}
          </h3>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 list-none p-0">
            <li className="bg-secondary/50 rounded-lg px-3 py-2 text-sm">
              {language === 'sv' ? `Konserter i ${cityDisplayName}` : `Concerts in ${cityDisplayName}`}
            </li>
            <li className="bg-secondary/50 rounded-lg px-3 py-2 text-sm">
              {language === 'sv' ? `Workshops i ${cityDisplayName}` : `Workshops in ${cityDisplayName}`}
            </li>
            <li className="bg-secondary/50 rounded-lg px-3 py-2 text-sm">
              {language === 'sv' ? `Festivaler i ${cityDisplayName}` : `Festivals in ${cityDisplayName}`}
            </li>
            <li className="bg-secondary/50 rounded-lg px-3 py-2 text-sm">
              {language === 'sv' ? `Konferenser i ${cityDisplayName}` : `Conferences in ${cityDisplayName}`}
            </li>
            <li className="bg-secondary/50 rounded-lg px-3 py-2 text-sm">
              {language === 'sv' ? `Sportevenemang i ${cityDisplayName}` : `Sports events in ${cityDisplayName}`}
            </li>
            <li className="bg-secondary/50 rounded-lg px-3 py-2 text-sm">
              {language === 'sv' ? `Konstutställningar i ${cityDisplayName}` : `Art exhibitions in ${cityDisplayName}`}
            </li>
            <li className="bg-secondary/50 rounded-lg px-3 py-2 text-sm">
              {language === 'sv' ? `Matfestivaler i ${cityDisplayName}` : `Food festivals in ${cityDisplayName}`}
            </li>
            <li className="bg-secondary/50 rounded-lg px-3 py-2 text-sm">
              {language === 'sv' ? `Nätverksevenemang i ${cityDisplayName}` : `Networking events in ${cityDisplayName}`}
            </li>
          </ul>
        </section>
      </main>
    </Layout>
  );
};

export default CityEvents;
