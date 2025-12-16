import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface BackButtonProps {
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  return (
    <Button
      variant="ghost"
      onClick={() => navigate(-1)}
      className={className}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      {language === 'sv' ? 'Tillbaka' : 'Back'}
    </Button>
  );
};
