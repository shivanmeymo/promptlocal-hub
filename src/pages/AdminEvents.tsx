import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { listMyEvents, createEvent, assignRole, listEventRoles } from '@/integrations/supabase/events';

const AdminEvents: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [newRoleUserId, setNewRoleUserId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ev = await listMyEvents(user.id);
      setEvents(ev);
      if (ev.length) {
        setSelectedEventId(ev[0].id);
        const rs = await listEventRoles(ev[0].id);
        setRoles(rs);
      }
    })();
  }, [user]);

  const onCreate = async () => {
    if (!user || !title || !startsAt) return;
    const ev = await createEvent({ owner_id: user.id, title, description, starts_at: new Date(startsAt).toISOString(), visibility: 'public', status: 'published' });
    setEvents([ev, ...events]);
    setTitle(''); setDescription(''); setStartsAt('');
  };

  const onAssignRole = async () => {
    if (!selectedEventId || !newRoleUserId) return;
    await assignRole(selectedEventId, newRoleUserId, 'attendee');
    const rs = await listEventRoles(selectedEventId);
    setRoles(rs);
    setNewRoleUserId('');
  };

  const loadRoles = async (eventId: string) => {
    setSelectedEventId(eventId);
    const rs = await listEventRoles(eventId);
    setRoles(rs);
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
              <button className="text-accent underline" onClick={() => loadRoles(ev.id)}>{ev.title}</button>
              <span className="text-muted-foreground">({new Date(ev.starts_at).toLocaleString()})</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4 space-y-2">
        <h2 className="font-semibold">Roles for selected event</h2>
        <div className="flex gap-2">
          <Input placeholder="User ID" value={newRoleUserId} onChange={e => setNewRoleUserId(e.target.value)} />
          <Button onClick={onAssignRole} disabled={!selectedEventId || !newRoleUserId}>Add attendee</Button>
        </div>
        <ul className="list-disc pl-5 text-sm">
          {roles.map(r => (
            <li key={`${r.event_id}-${r.user_id}-${r.role}`}>{r.user_id} — {r.role}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default AdminEvents;
