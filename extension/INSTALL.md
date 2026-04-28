# Atelier Browser Extension

## Build

```bash
cd extension
npm install
npm run build
```

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/dist` folder

## Profile sync

On first open, the extension shows a setup screen. To import your profile:

1. Open the Atelier web app
2. Go to **Profile**
3. Click **Copy Profile** in the banner at the top
4. Paste the copied JSON into the extension setup screen

After that, click any product page and open the extension — it auto-fills the current URL and lets you run an analysis with one tap.

## Development

```bash
npm run dev   # watches and rebuilds on save
```

Reload the extension in `chrome://extensions` after each build (click the refresh icon on the extension card).
