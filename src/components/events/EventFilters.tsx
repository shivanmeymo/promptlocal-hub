import React, { useState, lazy, Suspense, useMemo } from 'react';
import { Search, Calendar, Bell, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentPosition, reverseGeocode } from '@/lib/geo';
const LazyLocationAutocomplete = lazy(() =>
  import('@/components/maps/LocationAutocomplete').then(m => ({ default: m.LocationAutocomplete }))
);

interface EventFiltersProps {
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onFreeOnlyChange: (value: boolean) => void;
  onKeywordsChange?: (keywords: string[]) => void;
  onUseMyLocation?: (coords: { lat: number; lng: number }, address: string) => void;
  onRadiusChange?: (km: number) => void;
  initialLocation?: string;
}

const categories = ['music', 'sports', 'art', 'food', 'business', 'education', 'community', 'other'];

export const EventFilters: React.FC<EventFiltersProps> = ({
  onSearchChange,
  onDateChange,
  onLocationChange,
  onCategoryChange,
  onFreeOnlyChange,
  onKeywordsChange,
  initialLocation,
}) => {
  const { t, language } = useLanguage();
  // Safely try to get auth context - component may be used outside AuthProvider
  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch {
    // Auth context not available, continue without user
  }
  const { toast } = useToast();
  const [freeOnly, setFreeOnly] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    date: '',
    location: initialLocation || '',
    category: '',
  });

  // Sync with external location changes
  React.useEffect(() => {
    if (initialLocation && initialLocation !== selectedFilters.location) {
      console.log('🔄 EventFilters: Syncing location to:', initialLocation);
      setSelectedFilters(f => ({ ...f, location: initialLocation }));
    }
  }, [initialLocation, selectedFilters.location]);
  const [radiusKm, setRadiusKm] = useState<number>(25);

  const handleFreeOnlyChange = (checked: boolean) => {
    setFreeOnly(checked);
    onFreeOnlyChange(checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      e.preventDefault();
      const newKeyword = searchInput.trim();
      if (!keywords.includes(newKeyword)) {
        const newKeywords = [...keywords, newKeyword];
        setKeywords(newKeywords);
        onKeywordsChange?.(newKeywords);
        onSearchChange(newKeywords.join(' '));
      }
      setSearchInput('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const newKeywords = keywords.filter(k => k !== keywordToRemove);
    setKeywords(newKeywords);
    onKeywordsChange?.(newKeywords);
    onSearchChange(newKeywords.join(' '));
  };

  const handleDateChange = (value: string) => {
    setSelectedFilters(f => ({ ...f, date: value }));
    onDateChange(value === 'all' ? '' : value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedFilters(f => ({ ...f, category: value }));
    onCategoryChange(value === 'all' ? '' : value);
  };

  const handleNotify = async () => {
    if (!user && !notifyEmail) {
      toast({
        title: language === 'sv' ? 'E-post krävs' : 'Email required',
        description: language === 'sv' ? 'Ange din e-postadress för aviseringar.' : 'Enter your email address for notifications.',
        variant: 'destructive',
      });
      return;
    }

    const email = user?.email || notifyEmail;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: language === 'sv' ? 'Ogiltig e-post' : 'Invalid email',
        description: language === 'sv' ? 'Ange en giltig e-postadress.' : 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build filters object with current selections
      const filters = {
        location: selectedFilters.location || null,
        category: selectedFilters.category || null,
        freeOnly: freeOnly || null,
        keywords: keywords.length > 0 ? keywords : null,
        date: selectedFilters.date || null,
      };

      // Save to database
      const { error } = await supabase
        .from('event_notifications')
        .insert({
          email: email,
          user_id: user?.id || null,
          filters: filters,
          is_active: true,
        });

      if (error) {
        console.error('Error saving notification:', error);
        throw error;
      }

      const filterSummary = [];
      if (selectedFilters.date) filterSummary.push(`${language === 'sv' ? 'Datum' : 'Date'}: ${selectedFilters.date}`);
      if (selectedFilters.location) filterSummary.push(`${language === 'sv' ? 'Plats' : 'Location'}: ${selectedFilters.location}`);
      if (selectedFilters.category) filterSummary.push(`${language === 'sv' ? 'Kategori' : 'Category'}: ${t(`category.${selectedFilters.category}`)}`);
      if (freeOnly) filterSummary.push(language === 'sv' ? 'Endast gratis' : 'Free only');
      if (keywords.length > 0) filterSummary.push(`${language === 'sv' ? 'Sökord' : 'Keywords'}: ${keywords.join(', ')}`);

      toast({
        title: language === 'sv' ? 'Avisering aktiverad!' : 'Notification enabled!',
        description: language === 'sv' 
          ? `Du kommer få aviseringar till ${email}${filterSummary.length > 0 ? ` för: ${filterSummary.join(', ')}` : ' för alla nya event'}`
          : `You will receive notifications at ${email}${filterSummary.length > 0 ? ` for: ${filterSummary.join(', ')}` : ' for all new events'}`,
      });
      setNotifyDialogOpen(false);
      setNotifyEmail('');
    } catch (error: any) {
      console.error('Failed to save notification:', error);
      toast({
        title: language === 'sv' ? 'Något gick fel' : 'Something went wrong',
        description: language === 'sv' ? 'Kunde inte spara aviseringen. Försök igen.' : 'Could not save notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedFilters.date) count++;
    if (selectedFilters.location) count++;
    if (selectedFilters.category) count++;
    if (freeOnly) count++;
    if (keywords.length > 0) count++;
    return count;
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        {/* Search */}
        <div className="lg:col-span-1">
          <Label className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4" />
            {language === 'sv' ? 'Sök med nyckelord' : 'Search through keywords'}
          </Label>
          <Input
            placeholder={language === 'sv' ? 'Tryck Enter för att lägga till' : 'Press Enter to add'}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Date */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" />
            {t('search.date')}
          </Label>
          <Select onValueChange={handleDateChange} value={selectedFilters.date || 'all'}>
            <SelectTrigger>
              <SelectValue placeholder={t('search.select')} />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">{language === 'sv' ? 'Alla datum' : 'All dates'}</SelectItem>
              <SelectItem value="today">{language === 'sv' ? 'Idag' : 'Today'}</SelectItem>
              <SelectItem value="tomorrow">{language === 'sv' ? 'Imorgon' : 'Tomorrow'}</SelectItem>
              <SelectItem value="this-week">{language === 'sv' ? 'Denna vecka' : 'This Week'}</SelectItem>
              <SelectItem value="this-month">{language === 'sv' ? 'Denna månad' : 'This Month'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location (Swedish cities) */}
        <div>
          <Label className="mb-2 block">
            {language === 'sv' ? 'Plats' : 'Location'}
          </Label>
          <Select
            onValueChange={(value) => {
              setSelectedFilters(f => ({ ...f, location: value === 'all' ? '' : value }));
              onLocationChange(value === 'all' ? '' : value);
            }}
            value={selectedFilters.location || 'all'}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('search.select')} />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">{language === 'sv' ? 'Alla städer' : 'All cities'}</SelectItem>
              {['Stockholm','Göteborg','Malmö','Umeå','Västerås','Uppsala'].map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div>
          <Label className="mb-2 block">{t('search.category')}</Label>
          <Select onValueChange={handleCategoryChange} value={selectedFilters.category || 'all'}>
            <SelectTrigger>
              <SelectValue placeholder={t('search.select')} />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">{language === 'sv' ? 'Alla kategorier' : 'All categories'}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(`category.${cat}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Free Toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="free-only"
            checked={freeOnly}
            onCheckedChange={handleFreeOnlyChange}
          />
          <Label htmlFor="free-only" className="cursor-pointer">
            {t('search.free')}
          </Label>
        </div>

        {/* Notify Button */}
        <div>
          <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <Bell className="w-4 h-4" />
                {t('search.notify')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background">
              <DialogHeader>
                <DialogTitle>
                  {language === 'sv' ? 'Få aviseringar' : 'Get Notifications'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'sv' 
                    ? 'Få e-postaviseringar när nya event matchar dina filter.'
                    : 'Receive email notifications when new events match your filters.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Show active filters */}
                {getActiveFiltersCount() > 0 && (
                  <div>
                    <Label className="text-sm font-medium">
                      {language === 'sv' ? 'Aktiva filter:' : 'Active filters:'}
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFilters.date && (
                        <Badge variant="secondary">{language === 'sv' ? 'Datum' : 'Date'}: {selectedFilters.date}</Badge>
                      )}
                      {selectedFilters.location && (
                        <Badge variant="secondary">{language === 'sv' ? 'Plats' : 'Location'}: {selectedFilters.location}</Badge>
                      )}
                      {selectedFilters.category && (
                        <Badge variant="secondary">{language === 'sv' ? 'Kategori' : 'Category'}: {t(`category.${selectedFilters.category}`)}</Badge>
                      )}
                      {freeOnly && (
                        <Badge variant="secondary">{language === 'sv' ? 'Endast gratis' : 'Free only'}</Badge>
                      )}
                      {keywords.map(kw => (
                        <Badge key={kw} variant="secondary">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {!user && (
                  <div>
                    <Label htmlFor="notifyEmail">
                      {language === 'sv' ? 'E-postadress' : 'Email address'}
                    </Label>
                    <Input
                      id="notifyEmail"
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setNotifyDialogOpen(false)} disabled={isSubmitting}>
                  {language === 'sv' ? 'Avbryt' : 'Cancel'}
                </Button>
                <Button onClick={handleNotify} disabled={isSubmitting}>
                  <Bell className="w-4 h-4 mr-2" />
                  {isSubmitting 
                    ? (language === 'sv' ? 'Sparar...' : 'Saving...') 
                    : (language === 'sv' ? 'Aktivera aviseringar' : 'Enable Notifications')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Keywords Display */}
      {keywords.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">
            {language === 'sv' ? 'Sökord:' : 'Keywords:'}
          </span>
          {keywords.map((keyword) => (
            <Badge 
              key={keyword} 
              variant="secondary" 
              className="cursor-pointer hover:bg-destructive/10 gap-1"
              onClick={() => removeKeyword(keyword)}
            >
              {keyword}
              <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
