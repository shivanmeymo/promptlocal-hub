import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Upload, Sparkles, Globe, Video, Repeat, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { BackButton } from '@/components/BackButton';
import { lazy, Suspense } from 'react';
const LazyLocationAutocomplete = lazy(() =>
  import('@/components/maps/LocationAutocomplete').then(m => ({ default: m.LocationAutocomplete }))
);
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getDatabaseAdapter, getStorageAdapter } from '@/adapters/factory';

const categories = ['music', 'sports', 'art', 'tech', 'business', 'education', 'health', 'community', 'other'] as const;

const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  

  const [formData, setFormData] = useState({
    organizerName: '',
    organizerEmail: '',
    organizerDescription: '',
    organizerWebsite: '',
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    category: '' as typeof categories[number] | '',
    otherCategory: '',
    isFree: true,
    price: '',
    isOnline: false,
    isRecurring: false,
    recurringPattern: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchEvent();
    }
  }, [user, id, navigate]);

  const fetchEvent = async () => {
    const dbAdapter = getDatabaseAdapter();
    const { data, error } = await dbAdapter.getEvent(id!);

    if (error || !data) {
      toast({
        title: t('common.error'),
        description: language === 'sv' ? 'Event hittades inte' : 'Event not found',
        variant: 'destructive',
      });
      navigate('/manage-events');
      return;
    }

    // Check if user is admin
    const { data: adminData } = await dbAdapter.query('user_roles', {
      select: 'role',
      filters: { user_id: user?.id, role: 'admin' },
      limit: 1,
    });

    const isAdmin = adminData && adminData.length > 0;

    // Check ownership or admin status
    if (data.user_id !== user?.id && !isAdmin) {
      toast({
        title: t('common.error'),
        description: language === 'sv' ? 'Du har inte behörighet att redigera detta event' : 'You do not have permission to edit this event',
        variant: 'destructive',
      });
      navigate('/manage-events');
      return;
    }

    setFormData({
      organizerName: data.organizer_name || '',
      organizerEmail: data.organizer_email || '',
      organizerDescription: data.organizer_description || '',
      organizerWebsite: data.organizer_website || '',
      title: data.title || '',
      description: data.description || '',
      startDate: data.start_date || '',
      startTime: data.start_time || '',
      endDate: data.end_date || '',
      endTime: data.end_time || '',
      location: data.location || '',
      category: (data.category as any) || '',
      otherCategory: data.other_category || '',
      isFree: data.is_free ?? true,
      price: data.price?.toString() || '',
      isOnline: data.is_online ?? false,
      isRecurring: data.is_recurring ?? false,
      recurringPattern: data.recurring_pattern || '',
      imageUrl: data.image_url || '',
    });

    if (data.image_url) {
      setImagePreview(data.image_url);
    }

    setFetching(false);
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: language === 'sv' ? 'Filen är för stor' : 'File too large',
          description: language === 'sv' ? 'Max filstorlek är 5MB' : 'Max file size is 5MB',
          variant: 'destructive',
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateDates = () => {
    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);
    
    if (end <= start) {
      toast({
        title: language === 'sv' ? 'Ogiltigt datum' : 'Invalid date',
        description: language === 'sv' 
          ? 'Slutdatum måste vara efter startdatum' 
          : 'End date must be after start date',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    if (!validateDates()) return;

    setLoading(true);

    try {
      let imageUrl = formData.imageUrl;

      if (imageFile) {
        const storageAdapter = getStorageAdapter();
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await storageAdapter.upload(fileName, imageFile, { bucket: 'event-images' });

        if (!uploadError) {
          imageUrl = storageAdapter.getPublicUrl(fileName, { bucket: 'event-images' });
        }
      }

      const dbAdapter = getDatabaseAdapter();
      const { error } = await dbAdapter.updateEvent(id, {
        organizer_name: formData.organizerName,
        organizer_email: formData.organizerEmail,
        organizer_description: formData.organizerDescription || null,
        organizer_website: formData.organizerWebsite || null,
        title: formData.title,
        description: formData.description,
        start_date: formData.startDate,
        start_time: formData.startTime,
        end_date: formData.endDate,
        end_time: formData.endTime,
        location: formData.location,
        category: formData.category as typeof categories[number],
        other_category: formData.category === 'other' ? formData.otherCategory : null,
        is_free: formData.isFree,
        price: formData.isFree ? null : parseFloat(formData.price),
        is_online: formData.isOnline,
        is_recurring: formData.isRecurring,
        recurring_pattern: formData.isRecurring ? formData.recurringPattern : null,
        image_url: imageUrl || null,
      });

      if (error) throw error;

      toast({
        title: language === 'sv' ? 'Event uppdaterat!' : 'Event updated!',
      });

      navigate('/manage-events');
    } catch (error) {
      toast({
        title: t('common.error'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  if (!user || fetching) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {language === 'sv' ? 'Redigera Event' : 'Edit Event'}</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <BackButton className="mb-4" />
        
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">
            {language === 'sv' ? 'Redigera Event' : 'Edit Event'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'sv' ? 'Uppdatera informationen om ditt event' : 'Update your event information'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {language === 'sv' ? 'Eventdetaljer' : 'Event Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Organizer Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('create.organizerInfo')}</h3>
                
                <div>
                  <Label htmlFor="organizerName">
                    {t('create.organizerName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="organizerName"
                    value={formData.organizerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizerName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="organizerEmail">
                    {t('create.organizerEmail')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="organizerEmail"
                    type="email"
                    value={formData.organizerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizerEmail: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="organizerWebsite">
                    <Globe className="w-4 h-4 inline mr-1" />
                    {language === 'sv' ? 'Webbplats (valfritt)' : 'Website (optional)'}
                  </Label>
                  <Input
                    id="organizerWebsite"
                    type="url"
                    value={formData.organizerWebsite}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizerWebsite: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="organizerDescription">{t('create.organizerDesc')}</Label>
                  <Textarea
                    id="organizerDescription"
                    value={formData.organizerDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizerDescription: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>

              {/* Event Type */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  {language === 'sv' ? 'Eventtyp' : 'Event Type'}
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>{language === 'sv' ? 'Evenemangsformat' : 'Event Format'}</Label>
                    <RadioGroup
                      value={formData.isOnline ? 'online' : 'offline'}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, isOnline: val === 'online' }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="offline" id="offline" />
                        <Label htmlFor="offline" className="cursor-pointer flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {language === 'sv' ? 'På plats' : 'In-person'}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className="cursor-pointer flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          {language === 'sv' ? 'Online' : 'Online'}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label>{language === 'sv' ? 'Frekvens' : 'Frequency'}</Label>
                    <RadioGroup
                      value={formData.isRecurring ? 'recurring' : 'single'}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, isRecurring: val === 'recurring' }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single" className="cursor-pointer">
                          {language === 'sv' ? 'Enstaka event' : 'Single event'}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="recurring" id="recurring" />
                        <Label htmlFor="recurring" className="cursor-pointer flex items-center gap-2">
                          <Repeat className="w-4 h-4" />
                          {language === 'sv' ? 'Återkommande' : 'Recurring'}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {formData.isRecurring && (
                  <div>
                    <Label>{language === 'sv' ? 'Återkommande mönster' : 'Recurring Pattern'}</Label>
                    <Select
                      value={formData.recurringPattern}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, recurringPattern: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'sv' ? 'Välj frekvens' : 'Select frequency'} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="daily">{language === 'sv' ? 'Dagligen' : 'Daily'}</SelectItem>
                        <SelectItem value="weekly">{language === 'sv' ? 'Varje vecka' : 'Weekly'}</SelectItem>
                        <SelectItem value="biweekly">{language === 'sv' ? 'Varannan vecka' : 'Bi-weekly'}</SelectItem>
                        <SelectItem value="monthly">{language === 'sv' ? 'Varje månad' : 'Monthly'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('create.eventDetails')}</h3>

                <div>
                  <Label htmlFor="title">
                    {t('create.eventTitle')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">
                    {t('create.category')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as typeof categories[number] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {t(`category.${cat}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.category === 'other' && (
                  <div>
                    <Label htmlFor="otherCategory">
                      {language === 'sv' ? 'Ange kategori' : 'Specify category'} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="otherCategory"
                      value={formData.otherCategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, otherCategory: e.target.value }))}
                      required={formData.category === 'other'}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="description">
                    {t('create.eventDesc')} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">
                      {t('create.startDate')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">
                      {t('create.startTime')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="endDate">
                      {t('create.endDate')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">
                      {t('create.endTime')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">
                    {t('create.location')} <span className="text-destructive">*</span>
                  </Label>
                  {formData.isOnline ? (
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder={language === 'sv' ? 'Länk eller plattform' : 'Link or platform'}
                      required
                    />
                  ) : (
                    <Suspense fallback={<Input placeholder="Location" disabled />}> 
                     <LazyLocationAutocomplete
                      value={formData.location}
                      onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                      placeholder={language === 'sv' ? 'Sök efter plats...' : 'Search for location...'}
                    />
                    </Suspense>
                  )}
                </div>

                <div>
                  <Label>{t('create.price')}</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isFree"
                        checked={formData.isFree}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFree: !!checked }))}
                      />
                      <Label htmlFor="isFree" className="cursor-pointer">
                        {t('create.isFree')}
                      </Label>
                    </div>
                  </div>
                  {!formData.isFree && (
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="mt-2"
                      required={!formData.isFree}
                    />
                  )}
                </div>

                <div>
                  <Label>{t('create.image')}</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{t('create.uploadImage')}</p>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
                <Calendar className="w-4 h-4 mr-2" />
                {loading 
                  ? t('common.loading') 
                  : (language === 'sv' ? 'Spara ändringar' : 'Save Changes')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditEvent;
