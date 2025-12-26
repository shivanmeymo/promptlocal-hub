import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Calendar, Upload, Sparkles, Globe, Video, Repeat, X, MapPin } from 'lucide-react';
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
import { LocationAutocomplete } from '@/components/maps/LocationAutocomplete';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const categories = ['music', 'sports', 'art', 'food', 'business', 'education', 'community', 'other'] as const;

const CreateEvent: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Get default dates and times
  const getDefaultDates = () => {
    const now = new Date();
    const startDate = now.toISOString().split('T')[0];
    const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate, endDate, startTime: '17:00', endTime: '17:00' };
  };

  const defaults = getDefaultDates();

  const [formData, setFormData] = useState({
    organizerName: profile?.full_name || '',
    organizerEmail: profile?.email || user?.email || '',
    organizerDescription: '',
    organizerWebsite: '',
    title: '',
    description: '',
    startDate: defaults.startDate,
    startTime: defaults.startTime,
    endDate: defaults.endDate,
    endTime: defaults.endTime,
    location: '',
    category: '' as typeof categories[number] | '',
    otherCategory: '',
    isFree: true,
    price: '',
    isOnline: false,
    isRecurring: false,
    recurringPattern: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData(f => ({
        ...f,
        organizerName: profile.full_name || f.organizerName,
        organizerEmail: profile.email || user?.email || f.organizerEmail,
      }));
    }
  }, [profile, user]);

  useEffect(() => {
    if (!user) {
      toast({
        title: language === 'sv' ? '🔐 Logga in krävs' : '🔐 Login required',
        description: language === 'sv' ? 'Vänligen logga in för att skapa event.' : 'Please log in to create events.',
      });
      navigate('/auth');
    }
  }, [user, navigate]);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateDescription = async () => {
    if (!formData.title || !formData.category) {
      toast({
        title: language === 'sv' ? 'Fyll i titel och kategori först' : 'Fill in title and category first',
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(true);
    try {
      // Server handles authentication and atomic rate limiting
      const { data, error } = await supabase.functions.invoke('generate-event-description', {
        body: {
          title: formData.title,
          category: formData.category === 'other' ? formData.otherCategory : formData.category,
          location: formData.location,
          isOnline: formData.isOnline,
          isFree: formData.isFree,
        },
      });

      if (error) {
        // Handle rate limit error specifically
        if (error.message?.includes('429') || data?.error?.includes('limit')) {
          toast({
            title: language === 'sv' ? 'AI-gräns nådd' : 'AI Limit Reached',
            description: language === 'sv' 
              ? 'Du har nått gränsen på 4 AI-genereringar för idag. Försök igen imorgon.'
              : 'You have reached the limit of 4 AI generations for today. Try again tomorrow.',
            variant: 'destructive',
          });
          setAiLoading(false);
          return;
        }
        throw error;
      }
      
      if (data?.description) {
        setFormData({ ...formData, description: data.description });
        
        const remaining = data.remaining ?? 3;
        toast({
          title: language === 'sv' ? 'Beskrivning genererad!' : 'Description generated!',
          description: language === 'sv' 
            ? `${remaining} AI-genereringar kvar idag`
            : `${remaining} AI generations left today`,
        });
      } else if (data?.error) {
        // Handle server-side error messages
        if (data.error.includes('limit') || data.remaining === 0) {
          toast({
            title: language === 'sv' ? 'AI-gräns nådd' : 'AI Limit Reached',
            description: language === 'sv' 
              ? 'Du har nått gränsen på 4 AI-genereringar för idag. Försök igen imorgon.'
              : 'You have reached the limit of 4 AI generations for today. Try again tomorrow.',
            variant: 'destructive',
          });
        } else {
          throw new Error(data.error);
        }
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: t('common.error'),
        description: language === 'sv' ? 'Kunde inte generera beskrivning' : 'Could not generate description',
        variant: 'destructive',
      });
    }
    setAiLoading(false);
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
    if (!user) return;
    if (!validateDates()) return;

    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      const { data: eventData, error } = await supabase.from('events').insert({
        user_id: user.id,
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
        image_url: imageUrl,
        status: 'pending',
      }).select().single();

      if (error) throw error;

      // Notify admin about new event
      try {
        await supabase.functions.invoke('notify-admin-new-event', {
          body: { event_id: eventData.id },
        });
      } catch (emailError) {
        console.error('Failed to notify admin:', emailError);
      }

      toast({
        title: t('create.success'),
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

  if (!user) return null;

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {t('create.title')}</title>
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <BackButton className="mb-4" />
        
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">{t('create.title')}</h1>
          <p className="text-muted-foreground">{t('create.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {t('create.title')}
            </CardTitle>
            <CardDescription>{t('create.subtitle')}</CardDescription>
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
                    onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                    placeholder={language === 'sv' ? 'Ange arrangörens fullständiga namn' : "Enter organizer's full name"}
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
                    onChange={(e) => setFormData({ ...formData, organizerEmail: e.target.value })}
                    placeholder="organizer@example.com"
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
                    onChange={(e) => setFormData({ ...formData, organizerWebsite: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="organizerDescription">{t('create.organizerDesc')}</Label>
                  <Textarea
                    id="organizerDescription"
                    value={formData.organizerDescription}
                    onChange={(e) => setFormData({ ...formData, organizerDescription: e.target.value })}
                    placeholder={language === 'sv' ? 'Berätta om dig själv och din erfarenhet av att arrangera event (valfritt)...' : 'Tell us about yourself and your experience organizing events (optional)...'}
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
                      onValueChange={(val) => setFormData({ ...formData, isOnline: val === 'online' })}
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
                      onValueChange={(val) => setFormData({ ...formData, isRecurring: val === 'recurring' })}
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
                    <Label htmlFor="recurringPattern">
                      {language === 'sv' ? 'Återkommande mönster' : 'Recurring Pattern'}
                    </Label>
                    <Select
                      value={formData.recurringPattern}
                      onValueChange={(value) => setFormData({ ...formData, recurringPattern: value })}
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
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={language === 'sv' ? 't.ex. Sommar Musikfestival 2025' : 'e.g., Summer Music Festival 2025'}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="description">
                      {t('create.eventDesc')} <span className="text-destructive">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                      disabled={aiLoading}
                      className="gap-1"
                    >
                      <Sparkles className="w-4 h-4" />
                      {aiLoading 
                        ? (language === 'sv' ? 'Genererar...' : 'Generating...') 
                        : (language === 'sv' ? 'Generera med AI' : 'Generate with AI')}
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={language === 'sv' ? 'Beskriv vad som gör ditt event speciellt...' : 'Describe what makes your event special...'}
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
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
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
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate}
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
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder={language === 'sv' ? 'Länk eller plattform' : 'Link or platform'}
                      required
                    />
                  ) : (
                    <LocationAutocomplete
                      value={formData.location}
                      onChange={(value) => setFormData({ ...formData, location: value })}
                      placeholder={language === 'sv' ? 'Sök efter plats...' : 'Search for location...'}
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="category">
                    {t('create.category')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value as typeof categories[number] })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'sv' ? 'Välj en kategori' : 'Select a category'} />
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
                      onChange={(e) => setFormData({ ...formData, otherCategory: e.target.value })}
                      placeholder={language === 'sv' ? 'Ange din kategori' : 'Enter your category'}
                      required={formData.category === 'other'}
                    />
                  </div>
                )}

                <div>
                  <Label>
                    {t('create.price')} <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isFree"
                        checked={formData.isFree}
                        onCheckedChange={(checked) => setFormData({ ...formData, isFree: !!checked })}
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
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                      <p className="text-xs text-muted-foreground mt-1">
                        {language === 'sv' ? 'Max 5MB' : 'Max 5MB'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
                <Calendar className="w-4 h-4 mr-2" />
                {loading ? t('common.loading') : t('create.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateEvent;
