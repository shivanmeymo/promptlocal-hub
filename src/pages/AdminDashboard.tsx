import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, X, Clock, Eye, MessageSquare, Calendar, MapPin, User, Mail, DollarSign, Tag, ExternalLink, Image as ImageIcon, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layout } from '@/components/layout/Layout';
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
  status: 'pending' | 'approved' | 'rejected';
  organizer_name: string;
  organizer_email: string;
  organizer_description: string | null;
  organizer_website: string | null;
  image_url: string | null;
  admin_notes: string | null;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | 'view' | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkAdminRole();
  }, [user, navigate]);

  const checkAdminRole = async () => {
    if (!user) return;

    // Allow explicit access for Shivan by email
    if (user.email && user.email.toLowerCase() === 'shivan.meymo@gmail.com') {
      setIsAdmin(true);
      fetchEvents();
      return;
    }
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (error || !data) {
      toast({
        title: language === 'sv' ? 'Åtkomst nekad' : 'Access Denied',
        description: language === 'sv' ? 'Du har inte behörighet att visa denna sida.' : 'You do not have permission to view this page.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    setIsAdmin(true);
    fetchEvents();
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: language === 'sv' ? 'Fel' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedEvent) return;
    setActionLoading(true);

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    const { error } = await supabase
      .from('events')
      .update({
        status: newStatus,
        admin_notes: adminNotes || null,
        approved_at: action === 'approve' ? new Date().toISOString() : null,
        approved_by: action === 'approve' ? user?.id : null,
      })
      .eq('id', selectedEvent.id);

    if (error) {
      toast({
        title: language === 'sv' ? 'Fel' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      try {
        await supabase.functions.invoke('send-event-approval-notification', {
          body: {
            event_id: selectedEvent.id,
            status: newStatus,
            admin_notes: adminNotes,
          },
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }

      toast({
        title: action === 'approve' 
          ? (language === 'sv' ? 'Event godkänt' : 'Event Approved')
          : (language === 'sv' ? 'Event avvisat' : 'Event Rejected'),
        description: language === 'sv' 
          ? 'Arrangören har meddelats via e-post.' 
          : 'The organizer has been notified via email.',
      });
      
      fetchEvents();
    }

    setSelectedEvent(null);
    setAdminNotes('');
    setDialogAction(null);
    setActionLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            {language === 'sv' ? 'Väntar' : 'Pending'}
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
            <Check className="w-3 h-3 mr-1" />
            {language === 'sv' ? 'Godkänd' : 'Approved'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
            <X className="w-3 h-3 mr-1" />
            {language === 'sv' ? 'Avvisad' : 'Rejected'}
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryLabels: Record<string, { en: string; sv: string }> = {
      music: { en: 'Music', sv: 'Musik' },
      sports: { en: 'Sports', sv: 'Sport' },
      art: { en: 'Art', sv: 'Konst' },
      food: { en: 'Food', sv: 'Mat' },
      business: { en: 'Business', sv: 'Näringsliv' },
      education: { en: 'Education', sv: 'Utbildning' },
      community: { en: 'Community', sv: 'Samhälle' },
      other: { en: 'Other', sv: 'Övrigt' },
    };
    
    return (
      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
        <Tag className="w-3 h-3 mr-1" />
        {categoryLabels[category]?.[language] || category}
      </Badge>
    );
  };

  const filterEventsByStatus = (status: string) => {
    if (status === 'all') return events;
    return events.filter(e => e.status === status);
  };

  const openDialog = (event: Event, action: 'approve' | 'reject' | 'view') => {
    setSelectedEvent(event);
    setDialogAction(action);
    setAdminNotes(event.admin_notes || '');
  };

  if (!isAdmin || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-muted"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const pendingCount = filterEventsByStatus('pending').length;
  const approvedCount = filterEventsByStatus('approved').length;
  const rejectedCount = filterEventsByStatus('rejected').length;

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {language === 'sv' ? 'Admin Dashboard' : 'Admin Dashboard'}</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">
                {language === 'sv' ? 'Admin Dashboard' : 'Admin Dashboard'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'sv' ? 'Granska och hantera event-inlämningar' : 'Review and manage event submissions'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent"></div>
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'sv' ? 'Väntar' : 'Pending'}
                  </p>
                  <p className="text-3xl font-bold text-warning">{pendingCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent"></div>
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'sv' ? 'Godkända' : 'Approved'}
                  </p>
                  <p className="text-3xl font-bold text-success">{approvedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent"></div>
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'sv' ? 'Avvisade' : 'Rejected'}
                  </p>
                  <p className="text-3xl font-bold text-destructive">{rejectedCount}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent"></div>
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'sv' ? 'Totalt' : 'Total'}
                  </p>
                  <p className="text-3xl font-bold text-accent">{events.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="pending" className="data-[state=active]:bg-warning/10 data-[state=active]:text-warning">
              {language === 'sv' ? 'Väntar' : 'Pending'} ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-success/10 data-[state=active]:text-success">
              {language === 'sv' ? 'Godkända' : 'Approved'} ({approvedCount})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
              {language === 'sv' ? 'Avvisade' : 'Rejected'} ({rejectedCount})
            </TabsTrigger>
            <TabsTrigger value="all">
              {language === 'sv' ? 'Alla' : 'All'} ({events.length})
            </TabsTrigger>
          </TabsList>

          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <TabsContent key={status} value={status}>
              {filterEventsByStatus(status).length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      {language === 'sv' ? 'Inga event att visa' : 'No events to display'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filterEventsByStatus(status).map((event) => (
                    <Card key={event.id} className="group hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row">
                          {/* Event Image */}
                          {event.image_url ? (
                            <div className="lg:w-48 h-48 lg:h-auto flex-shrink-0">
                              <img
                                src={event.image_url}
                                alt={event.title}
                                className="w-full h-full object-cover rounded-t-lg lg:rounded-l-lg lg:rounded-tr-none"
                              />
                            </div>
                          ) : (
                            <div className="lg:w-48 h-48 lg:h-auto flex-shrink-0 bg-muted flex items-center justify-center rounded-t-lg lg:rounded-l-lg lg:rounded-tr-none">
                              <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                            </div>
                          )}

                          {/* Event Content */}
                          <div className="flex-1 p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                {/* Status and Category */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {getStatusBadge(event.status)}
                                  {getCategoryBadge(event.category)}
                                  {event.is_free && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                                      {language === 'sv' ? 'Gratis' : 'Free'}
                                    </Badge>
                                  )}
                                </div>

                                {/* Title */}
                                <h3 className="font-display text-xl font-semibold group-hover:text-primary transition-colors">
                                  {event.title}
                                </h3>

                                {/* Description */}
                                <p className="text-muted-foreground text-sm line-clamp-2">
                                  {event.description}
                                </p>

                                {/* Meta Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(event.start_date)} {formatTime(event.start_time)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="w-4 h-4" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="w-4 h-4" />
                                    <span>{event.organizer_name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <DollarSign className="w-4 h-4" />
                                    <span>{event.is_free ? (language === 'sv' ? 'Gratis' : 'Free') : `${event.price} SEK`}</span>
                                  </div>
                                </div>

                                {/* Admin Notes */}
                                {event.admin_notes && (
                                  <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                      <MessageSquare className="w-3 h-3" />
                                      {language === 'sv' ? 'Admin-anteckningar' : 'Admin Notes'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{event.admin_notes}</p>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDialog(event, 'view')}
                                  className="flex-1 lg:flex-none"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  {language === 'sv' ? 'Visa' : 'View'}
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => navigate(`/edit-event/${event.id}`)}
                                  className="flex-1 lg:flex-none"
                                >
                                  <Edit2 className="w-4 h-4 mr-1" />
                                  {language === 'sv' ? 'Redigera' : 'Edit'}
                                </Button>
                                {event.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => openDialog(event, 'approve')}
                                      className="flex-1 lg:flex-none bg-success hover:bg-success/90 text-success-foreground"
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      {language === 'sv' ? 'Godkänn' : 'Approve'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => openDialog(event, 'reject')}
                                      className="flex-1 lg:flex-none"
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      {language === 'sv' ? 'Avvisa' : 'Reject'}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Detail/Action Dialog */}
      <Dialog open={dialogAction !== null} onOpenChange={() => { setDialogAction(null); setSelectedEvent(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {selectedEvent && getStatusBadge(selectedEvent.status)}
                  {selectedEvent && getCategoryBadge(selectedEvent.category)}
                </div>
                <DialogTitle className="font-display text-2xl">
                  {selectedEvent?.title}
                </DialogTitle>
                <DialogDescription className="text-base">
                  {dialogAction === 'view' && (language === 'sv' ? 'Event-detaljer' : 'Event Details')}
                  {dialogAction === 'approve' && (language === 'sv' ? 'Granska och godkänn detta event' : 'Review and approve this event')}
                  {dialogAction === 'reject' && (language === 'sv' ? 'Granska och avvisa detta event' : 'Review and reject this event')}
                </DialogDescription>
              </DialogHeader>

              {selectedEvent && (
                <div className="space-y-6">
                  {/* Event Image */}
                  {selectedEvent.image_url && (
                    <div className="rounded-xl overflow-hidden">
                      <img
                        src={selectedEvent.image_url}
                        alt={selectedEvent.title}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}

                  {/* Event Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date & Time */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          {language === 'sv' ? 'Datum & Tid' : 'Date & Time'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">{language === 'sv' ? 'Start:' : 'Start:'}</span> {formatDate(selectedEvent.start_date)} {formatTime(selectedEvent.start_time)}</p>
                        <p><span className="text-muted-foreground">{language === 'sv' ? 'Slut:' : 'End:'}</span> {formatDate(selectedEvent.end_date)} {formatTime(selectedEvent.end_time)}</p>
                      </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          {language === 'sv' ? 'Plats' : 'Location'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p>{selectedEvent.location}</p>
                      </CardContent>
                    </Card>

                    {/* Organizer */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          {language === 'sv' ? 'Arrangör' : 'Organizer'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p className="font-medium">{selectedEvent.organizer_name}</p>
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {selectedEvent.organizer_email}
                        </p>
                        {selectedEvent.organizer_website && (
                          <a
                            href={selectedEvent.organizer_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-accent hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {language === 'sv' ? 'Webbplats' : 'Website'}
                          </a>
                        )}
                      </CardContent>
                    </Card>

                    {/* Price */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          {language === 'sv' ? 'Pris' : 'Price'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <p className="text-lg font-semibold">
                          {selectedEvent.is_free ? (
                            <span className="text-success">{language === 'sv' ? 'Gratis' : 'Free'}</span>
                          ) : (
                            `${selectedEvent.price} SEK`
                          )}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Description */}
                  <div>
                    <h4 className="font-medium mb-2">{language === 'sv' ? 'Beskrivning' : 'Description'}</h4>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{selectedEvent.description}</p>
                  </div>

                  {selectedEvent.organizer_description && (
                    <div>
                      <h4 className="font-medium mb-2">{language === 'sv' ? 'Om arrangören' : 'About Organizer'}</h4>
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap">{selectedEvent.organizer_description}</p>
                    </div>
                  )}

                  {/* Admin Notes Input */}
                  {(dialogAction === 'approve' || dialogAction === 'reject') && (
                    <div className="pt-4 border-t">
                      <Label htmlFor="adminNotes" className="text-base font-medium">
                        {language === 'sv' ? 'Admin-anteckningar' : 'Admin Notes'}
                        <span className="text-muted-foreground font-normal ml-2">
                          ({language === 'sv' ? 'valfritt' : 'optional'})
                        </span>
                      </Label>
                      <Textarea
                        id="adminNotes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder={dialogAction === 'reject' 
                          ? (language === 'sv' ? 'Ange anledning till avvisning...' : 'Enter reason for rejection...')
                          : (language === 'sv' ? 'Eventuella kommentarer...' : 'Any comments...')
                        }
                        rows={3}
                        className="mt-2"
                      />
                    </div>
                  )}

                  {/* Existing Admin Notes */}
                  {dialogAction === 'view' && selectedEvent.admin_notes && (
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <p className="text-sm font-medium flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        {language === 'sv' ? 'Admin-anteckningar' : 'Admin Notes'}
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedEvent.admin_notes}</p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="mt-6 gap-2">
                <Button variant="outline" onClick={() => { setDialogAction(null); setSelectedEvent(null); }}>
                  {language === 'sv' ? 'Stäng' : 'Close'}
                </Button>
                {dialogAction === 'approve' && (
                  <Button 
                    onClick={() => handleAction('approve')} 
                    disabled={actionLoading}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {actionLoading ? (language === 'sv' ? 'Godkänner...' : 'Approving...') : (language === 'sv' ? 'Godkänn Event' : 'Approve Event')}
                  </Button>
                )}
                {dialogAction === 'reject' && (
                  <Button variant="destructive" onClick={() => handleAction('reject')} disabled={actionLoading}>
                    <X className="w-4 h-4 mr-1" />
                    {actionLoading ? (language === 'sv' ? 'Avvisar...' : 'Rejecting...') : (language === 'sv' ? 'Avvisa Event' : 'Reject Event')}
                  </Button>
                )}
              </DialogFooter>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminDashboard;
