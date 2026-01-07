import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Globe, Share2, Copy, Check, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Layout } from '@/components/layout/Layout';
import { AddToCalendar } from '@/components/events/AddToCalendar';
import { ContactOrganizerDialog } from '@/components/events/ContactOrganizerDialog';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryColor, formatDateLong, formatTime } from '@/lib/format';

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
  price: number | null;
  image_url: string | null;
  status: string;
  organizer_name: string;
  organizer_description: string | null;
  organizer_website?: string | null;
  is_online?: boolean;
  user_id?: string;
}

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isOwner = user && event && user.id === event.user_id;

  useEffect(() => {
    if (!id) return;
    
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          toast({
            title: t('common.error'),
            description: language === 'sv' ? 'Event hittades inte' : 'Event not found',
            variant: 'destructive',
          });
          navigate('/');
        } else {
          setEvent(data as Event);
        }
        setLoading(false);
      });
  }, [id, navigate, toast, t, language]);

  const handleShare = useCallback(async (method: 'copy' | 'twitter' | 'facebook' | 'instagram' | 'email') => {
    if (!event) return;
    
    const url = window.location.href;
    const text = `${event.title} - ${formatDateLong(event.start_date, language)}`;

    switch (method) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast({ title: language === 'sv' ? 'Länk kopierad!' : 'Link copied!' });
        setTimeout(() => setCopied(false), 2000);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'instagram':
        await navigator.clipboard.writeText(url);
        toast({
          title: language === 'sv' ? 'Länk kopierad! Dela på Instagram' : 'Link copied! Share on Instagram',
          description: language === 'sv' ? 'Klistra in länken i din Instagram story eller DM' : 'Paste the link in your Instagram story or DM',
        });
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
    }
  }, [event, language, toast]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12" aria-busy="true">
          <div className="h-8 bg-muted rounded w-32 mb-6" />
          <div className="aspect-video bg-muted rounded-xl mb-8" />
          <div className="h-10 bg-muted rounded w-3/4 mb-4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </Layout>
    );
  }

  if (!event) return null;

  const categoryColor = getCategoryColor(event.category);
  const startDateFormatted = formatDateLong(event.start_date, language);
  const endDateFormatted = formatDateLong(event.end_date, language);
  const startTimeFormatted = formatTime(event.start_time);
  const endTimeFormatted = formatTime(event.end_time);

  return (
    <Layout>
      <Helmet>
        <html lang={language} />
        <title>{event.title} - NowInTown</title>
        <meta name="description" content={event.description.slice(0, 160)} />
        <link rel="canonical" href={`https://nowintown.se/events/${event.id}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="event" />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description.slice(0, 160)} />
        <meta property="og:url" content={`https://nowintown.se/events/${event.id}`} />
        <meta property="og:image" content={event.image_url || 'https://nowintown.se/og-image.jpg'} />
        <meta property="og:locale" content={language === 'sv' ? 'sv_SE' : 'en_US'} />
        <meta property="og:site_name" content="NowInTown" />
        <meta property="event:start_time" content={`${event.start_date}T${event.start_time}`} />
        <meta property="event:end_time" content={`${event.end_date}T${event.end_time}`} />
        <meta property="event:location" content={event.location} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.description.slice(0, 160)} />
        <meta name="twitter:image" content={event.image_url || 'https://nowintown.se/og-image.jpg'} />
        
        {/* Structured Data - Event */}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            'name': event.title,
            'description': event.description,
            'startDate': `${event.start_date}T${event.start_time}`,
            'endDate': `${event.end_date}T${event.end_time}`,
            'eventStatus': 'https://schema.org/EventScheduled',
            'eventAttendanceMode': event.is_online ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
            'location': event.is_online ? {
              '@type': 'VirtualLocation',
              'url': event.organizer_website || 'https://nowintown.se'
            } : {
              '@type': 'Place',
              'name': event.location,
              'address': {
                '@type': 'PostalAddress',
                'addressLocality': event.location,
                'addressCountry': 'SE'
              }
            },
            'image': event.image_url || 'https://nowintown.se/og-image.jpg',
            'organizer': {
              '@type': 'Organization',
              'name': event.organizer_name,
              'url': event.organizer_website
            },
            'offers': {
              '@type': 'Offer',
              'price': event.is_free ? 0 : event.price,
              'priceCurrency': 'SEK',
              'availability': 'https://schema.org/InStock',
              'url': `https://nowintown.se/events/${event.id}`
            }
          })}
        </script>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
          aria-label={language === 'sv' ? 'Gå tillbaka' : 'Go back'}
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          {language === 'sv' ? 'Tillbaka' : 'Back'}
        </Button>

        <article className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <figure className="aspect-video rounded-xl overflow-hidden bg-muted">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={`${event.title} - ${language === 'sv' ? 'Evenemangsbild' : 'Event image'}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center" role="img" aria-label={language === 'sv' ? 'Standard evenemangsbild' : 'Default event image'}>
                  <span className="text-6xl" aria-hidden="true">🎉</span>
                </div>
              )}
            </figure>

            {/* Event Title & Category */}
            <header>
              <div className="flex items-center gap-3 mb-3" role="list" aria-label={language === 'sv' ? 'Evenemangsinformation' : 'Event information'}>
                <Badge className={categoryColor} role="listitem">
                  {t(`category.${event.category}`)}
                </Badge>
                {event.is_online && (
                  <Badge variant="outline" role="listitem">
                    {language === 'sv' ? 'Online' : 'Online'}
                  </Badge>
                )}
                {event.is_free ? (
                  <Badge className="bg-success/10 text-success" role="listitem">
                    {t('search.free')}
                  </Badge>
                ) : (
                  <Badge variant="secondary" role="listitem">{event.price} SEK</Badge>
                )}
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                {event.title}
              </h1>
            </header>

            {/* Event Details */}
            <dl className="flex flex-wrap gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
                <dt className="sr-only">{language === 'sv' ? 'Datum' : 'Date'}</dt>
                <dd>{startDateFormatted}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" aria-hidden="true" />
                <dt className="sr-only">{language === 'sv' ? 'Tid' : 'Time'}</dt>
                <dd>{startTimeFormatted} - {endTimeFormatted}</dd>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
                <dt className="sr-only">{language === 'sv' ? 'Plats' : 'Location'}</dt>
                <span>{event.location}</span>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">
                {language === 'sv' ? 'Om eventet' : 'About the Event'}
              </h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {event.description}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Add to Calendar */}
            <AddToCalendar event={event} />

            {/* Edit Button for Owner */}
            {isOwner && (
              <Link to={`/edit-event/${event.id}`}>
                <Button variant="outline" className="w-full gap-2">
                  <Edit2 className="w-4 h-4" />
                  {language === 'sv' ? 'Redigera event' : 'Edit Event'}
                </Button>
              </Link>
            )}

            {/* Share Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  {language === 'sv' ? 'Dela event' : 'Share Event'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem onClick={() => handleShare('copy')}>
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {language === 'sv' ? 'Kopiera länk' : 'Copy link'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('twitter')}>
                  Twitter / X
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('facebook')}>
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('instagram')}>
                  Instagram
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('email')}>
                  {language === 'sv' ? 'E-post' : 'Email'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Organizer Card */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {language === 'sv' ? 'Arrangör' : 'Organizer'}
                </h3>
                <div className="space-y-3">
                  <p className="font-medium">{event.organizer_name}</p>
                  {event.organizer_description && (
                    <p className="text-sm text-muted-foreground">
                      {event.organizer_description}
                    </p>
                  )}
                  {event.organizer_website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <a 
                        href={event.organizer_website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-primary"
                      >
                        {language === 'sv' ? 'Webbplats' : 'Website'}
                      </a>
                    </div>
                  )}
                  <div className="pt-2">
                    <ContactOrganizerDialog 
                      eventId={event.id}
                      eventTitle={event.title}
                      organizerName={event.organizer_name}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Info Card */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'sv' ? 'Startdatum' : 'Start Date'}
                  </p>
                  <p className="font-medium">{startDateFormatted}</p>
                  <p className="text-sm">{startTimeFormatted}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'sv' ? 'Slutdatum' : 'End Date'}
                  </p>
                  <p className="font-medium">{endDateFormatted}</p>
                  <p className="text-sm">{endTimeFormatted}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'sv' ? 'Plats' : 'Location'}
                  </p>
                  {!event.is_online ? (
                    <>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {event.location}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </>
                  ) : (
                    <p className="font-medium">{event.location}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetails;
