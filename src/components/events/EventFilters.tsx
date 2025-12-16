import React, { useState } from 'react';
import { Search, Calendar, MapPin, Filter, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface EventFiltersProps {
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onFreeOnlyChange: (value: boolean) => void;
}

const locations = ['Uppsala', 'Stockholm', 'Göteborg', 'Malmö', 'Lund', 'Linköping'];
const categories = ['music', 'sports', 'art', 'food', 'business', 'education', 'community', 'other'];

export const EventFilters: React.FC<EventFiltersProps> = ({
  onSearchChange,
  onDateChange,
  onLocationChange,
  onCategoryChange,
  onFreeOnlyChange,
}) => {
  const { t } = useLanguage();
  const [freeOnly, setFreeOnly] = useState(false);

  const handleFreeOnlyChange = (checked: boolean) => {
    setFreeOnly(checked);
    onFreeOnlyChange(checked);
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
        {/* Search */}
        <div className="lg:col-span-1">
          <Label className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4" />
            {t('search.search')}
          </Label>
          <Input
            placeholder={t('search.placeholder')}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Date */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" />
            {t('search.date')}
          </Label>
          <Select onValueChange={onDateChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('search.select')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" />
            {t('search.location')}
          </Label>
          <Select onValueChange={onLocationChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('search.select')} />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc.toLowerCase()}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div>
          <Label className="mb-2 block">{t('search.category')}</Label>
          <Select onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('search.select')} />
            </SelectTrigger>
            <SelectContent>
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
          <Button variant="outline" className="w-full gap-2">
            <Bell className="w-4 h-4" />
            {t('search.notify')}
          </Button>
        </div>
      </div>
    </div>
  );
};
