import { createContext, useContext, useState } from 'react';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState('ko');
  return (
    <LangContext.Provider value={{ lang, setLang, t: (ko, en) => lang === 'ko' ? ko : en }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
