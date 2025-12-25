// Shared formatting utilities to reduce code duplication

export const CATEGORY_COLORS: Record<string, string> = {
  music: 'bg-purple-100 text-purple-800',
  sports: 'bg-green-100 text-green-800',
  art: 'bg-pink-100 text-pink-800',
  food: 'bg-orange-100 text-orange-800',
  business: 'bg-blue-100 text-blue-800',
  education: 'bg-indigo-100 text-indigo-800',
  community: 'bg-teal-100 text-teal-800',
  other: 'bg-gray-100 text-gray-800',
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
};

export const formatDate = (dateStr: string, language: string, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
  };
  return new Date(dateStr).toLocaleDateString(
    language === 'sv' ? 'sv-SE' : 'en-US',
    options || defaultOptions
  );
};

export const formatDateLong = (dateStr: string, language: string): string => {
  return new Date(dateStr).toLocaleDateString(
    language === 'sv' ? 'sv-SE' : 'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );
};

export const formatTime = (timeStr: string): string => {
  return timeStr.slice(0, 5);
};
