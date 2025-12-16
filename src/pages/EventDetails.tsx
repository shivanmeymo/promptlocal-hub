import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Mail, Globe, Share2, Copy, Check, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Layout } from '@/components/layout/Layout';
import { AddToCalendar } from '@/components/events/AddToCalendar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  price: number | null;
  image_url: string | null;
  status: string;
  organizer_name: string;
  organizer_email: string;
  organizer_description: string | null;
  organizer_website?: string | null;
  is_online?: boolean;
  user_id: string;
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
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
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
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  const handleShare = async (method: 'copy' | 'twitter' | 'facebook' | 'whatsapp') => {
    const url = window.location.href;
    const text = `${event?.title} - ${formatDate(event?.start_date || '')}`;

    switch (method) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast({
          title: language === 'sv' ? 'Länk kopierad!' : 'Link copied!',
        });
        setTimeout(() => setCopied(false), 2000);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      music: 'bg-purple-100 text-purple-800',
      sports: 'bg-green-100 text-green-800',
      art: 'bg-pink-100 text-pink-800',
      food: 'bg-orange-100 text-orange-800',
      business: 'bg-blue-100 text-blue-800',
      education: 'bg-indigo-100 text-indigo-800',
      community: 'bg-teal-100 text-teal-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6" />
            <div className="aspect-video bg-muted rounded-xl mb-8" />
            <div className="h-10 bg-muted rounded w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <Layout>
      <Helmet>
        <title>{event.title} - NowInTown</title>
        <meta name="description" content={event.description.slice(0, 160)} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'sv' ? 'Tillbaka' : 'Back'}
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Image */}
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-6xl">🎉</span>
                </div>
              )}
            </div>

            {/* Event Title & Category */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge className={getCategoryColor(event.category)}>
                  {t(`category.${event.category}`)}
                </Badge>
                {event.is_online && (
                  <Badge variant="outline">
                    {language === 'sv' ? 'Online' : 'Online'}
                  </Badge>
                )}
                {event.is_free ? (
                  <Badge className="bg-success/10 text-success">
                    {t('search.free')}
                  </Badge>
                ) : (
                  <Badge variant="secondary">{event.price} SEK</Badge>
                )}
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                {event.title}
              </h1>
            </div>

            {/* Event Details */}
            <div className="flex flex-wrap gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{formatDate(event.start_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
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
                <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
                  WhatsApp
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${event.organizer_email}`} className="hover:text-primary">
                      {event.organizer_email}
                    </a>
                  </div>
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
                  <p className="font-medium">{formatDate(event.start_date)}</p>
                  <p className="text-sm">{formatTime(event.start_time)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'sv' ? 'Slutdatum' : 'End Date'}
                  </p>
                  <p className="font-medium">{formatDate(event.end_date)}</p>
                  <p className="text-sm">{formatTime(event.end_time)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'sv' ? 'Plats' : 'Location'}
                  </p>
                  <p className="font-medium">{event.location}</p>
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
