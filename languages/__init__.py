import json
import os
from pathlib import Path

LANGUAGES_DIR = Path(__file__).parent
AVAILABLE_LANGUAGES = {
    'en': 'English'
}

_translations = {}

def load_language(lang_code='en'):
    if lang_code not in AVAILABLE_LANGUAGES:
        lang_code = 'en'
    
    if lang_code not in _translations:
        lang_file = LANGUAGES_DIR / f'{lang_code}.json'
        if lang_file.exists():
            with open(lang_file, 'r', encoding='utf-8') as f:
                _translations[lang_code] = json.load(f)
        else:
            _translations[lang_code] = {}
    
    return _translations[lang_code]

def get_text(key, lang_code='en', **kwargs):
    translations = load_language(lang_code)
    
    keys = key.split('.')
    value = translations
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k, key)
        else:
            return key
    
    if isinstance(value, str) and kwargs:
        return value.format(**kwargs)
    
    return value

def get_current_language():
    return os.getenv('APP_LANGUAGE', 'en')
