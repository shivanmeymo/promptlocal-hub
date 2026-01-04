import React, { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCategoryColor, formatDate, formatTime } from '@/lib/format';

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

interface EventCardProps {
  event: Event;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const EventCard: React.FC<EventCardProps> = memo(({ event, isOwner, onEdit }) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const isExternal = event.source === 'tickster' && event.source_url;
  const formattedDate = formatDate(event.start_date, language);
  const formattedTime = formatTime(event.start_time);
  const categoryLabel = t(`category.${event.category}`);
  const categoryColor = getCategoryColor(event.category);

  const cardContent = (
    <article className="h-full" aria-labelledby={`event-title-${event.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
        <CardHeader className="p-0 relative">
          <figure className="aspect-video bg-muted relative overflow-hidden m-0">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={`${event.title} - ${language === 'sv' ? 'Evenemangsbild' : 'Event image'}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div 
                className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                role="img"
                aria-label={`${event.title} - ${language === 'sv' ? 'Standardbild för evenemang' : 'Default event image'}`}
              >
                <span className="text-4xl" aria-hidden="true">🎉</span>
              </div>
            )}
            <Badge className={`absolute top-3 right-3 ${categoryColor}`} aria-label={`${language === 'sv' ? 'Kategori' : 'Category'}: ${categoryLabel}`}>
              {categoryLabel}
            </Badge>
            {isOwner && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-3 left-3"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit ? onEdit() : navigate(`/edit-event/${event.id}`);
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
          <h3 id={`event-title-${event.id}`} className="font-display font-semibold text-lg mb-2 line-clamp-2">
            {event.title}
          </h3>
          
          <dl className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <dt className="sr-only">{language === 'sv' ? 'Datum och tid' : 'Date and time'}</dt>
              <Calendar className="w-4 h-4 text-accent" aria-hidden="true" />
              <dd>
                <time dateTime={`${event.start_date}T${event.start_time}`}>
                  {formattedDate} {language === 'sv' ? 'kl' : 'at'} {formattedTime}
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
            {event.source === 'tickster' && (
              <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                Tickster
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </article>
  );

  if (isExternal) {
    return (
      <a
        href={event.source_url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${event.title} - ${formattedDate} ${language === 'sv' ? 'i' : 'in'} ${event.location} (${language === 'sv' ? 'öppnas i nytt fönster' : 'opens in new window'})`}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link 
      to={`/event/${event.id}`}
      aria-label={`${event.title} - ${formattedDate} ${language === 'sv' ? 'i' : 'in'} ${event.location}`}
    >
      {cardContent}
    </Link>
  );
});

EventCard.displayName = 'EventCard';
