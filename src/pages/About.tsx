import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Shield, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

const About: React.FC = () => {
  const { t, language } = useLanguage();

  const values = [
    {
      icon: Heart,
      title: t('about.communityFirst'),
      subtitle: language === 'sv' ? 'Bygger kontakter som betyder något' : 'Building connections that matter',
      description:
        language === 'sv'
          ? 'Vi tror på gemenskapens kraft. Varje event samlar människor, skapar minnen och stärker sociala band. Vår plattform är designad för att bryta ensamhet och främja meningsfulla kontakter.'
          : "We believe in the power of community. Every event brings people together, creates memories, and strengthens social bonds. Our platform is designed to break loneliness and foster meaningful connections.",
    },
    {
      icon: Sparkles,
      title: t('about.simplicity'),
      subtitle: language === 'sv' ? 'Enkelt för alla att använda' : 'Easy for everyone to use',
      description:
        language === 'sv'
          ? 'Att skapa och hitta event ska vara enkelt. Vår plattform är designad för att vara intuitiv, tillgänglig och välkomnande för alla användare som vill njuta av socialt liv.'
          : 'Creating and finding events should be simple. Our platform is designed to be intuitive, accessible, and welcoming for all users who want to enjoy social life.',
    },
    {
      icon: Shield,
      title: t('about.quality'),
      subtitle: language === 'sv' ? 'Pålitlig eventinformation' : 'Reliable event information',
      description:
        language === 'sv'
          ? 'Vi upprätthåller höga standarder för eventlistningar och skyddar användardata med säkerhetsåtgärder på företagsnivå.'
          : 'We maintain high standards for event listings and protect user data with enterprise-grade security measures.',
    },
  ];

  const stats = [
    {
      icon: MapPin,
      title: t('about.nationwide'),
      description: language === 'sv' ? 'Event från hela Sverige, från Stockholm till Kiruna' : 'Events from all across Sweden, from Stockholm to Kiruna',
    },
    {
      icon: Calendar,
      title: t('about.dailyUpdates'),
      description: language === 'sv' ? 'Nya eventlistningar läggs till varje dag av vårt community' : 'Fresh event listings added every day by our community',
    },
    {
      icon: Users,
      title: t('about.growingCommunity'),
      description: language === 'sv' ? 'Tusentals eventarrangörer och deltagare litar på NowInTown' : 'Thousands of event organizers and attendees trust NowInTown',
    },
  ];

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {t('nav.about')}</title>
        <meta
          name="description"
          content={
            language === 'sv'
              ? 'Lär dig om NowInTown och vårt uppdrag att bryta ensamhet och bygga kontakter genom event.'
              : 'Learn about NowInTown and our mission to break loneliness and build connections through events.'
          }
        />
      </Helmet>

      {/* Hero Section */}
      <section
        className="relative py-24 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=80')`,
        }}
      >
        <div className="container mx-auto px-4 text-center text-white">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {language === 'sv' ? 'Om' : 'About'} <span className="text-primary">NowInTown</span>
          </h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90">
            {t('about.tagline')}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{t('about.mission')}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none">
            <p className="text-muted-foreground">
              {language === 'sv'
                ? 'På NowInTown är vårt huvudmål och vår ambition att bryta ensamhet och samla människor för att ha roligt och njuta av socialt liv. Vi tror att meningsfulla kontakter uppstår när människor samlas för event de älskar.'
                : 'At NowInTown, our main goal and ambition is to break loneliness and bring people together to have fun and enjoy social life. We believe that meaningful connections happen when people gather for events they love.'}
            </p>
            <p className="text-muted-foreground">
              {language === 'sv'
                ? 'Oavsett om du letar efter kulturella evenemang, sportaktiviteter, konserter eller samhällsträffar, gör vi det enkelt att upptäcka och delta i event som betyder något för dig. Varje event är en möjlighet att träffa nya människor, skapa minnen och stärka dina sociala kontakter.'
                : "Whether you're looking for cultural events, sports activities, concerts, or community gatherings, we make it easy to discover and attend events that matter to you. Every event is an opportunity to meet new people, create memories, and strengthen your social connections."}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Values Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="font-display">{value.title}</CardTitle>
                  <CardDescription>{value.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl font-bold mb-6">{t('about.story')}</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                {language === 'sv'
                  ? 'NowInTown startade 2025 med en vision om att förändra hur människor upptäcker och delar event över hela Sverige. Våra grundare, passionerade för communitybyggande och kulturella upplevelser, insåg att otroliga event ofta ägde rum i människors närområden utan att de visste om det.'
                  : 'NowInTown started in 2025 with a vision to transform how people discover and share events throughout Sweden. Our founders, passionate about community building and cultural experiences, recognized that incredible events were often happening in people\'s backyards without them knowing.'}
              </p>
              <p>
                {language === 'sv'
                  ? 'Idag är vi stolta över att betjäna eventarrangörer och deltagare över hela Sverige, från storstäder till småorter. Vår plattform har blivit en pålitlig resurs för att upptäcka allt från konstutställningar och sportevent till familjevänliga aktiviteter och professionella nätverksmöjligheter.'
                  : "Today, we're proud to serve event organizers and attendees across Sweden, from major cities to small towns. Our platform has become a trusted resource for discovering everything from art exhibitions and sports events to family-friendly activities and professional networking opportunities."}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">{stat.title}</h3>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">{t('about.getStarted')}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {language === 'sv'
              ? 'Gå med i vårt community av eventarrangörer och deltagare. Skapa ditt första event eller upptäck något fantastiskt som händer nära dig.'
              : 'Join our community of event organizers and attendees. Create your first event or discover something amazing happening near you.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/create-event">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                {language === 'sv' ? 'Skapa ett Event' : 'Create an Event'}
              </Button>
            </Link>
            <Link to="/">
              <Button size="lg" variant="outline">
                {language === 'sv' ? 'Utforska Event' : 'Explore Events'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="font-display">{language === 'sv' ? 'Kontakta oss' : 'Get in Touch'}</CardTitle>
            <CardDescription>
              {language === 'sv'
                ? 'Har du frågor, förslag eller bara vill säga hej? Vi vill gärna höra från dig!'
                : 'Have questions, suggestions, or just want to say hello? We\'d love to hear from you!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <strong>Email:</strong>{' '}
              <a href="mailto:contact@nowintown.com" className="text-accent hover:underline">
                contact@nowintown.se
              </a>
            </p>
            <p>
              <strong>{language === 'sv' ? 'Telefon' : 'Phone'}:</strong>{' '}
              <a href="tel:+46705430505" className="text-accent hover:underline">
                +46 (0)70 543 05 05
              </a>
            </p>
            <p>
              <strong>{language === 'sv' ? 'Adress' : 'Address'}:</strong> Uppsala, Sweden
            </p>
            <Link to="/contact">
              <Button className="mt-4">{t('nav.contact')}</Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
};

export default About;
