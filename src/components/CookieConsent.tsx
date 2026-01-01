import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getConsent, setConsent, ConsentState } from '@/lib/consent';
import { X } from 'lucide-react';

const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<ConsentState>(getConsent());

  useEffect(() => {
    const current = getConsent();
    // show banner if user never interacted (updatedAt === 0)
    setVisible(current.updatedAt === 0);
    setState(current);
  }, []);

  const acceptAll = () => {
    const next = setConsent({ functional: true, analytics: true, marketing: true });
    setState(next);
    setVisible(false);
  };

  const rejectAll = () => {
    const next = setConsent({ functional: false, analytics: false, marketing: false });
    setState(next);
    setVisible(false);
  };

  const acceptNecessary = () => {
    const next = setConsent({ functional: false, analytics: false, marketing: false });
    setState(next);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <Card className="mx-auto max-w-3xl border shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="font-display text-lg font-semibold mb-2">We value your privacy</h2>
              <p className="text-sm text-muted-foreground">
                We use cookies and similar technologies to operate the site (necessary), enhance functionality, measure performance, and personalize content. You can accept all, reject non-essential, or accept only necessary cookies. See our
                {' '}<Link to="/data-integrity" className="text-accent hover:underline">Data Integrity</Link>{' '}and{' '}
                <Link to="/terms" className="text-accent hover:underline">Terms</Link> for details.
              </p>
            </div>
            <button aria-label="Close" className="p-2 text-muted-foreground hover:text-foreground" onClick={acceptNecessary}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
            <Button variant="secondary" onClick={rejectAll} className="order-3 sm:order-1">Reject all</Button>
            <Button variant="outline" onClick={acceptNecessary} className="order-2 sm:order-2">Accept necessary</Button>
            <Button onClick={acceptAll} className="order-1 sm:order-3">Accept all</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
