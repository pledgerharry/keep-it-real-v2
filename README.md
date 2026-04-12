# Daily Bars

A daily hip-hop lyric, reflection, and action step. One entry per day, cycling through a curated list of 100 entries. Warm, analogue aesthetic with artist imagery pulled from Wikipedia.

## Features

- One lyric per day, keyed to the day of year (same entry for everyone on the same date)
- Split-screen layout: artist image left, content right
- Artist images fetched from Wikipedia (no API key required)
- Listen links for Spotify, YouTube, and Apple Music (no API key required)
- Staggered reveal animations on load
- Grain texture, sepia tones, Playfair Display typography
- Fully responsive (stacked layout on mobile)

## Local development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Vercel will auto-detect Vite. No environment variables needed.
4. Deploy.

That's it. No API keys, no environment config.

## Adding more entries

Open `src/data.js` and add objects to the `entries` array following this shape:

```js
{
  lyric: "The exact lyric in quotation marks",
  artist: "Artist Name",
  song: "Song Title",
  album: "Album Name",
  reflection: "2-4 sentence reflection on the lyric.",
  action: "One clear, specific action step.",
  spotifySearch: "Artist Song search string",
  wikiArtist: "Wikipedia_article_slug"
}
```

The `wikiArtist` slug is the last part of the Wikipedia URL for the artist. For example, `https://en.wikipedia.org/wiki/Kendrick_Lamar` → `Kendrick_Lamar`.

## Project structure

```
/
├── index.html          # Entry point
├── vercel.json         # Vercel deployment config
├── vite.config.js      # Vite config
├── package.json
└── src/
    ├── main.js         # App logic
    ├── style.css       # All styles
    └── data.js         # All entries
```
