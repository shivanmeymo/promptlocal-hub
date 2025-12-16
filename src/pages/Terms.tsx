import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';

const Terms: React.FC = () => {
  const { language } = useLanguage();

  const sections = language === 'sv' ? [
    {
      title: '1. Godkännande av villkor',
      content: 'Genom att använda NowInTown-plattformen godkänner du dessa användarvillkor. Om du inte godkänner dessa villkor, vänligen använd inte vår tjänst. Vi förbehåller oss rätten att uppdatera dessa villkor när som helst, och fortsatt användning av plattformen utgör godkännande av eventuella ändringar.',
    },
    {
      title: '2. Beskrivning av tjänsten',
      content: 'NowInTown är en plattform som möjliggör upptäckt och delning av event över hela Sverige. Användare kan bläddra bland event, skapa eventlistningar och ansluta med eventarrangörer. Vi tillhandahåller plattformen "som den är" och garanterar inte tillgänglighet av specifika event eller tjänster.',
    },
    {
      title: '3. Användarkonton',
      content: 'För att skapa event på NowInTown måste du registrera ett konto. Du ansvarar för att hålla din kontoinformation konfidentiell och för alla aktiviteter som sker under ditt konto. Du måste tillhandahålla korrekt och fullständig information vid registrering och hålla denna information uppdaterad.',
    },
    {
      title: '4. Eventlistningar',
      content: 'Vid skapande av eventlistningar samtycker du till att: tillhandahålla korrekt och sanningsenlig eventinformation, ha nödvändiga rättigheter och tillstånd för att vara värd för eventet, följa alla tillämpliga lagar och förordningar, inte publicera olagligt, skadligt eller vilseledande innehåll. Vi förbehåller oss rätten att ta bort eventlistningar som bryter mot dessa villkor.',
    },
    {
      title: '5. Godkännandeprocess för event',
      content: 'Alla event som skickas in till NowInTown genomgår en granskningsprocess innan de publiceras. Vi förbehåller oss rätten att godkänna eller avvisa eventlistningar efter eget gottfinnande. Event kan avvisas om de bryter mot våra riktlinjer, innehåller olämpligt innehåll eller inte uppfyller våra kvalitetsstandarder.',
    },
    {
      title: '6. Immateriella rättigheter',
      content: 'NowInTown-plattformen och dess ursprungliga innehåll, funktioner och funktionalitet ägs av NowInTown och skyddas av internationella upphovsrätts-, varumärkes- och andra immateriella rättslagar. Användare behåller ägandet av innehåll de skickar in men ger NowInTown en licens att visa och distribuera detta innehåll på plattformen.',
    },
    {
      title: '7. Integritetspolicy',
      content: 'Din integritet är viktig för oss. Vår integritetspolicy förklarar hur vi samlar in, använder och skyddar din personliga information. Genom att använda NowInTown samtycker du till att dina uppgifter samlas in och används i enlighet med vår integritetspolicy.',
    },
    {
      title: '8. Begränsning av ansvar',
      content: 'NowInTown ska inte hållas ansvarigt för indirekta, tillfälliga, speciella, följd- eller straffskador som uppstår från din användning av plattformen. Vi är inte ansvariga för tredjepartsinnehåll, event eller tjänster som nås via vår plattform.',
    },
    {
      title: '9. Uppsägning',
      content: 'Vi kan säga upp eller stänga av din åtkomst till plattformen omedelbart, utan föregående meddelande, av vilken anledning som helst, inklusive utan begränsning om du bryter mot dessa villkor. Vid uppsägning upphör din rätt att använda plattformen omedelbart.',
    },
    {
      title: '10. Tillämplig lag',
      content: 'Dessa villkor ska styras av och tolkas i enlighet med svensk lag, utan hänsyn till dess lagvalsregler. Eventuella tvister som uppstår från dessa villkor ska lösas i svenska domstolar.',
    },
    {
      title: '11. Kontaktinformation',
      content: 'Om du har några frågor om dessa villkor, vänligen kontakta oss på contact@nowintown.se eller via vår kontaktsida.',
    },
  ] : [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing and using the NowInTown platform, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service. We reserve the right to update these terms at any time, and your continued use of the platform constitutes acceptance of any changes.',
    },
    {
      title: '2. Description of Service',
      content: 'NowInTown is a platform that enables the discovery and sharing of events across Sweden. Users can browse events, create event listings, and connect with event organizers. We provide the platform "as is" and do not guarantee the availability of specific events or services.',
    },
    {
      title: '3. User Accounts',
      content: 'To create events on NowInTown, you must register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You must provide accurate and complete information when registering and keep this information updated.',
    },
    {
      title: '4. Event Listings',
      content: 'When creating event listings, you agree to: provide accurate and truthful event information, have the necessary rights and permissions to host the event, comply with all applicable laws and regulations, not post any illegal, harmful, or misleading content. We reserve the right to remove event listings that violate these terms.',
    },
    {
      title: '5. Event Approval Process',
      content: 'All events submitted to NowInTown undergo a review process before publication. We reserve the right to approve or reject event listings at our sole discretion. Events may be rejected if they violate our guidelines, contain inappropriate content, or do not meet our quality standards.',
    },
    {
      title: '6. Intellectual Property',
      content: 'The NowInTown platform and its original content, features, and functionality are owned by NowInTown and are protected by international copyright, trademark, and other intellectual property laws. Users retain ownership of content they submit but grant NowInTown a license to display and distribute this content on the platform.',
    },
    {
      title: '7. Privacy Policy',
      content: 'Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information. By using NowInTown, you consent to having your data collected and used in accordance with our Privacy Policy.',
    },
    {
      title: '8. Limitation of Liability',
      content: 'NowInTown shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform. We are not responsible for any third-party content, events, or services accessed through our platform.',
    },
    {
      title: '9. Termination',
      content: 'We may terminate or suspend your access to the platform immediately, without prior notice, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the platform will cease immediately.',
    },
    {
      title: '10. Governing Law',
      content: 'These Terms shall be governed by and construed in accordance with the laws of Sweden, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in Swedish courts.',
    },
    {
      title: '11. Contact Information',
      content: 'If you have any questions about these Terms, please contact us at contact@nowintown.se or through our contact page.',
    },
  ];

  return (
    <Layout>
      <Helmet>
        <title>NowInTown - {language === 'sv' ? 'Villkor' : 'Terms & Conditions'}</title>
        <meta
          name="description"
          content={
            language === 'sv'
              ? 'Läs NowInTowns användarvillkor för att förstå dina rättigheter och skyldigheter när du använder vår plattform.'
              : 'Read NowInTown\'s terms and conditions to understand your rights and responsibilities when using our platform.'
          }
        />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {language === 'sv' ? 'Villkor' : 'Terms & Conditions'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'sv'
              ? 'Senast uppdaterad: 16 december 2025'
              : 'Last updated: December 16, 2025'}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground mb-8">
            {language === 'sv'
              ? 'Välkommen till NowInTown. Genom att använda vår plattform godkänner du att vara bunden av följande villkor. Vänligen läs dem noggrant.'
              : 'Welcome to NowInTown. By using our platform, you agree to be bound by the following terms and conditions. Please read them carefully.'}
          </p>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <section key={index}>
                <h2 className="font-display text-xl font-semibold mb-3">{section.title}</h2>
                <p className="text-muted-foreground">{section.content}</p>
              </section>
            ))}
          </div>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {language === 'sv'
                ? 'Om du har några frågor om dessa villkor, tveka inte att '
                : 'If you have any questions about these terms, please don\'t hesitate to '}
              <Link to="/contact" className="text-accent hover:underline">
                {language === 'sv' ? 'kontakta oss' : 'contact us'}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
