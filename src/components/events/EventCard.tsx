import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface EventCardProps {
  event: Event;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, isOwner, onEdit }) => {
  const { t, language } = useLanguage();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  const getCategoryLabel = (category: string) => {
    const key = `category.${category}`;
    return t(key);
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

  return (
    <Link 
      to={`/event/${event.id}`}
      aria-label={`${event.title} - ${formatDate(event.start_date)} ${language === 'sv' ? 'i' : 'in'} ${event.location}`}
    >
      <article className="h-full">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-in cursor-pointer h-full focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
          <CardHeader className="p-0 relative">
            <figure className="aspect-video bg-muted relative overflow-hidden m-0">
              {event.image_url ? (
                <img
                  src={event.image_url}
                  alt={`${language === 'sv' ? 'Bild för' : 'Image for'} ${event.title}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div 
                  className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                  role="img"
                  aria-label={language === 'sv' ? 'Standardbild för evenemang' : 'Default event image'}
                >
                  <span className="text-4xl" aria-hidden="true">🎉</span>
                </div>
              )}
              <Badge className={`absolute top-3 right-3 ${getCategoryColor(event.category)}`}>
                {getCategoryLabel(event.category)}
              </Badge>
              {isOwner && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-3 left-3 focus:ring-2 focus:ring-offset-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  aria-label={`${t('events.edit')} ${event.title}`}
                >
                  <Edit2 className="w-4 h-4 mr-1" aria-hidden="true" />
                  {t('events.edit')}
                </Button>
              )}
            </figure>
          </CardHeader>
          <CardContent className="p-4">
            <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2">
              {event.title}
            </h3>
            
            <dl className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <dt className="sr-only">{language === 'sv' ? 'Datum och tid' : 'Date and time'}</dt>
                <Calendar className="w-4 h-4 text-accent" aria-hidden="true" />
                <dd>
                  <time dateTime={`${event.start_date}T${event.start_time}`}>
                    {formatDate(event.start_date)} {language === 'sv' ? 'kl' : 'at'} {formatTime(event.start_time)}
                  </time>
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <dt className="sr-only">{language === 'sv' ? 'Plats' : 'Location'}</dt>
                <MapPin className="w-4 h-4 text-accent" aria-hidden="true" />
                <dd>{event.location}</dd>
              </div>
              {event.organizer_name && (
                <div className="flex items-center gap-2 text-xs">
                  <dt className="sr-only">{language === 'sv' ? 'Arrangör' : 'Organizer'}</dt>
                  <dd className="text-muted-foreground">
                    {language === 'sv' ? 'Av' : 'By'} {event.organizer_name}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-3 flex items-center justify-between">
              {event.is_free ? (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  {t('search.free')}
                </Badge>
              ) : (
                <span className="font-semibold text-primary" aria-label={`${language === 'sv' ? 'Pris' : 'Price'}: ${event.price} SEK`}>
                  {event.price} SEK
                </span>
              )}
              {event.status === 'pending' && (
                <Badge variant="outline" className="text-warning border-warning">
                  {t('events.pending')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </article>
    </Link>
  );
};
