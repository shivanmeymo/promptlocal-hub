import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TICKSTER_API_KEY = Deno.env.get("TICKSTER_API_KEY");
const TICKSTER_API_BASE = "https://event.api.tickster.com/api/v1";

interface TicksterEvent {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  venue?: {
    name: string;
    city?: string;
    address?: string;
  };
  organizer?: {
    name: string;
  };
  categories?: string[];
  images?: { url: string }[];
  url?: string;
  prices?: { amount: number; currency: string }[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("fetch-tickster-events function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TICKSTER_API_KEY) {
      console.error("TICKSTER_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Tickster API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const url = new URL(req.url);
    const city = url.searchParams.get("city") || "";
    const limit = parseInt(url.searchParams.get("limit") || "50");

    console.log(`Fetching Tickster events for city: ${city || 'all'}, limit: ${limit}`);

    // Fetch events from Tickster API
    const ticksterUrl = `${TICKSTER_API_BASE}/sv/events?apiKey=${TICKSTER_API_KEY}&limit=${limit}${city ? `&city=${encodeURIComponent(city)}` : ''}`;
    
    const ticksterResponse = await fetch(ticksterUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!ticksterResponse.ok) {
      const errorText = await ticksterResponse.text();
      console.error("Tickster API error:", ticksterResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Tickster API error: ${ticksterResponse.status}` }),
        { status: ticksterResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const ticksterData = await ticksterResponse.json();
    console.log(`Received ${ticksterData?.events?.length || 0} events from Tickster`);

    // Transform Tickster events to our format
    const transformedEvents = (ticksterData?.events || []).map((event: TicksterEvent) => {
      const startDateTime = new Date(event.startDate);
      const endDateTime = event.endDate ? new Date(event.endDate) : new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

      // Map Tickster categories to our categories
      const categoryMap: Record<string, string> = {
        "music": "music",
        "concert": "music",
        "festival": "music",
        "sport": "sports",
        "sports": "sports",
        "art": "art",
        "theater": "art",
        "theatre": "art",
        "exhibition": "art",
        "food": "food",
        "dining": "food",
        "business": "business",
        "conference": "business",
        "education": "education",
        "workshop": "education",
        "community": "community",
      };

      let category = "other";
      if (event.categories && event.categories.length > 0) {
        const lowerCategory = event.categories[0].toLowerCase();
        for (const [key, value] of Object.entries(categoryMap)) {
          if (lowerCategory.includes(key)) {
            category = value;
            break;
          }
        }
      }

      // Determine if event is free
      const isFree = !event.prices || event.prices.length === 0 || event.prices.every(p => p.amount === 0);
      const price = isFree ? null : (event.prices?.[0]?.amount || null);

      return {
        external_id: `tickster_${event.id}`,
        title: event.name,
        description: event.description || `Event from Tickster: ${event.name}`,
        start_date: startDateTime.toISOString().split('T')[0],
        start_time: startDateTime.toISOString().split('T')[1].substring(0, 5),
        end_date: endDateTime.toISOString().split('T')[0],
        end_time: endDateTime.toISOString().split('T')[1].substring(0, 5),
        location: event.venue ? 
          `${event.venue.name}${event.venue.city ? `, ${event.venue.city}` : ''}${event.venue.address ? `, ${event.venue.address}` : ''}` 
          : "See event details",
        category: category,
        is_free: isFree,
        price: price,
        organizer_name: event.organizer?.name || "Tickster Event",
        image_url: event.images?.[0]?.url || null,
        source: "tickster",
        source_url: event.url,
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        events: transformedEvents,
        count: transformedEvents.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in fetch-tickster-events:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
