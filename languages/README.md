# Languages

This folder contains language translation files for the Event Pyramide application.

## Structure

Each language is stored as a JSON file with the ISO 639-1 language code as filename:
- `en.json` - English
- `es.json` - Spanish (example)
- `de.json` - German (example)
- `hu.json` - Hungarian (example)

## Adding a New Language

1. Copy `en.json` to a new file with your language code (e.g., `fr.json` for French)
2. Translate all values in the JSON file
3. Update `__init__.py` to add the new language to `AVAILABLE_LANGUAGES`
4. Set `APP_LANGUAGE` in `.env` or let users select via the API

## Usage

The application automatically loads the language specified in the `APP_LANGUAGE` environment variable. Users can also change their language preference via session.

### In Python/Flask:
```python
from languages import get_text

text = get_text('login.username_label')
formatted = get_text('admin.broadcast.sent', count=5)
```

### In Templates (via context processor):
```html
{{ _('login.username_label') }}
{{ _('admin.broadcast.sent', count=5) }}
```

### Via API:
```bash
curl -X POST http://localhost:5001/api/language/set/en
curl http://localhost:5001/api/language/current
```

## Translation Keys

All translation keys follow dot notation:
- `app_title` - Main application title
- `login.*` - Login page strings
- `nav.*` - Navigation elements
- `dashboard.*` - Dashboard sections
- `admin.*` - Admin panel strings

Placeholders use Python format string syntax: `{variable_name}`
