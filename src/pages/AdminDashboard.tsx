import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, X, Clock, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
      // Send email notification
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />{language === 'sv' ? 'Väntar' : 'Pending'}</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />{language === 'sv' ? 'Godkänd' : 'Approved'}</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" />{language === 'sv' ? 'Avvisad' : 'Rejected'}</Badge>;
      default:
        return null;
    }
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
          <p>{language === 'sv' ? 'Laddar...' : 'Loading...'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {language === 'sv' ? 'Admin Dashboard' : 'Admin Dashboard'}</title>
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            {language === 'sv' ? 'Admin Dashboard' : 'Admin Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'sv' ? 'Hantera event och godkännanden' : 'Manage events and approvals'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-yellow-600">{filterEventsByStatus('pending').length}</p>
              <p className="text-sm text-muted-foreground">{language === 'sv' ? 'Väntar' : 'Pending'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">{filterEventsByStatus('approved').length}</p>
              <p className="text-sm text-muted-foreground">{language === 'sv' ? 'Godkända' : 'Approved'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-red-600">{filterEventsByStatus('rejected').length}</p>
              <p className="text-sm text-muted-foreground">{language === 'sv' ? 'Avvisade' : 'Rejected'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{events.length}</p>
              <p className="text-sm text-muted-foreground">{language === 'sv' ? 'Totalt' : 'Total'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              {language === 'sv' ? 'Väntar' : 'Pending'} ({filterEventsByStatus('pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              {language === 'sv' ? 'Godkända' : 'Approved'} ({filterEventsByStatus('approved').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              {language === 'sv' ? 'Avvisade' : 'Rejected'} ({filterEventsByStatus('rejected').length})
            </TabsTrigger>
            <TabsTrigger value="all">
              {language === 'sv' ? 'Alla' : 'All'} ({events.length})
            </TabsTrigger>
          </TabsList>

          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <TabsContent key={status} value={status} className="mt-6">
              {filterEventsByStatus(status).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {language === 'sv' ? 'Inga event att visa' : 'No events to display'}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filterEventsByStatus(status).map((event) => (
                    <Card key={event.id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(event.status)}
                              <Badge variant="outline">{event.category}</Badge>
                            </div>
                            <h3 className="font-display text-xl font-semibold mb-1">{event.title}</h3>
                            <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{event.description}</p>
                            <div className="text-sm space-y-1">
                              <p><strong>{language === 'sv' ? 'Datum' : 'Date'}:</strong> {formatDate(event.start_date)} - {formatDate(event.end_date)}</p>
                              <p><strong>{language === 'sv' ? 'Plats' : 'Location'}:</strong> {event.location}</p>
                              <p><strong>{language === 'sv' ? 'Arrangör' : 'Organizer'}:</strong> {event.organizer_name} ({event.organizer_email})</p>
                              <p><strong>{language === 'sv' ? 'Pris' : 'Price'}:</strong> {event.is_free ? (language === 'sv' ? 'Gratis' : 'Free') : `${event.price} SEK`}</p>
                            </div>
                          </div>
                          <div className="flex flex-row md:flex-col gap-2">
                            <Button variant="outline" size="sm" onClick={() => openDialog(event, 'view')}>
                              <Eye className="w-4 h-4 mr-1" />
                              {language === 'sv' ? 'Visa' : 'View'}
                            </Button>
                            {event.status === 'pending' && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openDialog(event, 'approve')}>
                                  <Check className="w-4 h-4 mr-1" />
                                  {language === 'sv' ? 'Godkänn' : 'Approve'}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => openDialog(event, 'reject')}>
                                  <X className="w-4 h-4 mr-1" />
                                  {language === 'sv' ? 'Avvisa' : 'Reject'}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {event.admin_notes && (
                          <div className="mt-4 p-3 bg-muted rounded-md">
                            <p className="text-sm flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              <strong>{language === 'sv' ? 'Admin-anteckningar' : 'Admin Notes'}:</strong>
                            </p>
                            <p className="text-sm text-muted-foreground">{event.admin_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Action Dialog */}
      <Dialog open={dialogAction !== null} onOpenChange={() => { setDialogAction(null); setSelectedEvent(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogAction === 'view' && (language === 'sv' ? 'Event-detaljer' : 'Event Details')}
              {dialogAction === 'approve' && (language === 'sv' ? 'Godkänn Event' : 'Approve Event')}
              {dialogAction === 'reject' && (language === 'sv' ? 'Avvisa Event' : 'Reject Event')}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">{language === 'sv' ? 'Arrangör' : 'Organizer'}</p>
                  <p className="text-muted-foreground">{selectedEvent.organizer_name}</p>
                  <p className="text-muted-foreground">{selectedEvent.organizer_email}</p>
                </div>
                <div>
                  <p className="font-medium">{language === 'sv' ? 'Datum & Tid' : 'Date & Time'}</p>
                  <p className="text-muted-foreground">{formatDate(selectedEvent.start_date)} {selectedEvent.start_time}</p>
                  <p className="text-muted-foreground">{formatDate(selectedEvent.end_date)} {selectedEvent.end_time}</p>
                </div>
                <div>
                  <p className="font-medium">{language === 'sv' ? 'Plats' : 'Location'}</p>
                  <p className="text-muted-foreground">{selectedEvent.location}</p>
                </div>
                <div>
                  <p className="font-medium">{language === 'sv' ? 'Kategori' : 'Category'}</p>
                  <p className="text-muted-foreground">{selectedEvent.category}</p>
                </div>
              </div>

              <div>
                <p className="font-medium mb-1">{language === 'sv' ? 'Beskrivning' : 'Description'}</p>
                <p className="text-muted-foreground text-sm">{selectedEvent.description}</p>
              </div>

              {selectedEvent.organizer_description && (
                <div>
                  <p className="font-medium mb-1">{language === 'sv' ? 'Om arrangören' : 'About Organizer'}</p>
                  <p className="text-muted-foreground text-sm">{selectedEvent.organizer_description}</p>
                </div>
              )}

              {(dialogAction === 'approve' || dialogAction === 'reject') && (
                <div>
                  <Label htmlFor="adminNotes">
                    {language === 'sv' ? 'Admin-anteckningar (valfritt)' : 'Admin Notes (optional)'}
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
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogAction(null); setSelectedEvent(null); }}>
              {language === 'sv' ? 'Stäng' : 'Close'}
            </Button>
            {dialogAction === 'approve' && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('approve')} disabled={actionLoading}>
                <Check className="w-4 h-4 mr-1" />
                {actionLoading ? (language === 'sv' ? 'Godkänner...' : 'Approving...') : (language === 'sv' ? 'Godkänn' : 'Approve')}
              </Button>
            )}
            {dialogAction === 'reject' && (
              <Button variant="destructive" onClick={() => handleAction('reject')} disabled={actionLoading}>
                <X className="w-4 h-4 mr-1" />
                {actionLoading ? (language === 'sv' ? 'Avvisar...' : 'Rejecting...') : (language === 'sv' ? 'Avvisa' : 'Reject')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminDashboard;
