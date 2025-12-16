import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Upload, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
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
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    organizerName: profile?.full_name || '',
    organizerEmail: profile?.email || user?.email || '',
    organizerDescription: '',
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    category: '' as typeof categories[number] | '',
    isFree: true,
    price: '',
  });

  React.useEffect(() => {
    if (!user) {
      toast({
        title: language === 'sv' ? 'Logga in krävs' : 'Login required',
        description: language === 'sv' ? 'Du måste logga in för att skapa event.' : 'You must log in to create events.',
        variant: 'destructive',
      });
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        organizer_name: formData.organizerName,
        organizer_email: formData.organizerEmail,
        organizer_description: formData.organizerDescription || null,
        title: formData.title,
        description: formData.description,
        start_date: formData.startDate,
        start_time: formData.startTime,
        end_date: formData.endDate,
        end_time: formData.endTime,
        location: formData.location,
        category: formData.category as typeof categories[number],
        is_free: formData.isFree,
        price: formData.isFree ? null : parseFloat(formData.price),
        status: 'pending',
      });

      if (error) throw error;

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
                  <Label htmlFor="description">
                    {t('create.eventDesc')} <span className="text-destructive">*</span>
                  </Label>
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
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="pl-10"
                      placeholder={language === 'sv' ? 'Eventplats' : 'Event location'}
                      required
                    />
                  </div>
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
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {t(`category.${cat}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t('create.uploadImage')}</p>
                  </div>
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
