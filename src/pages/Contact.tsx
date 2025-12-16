import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Contact: React.FC = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    message: '',
  });

  const categories = [
    { value: 'general', label: language === 'sv' ? 'Allmän förfrågan' : 'General Inquiry' },
    { value: 'support', label: language === 'sv' ? 'Support' : 'Support' },
    { value: 'partnership', label: language === 'sv' ? 'Partnerskap' : 'Partnership' },
    { value: 'feedback', label: language === 'sv' ? 'Feedback' : 'Feedback' },
    { value: 'other', label: language === 'sv' ? 'Övrigt' : 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        category: formData.category || null,
        message: formData.message,
      });

      if (error) throw error;

      toast({
        title: t('contact.success'),
        description: language === 'sv' ? 'Vi återkommer till dig så snart som möjligt.' : 'We\'ll get back to you as soon as possible.',
      });

      setFormData({ name: '', email: '', phone: '', category: '', message: '' });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {t('nav.contact')}</title>
        <meta
          name="description"
          content={
            language === 'sv'
              ? 'Kontakta NowInTown-teamet. Vi finns här för att hjälpa dig med frågor om event, partnerskap eller support.'
              : 'Contact the NowInTown team. We\'re here to help you with questions about events, partnerships, or support.'
          }
        />
      </Helmet>

      {/* Hero Section */}
      <section
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=1920&q=80')`,
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">
            {language === 'sv' ? 'Kontakta oss' : 'Contact us'}
          </h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-2">
            {language === 'sv' ? 'Kontakta' : 'Contact'}{' '}
            <span className="text-primary">Now</span>
            <span className="text-accent">In</span>
            <span>Town</span>
          </h2>
          <p className="text-muted-foreground">{t('contact.subtitle')}</p>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
            {language === 'sv'
              ? 'Oavsett om du planerar ett oförglömligt företagsevent, ett privat firande eller vill samarbeta, finns NowInTown-teamet här för att göra det möjligt.'
              : 'Whether you\'re planning an unforgettable corporate event, a private celebration, or looking to collaborate, the NowInTown team is here to make it happen.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-destructive" />
                  {t('contact.getInTouch')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">Email:</p>
                  <a href="mailto:contact@nowintown.se" className="text-accent hover:underline">
                    contact@nowintown.se
                  </a>
                </div>
                <div>
                  <p className="font-medium">{language === 'sv' ? 'Telefon' : 'Phone'}:</p>
                  <a href="tel:+46705430505" className="text-accent hover:underline">
                    +46 (0)70 543 05 05
                  </a>
                </div>
                <div>
                  <p className="font-medium">{language === 'sv' ? 'Kontorsadress' : 'Office Address'}:</p>
                  <p className="text-muted-foreground">Uppsala, Sweden</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {t('contact.operatingHours')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('contact.hours')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-accent" />
                {t('contact.sendMessage')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">
                      {t('contact.name')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={language === 'sv' ? 'Ditt fullständiga namn' : 'Your full name'}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">
                      {t('contact.email')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{t('contact.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+46 XX XXX XX XX"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">
                      {t('contact.category')} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'sv' ? 'Välj en kategori' : 'Select a category'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">
                    {t('contact.message')} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={language === 'sv' ? 'Berätta om ditt event eller din förfrågan...' : 'Tell us about your event or inquiry...'}
                    rows={5}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? t('common.loading') : t('contact.submit')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <h3 className="font-display text-2xl font-bold mb-2">{t('contact.createUnforgettable')}</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {language === 'sv'
              ? 'På NowInTown specialiserar vi oss på att förvandla dina idéer till minnesvärda upplevelser — från koncept till firande. Fyll i formuläret eller kontakta oss direkt, så återkommer en av våra eventspecialister till dig inom 24 timmar.'
              : "At NowInTown, we specialize in turning your ideas into memorable experiences — from concept to celebration. Fill out the form or reach out directly, and one of our event specialists will get back to you within 24 hours."}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
