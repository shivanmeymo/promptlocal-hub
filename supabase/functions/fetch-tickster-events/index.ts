import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TICKSTER_API_KEY = Deno.env.get("TICKSTER_API_KEY");
const TICKSTER_API_BASE = "https://event.api.tickster.com/api/v1";

interface TicksterEvent {
  eventId: string;
  name: string;
  description?: string;
  eventStart: string;
  eventEnd?: string;
  venue?: {
    name: string;
    city?: string;
    address?: string;
  };
  organizer?: {
    name: string;
  };
  categories?: { name: string }[];
  imageUrl?: string;
  eventUrl?: string;
  lowestPrice?: number;
  currency?: string;
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

    // Fetch events from Tickster API v1.0 using correct endpoint format
    // API format: /api/v{version}/{languageCode}/events
    // Add fromDate to only get upcoming events
    const today = new Date().toISOString().split('T')[0];
    const ticksterUrl = `${TICKSTER_API_BASE}/sv/events?pageSize=${limit}&fromDate=${today}${city ? `&city=${encodeURIComponent(city)}` : ''}`;
    
    console.log(`Calling Tickster API: ${ticksterUrl}`);
    
    const ticksterResponse = await fetch(ticksterUrl, {
      headers: {
        "Accept": "application/json",
        "X-API-KEY": TICKSTER_API_KEY,
      },
    });

    if (!ticksterResponse.ok) {
      const errorText = await ticksterResponse.text();
      console.error("Tickster API error:", ticksterResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Tickster API error: ${ticksterResponse.status}`, details: errorText }),
        { status: ticksterResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const ticksterData = await ticksterResponse.json();
    
    // Handle both array response and paginated response
    const events = ticksterData?.items || ticksterData || [];
    console.log(`Received ${events.length} events from Tickster`);
    
    // Log first event structure for debugging
    if (events.length > 0) {
      console.log("Sample event structure:", JSON.stringify(events[0], null, 2));
    }

    // Transform Tickster events to our format, filtering out invalid ones
    const transformedEvents = events
      .filter((event: any) => {
        // Skip gift cards and webshop items based on name patterns
        const name = (event.name || "").toLowerCase();
        if (name.includes("presentkort") || name.includes("gavekort") || name.includes("webshop") || name.includes("förköp") || name.includes("kulturkort")) {
          console.log(`Skipping gift card/webshop: "${event.name}"`);
          return false;
        }
        
        // Check for valid date fields - Tickster uses startUtc
        const startField = event.startUtc || event.eventStart || event.start;
        if (!startField) {
          console.log(`Skipping event "${event.name}" - no start date`);
          return false;
        }
        const testDate = new Date(startField);
        if (isNaN(testDate.getTime())) {
          console.log(`Skipping event "${event.name}" - invalid date: ${startField}`);
          return false;
        }
        // Skip events with placeholder dates (past or too far in future)
        const now = new Date();
        const twoYearsFromNow = new Date();
        twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
        
        if (testDate < now) {
          console.log(`Skipping event "${event.name}" - past event: ${startField}`);
          return false;
        }
        if (testDate > twoYearsFromNow) {
          console.log(`Skipping event "${event.name}" - too far in future: ${startField}`);
          return false;
        }
        
        console.log(`Including event: "${event.name}" on ${startField}`);
        return true;
      })
      .map((event: any) => {
        // Use Tickster's actual field names
        const startDateTime = new Date(event.startUtc || event.eventStart || event.start);
        const endDateTime = event.endUtc ? new Date(event.endUtc) : new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

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
        const categories = event.categories || event.category || [];
        const categoryList = Array.isArray(categories) ? categories : [categories];
        if (categoryList.length > 0) {
          const firstCat = categoryList[0];
          const lowerCategory = (typeof firstCat === 'string' ? firstCat : firstCat?.name || "").toLowerCase();
          for (const [key, value] of Object.entries(categoryMap)) {
            if (lowerCategory.includes(key)) {
              category = value;
              break;
            }
          }
        }

        // Determine if event is free - check multiple possible field names
        const priceValue = event.lowestPrice ?? event.price ?? event.minPrice;
        const isFree = priceValue === undefined || priceValue === null || priceValue === 0;
        const price = isFree ? null : priceValue;

        // Get description - Tickster returns object with markdown/html
        const description = typeof event.description === 'object' 
          ? (event.description?.markdown || event.description?.html || `Event: ${event.name}`)
          : (event.description || `Event: ${event.name}`);

        // Get event ID
        const eventId = event.id || event.eventId;

        return {
          external_id: `tickster_${eventId}`,
          title: event.name,
          description: description.replace(/<[^>]*>/g, '').substring(0, 500), // Strip HTML, limit length
          start_date: startDateTime.toISOString().split('T')[0],
          start_time: startDateTime.toISOString().split('T')[1].substring(0, 5),
          end_date: endDateTime.toISOString().split('T')[0],
          end_time: endDateTime.toISOString().split('T')[1].substring(0, 5),
          location: event.venue ? 
            `${event.venue.name || ''}${event.venue.city ? `, ${event.venue.city}` : ''}${event.venue.address ? `, ${event.venue.address}` : ''}`.trim() || "See event details"
            : "See event details",
          category: category,
          is_free: isFree,
          price: price,
          organizer_name: event.organizer?.name || "Tickster Event",
          image_url: event.imageUrl || event.image || event.posterUrl || null,
          source: "tickster",
          source_url: event.infoUrl || event.shopUrl,
        };
      });
    
    console.log(`Successfully transformed ${transformedEvents.length} events`);

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
