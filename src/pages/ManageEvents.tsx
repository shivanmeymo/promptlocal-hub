import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Plus, Trash2, Edit2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Layout } from '@/components/layout/Layout';
import { BackButton } from '@/components/BackButton';
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
  price?: number;
  image_url?: string;
  status: string;
  created_at: string;
}

const ManageEvents: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserEvents();
  }, [user, navigate]);

  const fetchUserEvents = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setEvents(data as Event[]);
    }
    setLoading(false);
  };

  const handleDelete = async (eventId: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: language === 'sv' ? 'Event raderat' : 'Event deleted',
      });
      fetchUserEvents();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">{t('events.pending')}</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-success/10 text-success border-success">{t('events.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">{t('events.rejected')}</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (!user) return null;

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {t('nav.manageEvents')}</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        <BackButton className="mb-4" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold">{t('nav.manageEvents')}</h1>
            <p className="text-muted-foreground">
              {language === 'sv' ? 'Hantera dina skapade event' : 'Manage your created events'}
            </p>
          </div>
          <Link to="/create-event">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              {t('nav.createEvent')}
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted animate-pulse rounded-xl h-32" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid gap-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <h3 className="font-display font-semibold text-lg">{event.title}</h3>
                        {getStatusBadge(event.status)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.start_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.start_time.slice(0, 5)}
                        </span>
                        <span>{event.location}</span>
                        <Badge variant="secondary">{t(`category.${event.category}`)}</Badge>
                        {event.is_free ? (
                          <Badge className="bg-success/10 text-success">{t('search.free')}</Badge>
                        ) : (
                          <span className="font-medium">{event.price} SEK</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-destructive" />
                              {language === 'sv' ? 'Ta bort event?' : 'Delete event?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'sv'
                                ? 'Är du säker på att du vill ta bort detta event? Denna åtgärd kan inte ångras.'
                                : 'Are you sure you want to delete this event? This action cannot be undone.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(event.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {t('events.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <CardContent>
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold text-lg mb-2">
                {language === 'sv' ? 'Inga event än' : 'No events yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {language === 'sv'
                  ? 'Du har inte skapat några event. Skapa ditt första event nu!'
                  : "You haven't created any events. Create your first event now!"}
              </p>
              <Link to="/create-event">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('nav.createEvent')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ManageEvents;
