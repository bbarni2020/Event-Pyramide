import React, { createContext, useContext, useState, useEffect } from 'react';
import { languageService } from '../services/api';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [available, setAvailable] = useState({});
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState({});

  useEffect(() => {
    languageService.getCurrent()
      .then(res => {
        const data = res.data || {};
        setLanguage(data.language || 'en');
        setAvailable(data.available || {});
      })
      .catch(() => {
      })
      .finally(() => setLoading(false));
  }, []);

  // whenever the active language is updated, fetch its JSON from the backend
  useEffect(() => {
    if (!language) return;
    fetch(`/languages/${language}.json`)
      .then(r => (r.ok ? r.json() : {}))
      .then(json => setMessages(json))
      .catch(() => setMessages({}));
  }, [language]);

  const changeLanguage = (code) => {
    if (!available[code]) return;
    languageService.setLanguage(code)
      .then(() => {
        setLanguage(code);
        // reload page so that any server‑rendered strings or future hooks pick up the change
        window.location.reload();
      })
      .catch(() => {
        // ignore failures for now
      });
  };

  const t = (key, params) => {
    let value = messages;
    for (const part of key.split('.')) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        value = null;
        break;
      }
    }
    if (value == null) return key;
    if (typeof value === 'string' && params) {
      return value.replace(/\{(\w+)\}/g, (_, name) => params[name] || '');
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, available, changeLanguage, loading, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
