import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Event = Tables<'events'>;

const AdminEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });
      setEvents(data || []);
    })();
  }, [user]);

  const onCreate = async () => {
    if (!user || !title || !startsAt) return;
    const startDate = new Date(startsAt);
    const { data: newEvent, error } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title,
        description,
        start_date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_date: startDate.toISOString().split('T')[0],
        end_time: '23:59',
        location: 'TBD',
        organizer_name: user.email || 'Unknown',
        organizer_email: user.email || '',
        status: 'pending',
      })
      .select()
      .single();
    
    if (!error && newEvent) {
      setEvents([newEvent, ...events]);
    }
    setTitle('');
    setDescription('');
    setStartsAt('');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Admin Events (owner view)</h1>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Create Event</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
        </div>
        <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <Button onClick={onCreate} disabled={!title || !startsAt}>Create</Button>
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">My Events</h2>
        <ul className="list-disc pl-5 text-sm">
          {events.map(ev => (
            <li key={ev.id} className="flex items-center gap-2">
              <span className="text-accent">{ev.title}</span>
              <span className="text-muted-foreground">
                ({new Date(`${ev.start_date}T${ev.start_time}`).toLocaleString()})
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default AdminEvents;
