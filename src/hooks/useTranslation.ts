import { useLanguageStore } from '../store/useLanguageStore';
import { translations } from '../utils/translations';

export function useTranslation() {
  const { language } = useLanguageStore();

  const t = (key: keyof typeof translations): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en;
  };

  return { t, language };
}
