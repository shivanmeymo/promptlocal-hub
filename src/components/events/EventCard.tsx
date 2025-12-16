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
    <Link to={`/event/${event.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fade-in cursor-pointer h-full">
        <CardHeader className="p-0 relative">
          <div className="aspect-video bg-muted relative overflow-hidden">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-4xl">🎉</span>
              </div>
            )}
            <Badge className={`absolute top-3 right-3 ${getCategoryColor(event.category)}`}>
              {getCategoryLabel(event.category)}
            </Badge>
            {isOwner && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-3 left-3"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                {t('events.edit')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-display font-semibold text-lg mb-2 line-clamp-2">
            {event.title}
          </h3>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span>{formatDate(event.start_date)} {language === 'sv' ? 'kl' : 'at'} {formatTime(event.start_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span>{event.location}</span>
            </div>
            {event.organizer_name && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">
                  {language === 'sv' ? 'Av' : 'By'} {event.organizer_name}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            {event.is_free ? (
              <Badge variant="secondary" className="bg-success/10 text-success">
                {t('search.free')}
              </Badge>
            ) : (
              <span className="font-semibold text-primary">{event.price} SEK</span>
            )}
            {event.status === 'pending' && (
              <Badge variant="outline" className="text-warning border-warning">
                {t('events.pending')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
