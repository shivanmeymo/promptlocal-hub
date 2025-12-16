import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Shield, Lock, Database, Trash2, Eye, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const DataIntegrity: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const features = [
    {
      icon: Shield,
      title: t('data.protection'),
      subtitle: language === 'sv' ? 'Säkerhet i företagsklass för din sinnesro' : 'Enterprise-grade security for your peace of mind',
      description: language === 'sv'
        ? 'All eventdata är krypterad både under överföring och i vila med industristandardprotokoll. Vi använder SSL/TLS-certifikat och säker dataöverföring för att skydda din information från obehörig åtkomst.'
        : 'All event data is encrypted both in transit and at rest using industry-standard protocols. We use SSL/TLS certificates and secure data transmission to protect your information from unauthorized access.',
    },
    {
      icon: Lock,
      title: t('data.accessControl'),
      subtitle: language === 'sv' ? 'Säker autentisering och auktorisering' : 'Secure authentication and authorization',
      description: language === 'sv'
        ? 'Eventarrangörer får unika åtkomstkoder för att hantera sina event. Endast auktoriserade användare kan visa, ändra eller radera eventinformation, vilket säkerställer fullständig kontroll över din data.'
        : 'Event organizers receive unique access codes to manage their events. Only authorized users can view, modify, or delete event information, ensuring complete control over your data.',
    },
    {
      icon: Database,
      title: t('data.integrity'),
      subtitle: language === 'sv' ? 'Pålitlig och konsekvent information' : 'Reliable and consistent information',
      description: language === 'sv'
        ? 'Vi upprätthåller strikta datavalideringsregler för att säkerställa att all eventinformation förblir noggrann och konsekvent. Regelbundna integritetskontroller förhindrar datakorruption och upprätthåller tillförlitlighet över vår plattform.'
        : 'We maintain strict data validation rules to ensure all event information remains accurate and consistent. Regular integrity checks prevent data corruption and maintain reliability across our platform.',
    },
    {
      icon: Trash2,
      title: t('data.cleanup'),
      subtitle: language === 'sv' ? 'Integritetsbaserad datahantering' : 'Privacy-focused data handling',
      description: language === 'sv'
        ? 'Event raderas automatiskt vid slutet av deras schemalagda datum, vilket säkerställer att ingen onödig datalagring sker. Detta integritetsbaserade tillvägagångssätt minimerar datalagring och skyddar användarinformation.'
        : 'Events are automatically removed at the end of their scheduled dates, ensuring no unnecessary data storage occurs. This privacy-focused approach minimizes data retention and protects user information.',
    },
    {
      icon: Eye,
      title: t('data.transparency'),
      subtitle: language === 'sv' ? 'Tydliga policyer för dataanvändning' : 'Clear policies for data usage',
      description: language === 'sv'
        ? 'Vi samlar endast in väsentlig information som behövs för att visa och hantera event. Ingen personlig data delas med tredje part utan uttryckligt samtycke, och användare kan begära radering av data när som helst.'
        : 'We only collect essential information needed to display and manage events. No personal data is shared with third parties without explicit consent, and users can request data deletion at any time.',
    },
    {
      icon: RefreshCw,
      title: t('data.backups'),
      subtitle: language === 'sv' ? 'Pålitlig dataåterställning' : 'Reliable data restoration',
      description: language === 'sv'
        ? 'Automatiserade säkerhetskopior säkerställer att din eventdata är säker och återställningsbar vid systemfel. Våra redundanta lagringssystem garanterar hög tillgänglighet och datahållbarhet.'
        : 'Automated backups ensure your event data is safe and recoverable in case of system failures. Our redundant storage systems guarantee high availability and data durability.',
    },
  ];

  const commitments = [
    language === 'sv' ? 'Regelbundna säkerhetsrevisioner och penetrationstestning' : 'Regular security audits and penetration testing',
    language === 'sv' ? 'Efterlevnad av GDPR och internationella dataskyddsregler' : 'Compliance with GDPR and international data protection regulations',
    language === 'sv' ? 'Kontinuerlig övervakning för misstänkta aktiviteter' : 'Continuous monitoring for suspicious activities',
    language === 'sv' ? 'Snabba säkerhetsuppdateringar och patchar' : 'Rapid security updates and patches',
    language === 'sv' ? 'Transparenta incidentrapporterings- och svarsförfaranden' : 'Transparent incident reporting and response procedures',
  ];

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {t('nav.dataIntegrity')}</title>
        <meta
          name="description"
          content={
            language === 'sv'
              ? 'Lär dig om hur NowInTown skyddar din data med säkerhetsåtgärder på företagsnivå.'
              : 'Learn about how NowInTown protects your data with enterprise-grade security measures.'
          }
        />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="text-primary">{language === 'sv' ? 'Dataintegritet' : 'Data Integrity'}</span>
            {' & '}
            <span className="text-accent">{language === 'sv' ? 'Säkerhet' : 'Security'}</span>
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t('data.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="font-display">{feature.title}</CardTitle>
                <CardDescription>{feature.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Commitment Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="font-display text-2xl">{t('data.commitment')}</CardTitle>
            <CardDescription>
              {language === 'sv'
                ? 'På NowInTown förstår vi att din eventdata är värdefull och känslig. Vi är engagerade i att upprätthålla de högsta standarderna för datasäkerhet och integritet genom:'
                : 'At NowInTown, we understand that your event data is valuable and sensitive. We are committed to maintaining the highest standards of data security and integrity through:'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {commitments.map((commitment, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{commitment}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              {language === 'sv'
                ? 'Om du har några frågor om våra datasäkerhetsmetoder eller vill rapportera en säkerhetsangelägenhet, vänligen '
                : 'If you have any questions about our data security methods or want to report a security concern, please '}
              <Link to="/contact" className="text-accent hover:underline">
                {language === 'sv' ? 'kontakta oss' : 'contact us'}
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="bg-accent/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-accent" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">{t('data.manageAccount')}</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {language === 'sv'
              ? 'Ta fullständig kontroll över dina kontoinställningar, uppdatera ditt lösenord eller radera ditt konto när som helst.'
              : 'Take full control over your account settings, update your password, or delete your account at any time.'}
          </p>
          {user ? (
            <Link to="/profile">
              <Button className="bg-accent hover:bg-accent/90">{t('data.goToAccount')}</Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button className="bg-accent hover:bg-accent/90">{t('nav.login')}</Button>
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DataIntegrity;
