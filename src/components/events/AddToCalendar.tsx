import React from 'react';
import { Calendar, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddToCalendarProps {
  event: {
    title: string;
    description: string;
    start_date: string;
    start_time: string;
    end_date: string;
    end_time: string;
    location: string;
  };
}

export const AddToCalendar: React.FC<AddToCalendarProps> = ({ event }) => {
  const { language } = useLanguage();

  const formatDateTime = (date: string, time: string) => {
    const dt = new Date(`${date}T${time}`);
    return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const startDateTime = formatDateTime(event.start_date, event.start_time);
  const endDateTime = formatDateTime(event.end_date, event.end_time);

  const googleCalendarUrl = () => {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDateTime}/${endDateTime}`,
      details: event.description,
      location: event.location,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const outlookCalendarUrl = () => {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      body: event.description,
      location: event.location,
      startdt: `${event.start_date}T${event.start_time}`,
      enddt: `${event.end_date}T${event.end_time}`,
    });
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };

  const generateICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NowInTown//Event//EN
BEGIN:VEVENT
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <CalendarPlus className="w-4 h-4" />
          {language === 'sv' ? 'Lägg till i kalender' : 'Add to Calendar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onClick={() => window.open(googleCalendarUrl(), '_blank')}>
          <Calendar className="w-4 h-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(outlookCalendarUrl(), '_blank')}>
          <Calendar className="w-4 h-4 mr-2" />
          Outlook Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={generateICS}>
          <Calendar className="w-4 h-4 mr-2" />
          {language === 'sv' ? 'Apple Kalender (.ics)' : 'Apple Calendar (.ics)'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
