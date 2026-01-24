import React, { createContext, useContext, useState, useCallback } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'zh';
  });

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const newLang = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem('language', newLang);
      return newLang;
    });
  }, []);

  const value = {
    language,
    toggleLanguage,
    isZh: language === 'zh',
    isEn: language === 'en',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
