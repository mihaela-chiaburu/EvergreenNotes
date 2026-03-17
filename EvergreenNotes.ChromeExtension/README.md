# EvergreenNotes Chrome Extension (Initial MVP)

This extension captures YouTube context and saves notes directly into EvergreenNotes.

## Current capabilities

- Auto-fills from active YouTube tab:
  - Title -> video title
  - Source -> current video URL
  - Tags -> hashtags from title/description
- Login against `POST /api/auth/login`
- Save flow:
  1. `POST /api/notes`
  2. `PUT /api/notes/{noteId}/tags`

## Load extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select folder: `EvergreenNotes.ChromeExtension`

## Backend setup required

### 1. Run API over localhost

Use your existing launch profile (for example `https://localhost:7010`).

### 2. Trust local HTTPS cert (if needed)

```powershell
dotnet dev-certs https --trust
```

### 3. Allow Chrome extension origin in CORS

In `EvergreenNotes/appsettings.Development.json`:

```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:5173",
    "https://localhost:5173",
    "http://localhost:5174",
    "https://localhost:5174"
  ],
  "ChromeExtensionIds": [
    "PUT_YOUR_CHROME_EXTENSION_ID_HERE"
  ]
}
```

How to get extension ID:

1. Open `chrome://extensions`
2. Enable Developer mode
3. Read the ID on the extension card
4. Paste into `ChromeExtensionIds`
5. Restart backend API

## Permissions used

Defined in `manifest.json`:

- `storage`: persist API URL/token/email
- `activeTab` and `tabs`: read active tab context
- `host_permissions`:
  - `https://www.youtube.com/*`
  - `https://youtube.com/*`
  - `https://localhost:7010/*`
  - `http://localhost:5280/*`

## Notes

- Keep your backend running when using Save.
- If token expires, login again in popup.
- This is an MVP scaffold; next step can add refresh token handling and richer metadata extraction.
