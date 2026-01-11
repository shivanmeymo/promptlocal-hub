import { Router, Response } from 'express';
import { authenticateRequest, AuthenticatedRequest } from '../middleware/auth.middleware';
import { getSupabaseClient, DbEvent } from '../services/supabase.service';
import { z } from 'zod';

/**
 * Events API Routes
 * 
 * All routes are protected with authentication middleware.
 * Frontend must send Firebase ID token in Authorization header.
 */

const router = Router();

// Validation schemas
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  location: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  image_url: z.string().url().nullable().optional(),
  category: z.string().min(1),
});

const updateEventSchema = createEventSchema.partial();

/**
 * GET /api/events
 * Get all approved events (public)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        users:user_id (
          id,
          display_name,
          photo_url
        )
      `)
      .eq('status', 'approved')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('❌ Failed to fetch events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
      return;
    }

    res.json({ data });
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/events/:id
 * Get single event by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        users:user_id (
          id,
          display_name,
          photo_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Event not found' });
        return;
      }
      console.error('❌ Failed to fetch event:', error);
      res.status(500).json({ error: 'Failed to fetch event' });
      return;
    }

    res.json({ data });
  } catch (error) {
    console.error('❌ Error fetching event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/events/user/me
 * Get current user's events
 */
router.get('/user/me', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = getSupabaseClient();
    const userId = req.user!.supabaseUserId;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch user events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
      return;
    }

    res.json({ data });
  } catch (error) {
    console.error('❌ Error fetching user events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/events
 * Create new event (authenticated users only)
 */
router.post('/', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validation = createEventSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const supabase = getSupabaseClient();
    const userId = req.user!.supabaseUserId;
    const eventData = validation.data;

    // Create event
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        title: eventData.title,
        description: eventData.description,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        location: eventData.location,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        image_url: eventData.image_url || null,
        category: eventData.category,
        status: 'pending', // All new events start as pending
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create event:', error);
      res.status(500).json({ error: 'Failed to create event' });
      return;
    }

    console.log(`✅ Created event: ${data.id} by user ${userId}`);
    res.status(201).json({ data });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/events/:id
 * Update event (owner only)
 */
router.put('/:id', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.supabaseUserId;

    // Validate request body
    const validation = updateEventSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const supabase = getSupabaseClient();

    // Check if event exists and user is the owner
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingEvent) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (existingEvent.user_id !== userId) {
      res.status(403).json({ error: 'Not authorized to update this event' });
      return;
    }

    // Update event
    const { data, error } = await supabase
      .from('events')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to update event:', error);
      res.status(500).json({ error: 'Failed to update event' });
      return;
    }

    console.log(`✅ Updated event: ${id}`);
    res.json({ data });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/events/:id
 * Delete event (owner only)
 */
router.delete('/:id', authenticateRequest, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.supabaseUserId;
    const supabase = getSupabaseClient();

    // Check if event exists and user is the owner
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingEvent) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (existingEvent.user_id !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this event' });
      return;
    }

    // Delete event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Failed to delete event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
      return;
    }

    console.log(`✅ Deleted event: ${id}`);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
