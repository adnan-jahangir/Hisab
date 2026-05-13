import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'bn';

interface LanguageState {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      toggleLanguage: () => set((state) => ({ 
        language: state.language === 'en' ? 'bn' : 'en' 
      })),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'hisab-lang-storage',
    }
  )
);
