import { entries } from './data.js';

const WIKIMEDIA_API = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

// Seeded shuffle: same seed = same order, different seed = different order
// This means every day the full list is reshuffled, but consistently for that day
function seededShuffle(array, seed) {
  const arr = [...array];
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

function getTodayEntry() {
  const day = getDayOfYear();
  // Use day as seed so shuffle is consistent per day but varies across days
  const year = new Date().getFullYear();
  const seed = year * 1000 + day;
  const shuffled = seededShuffle(entries, seed);
  return shuffled[day % shuffled.length];
}

function formatDate() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return {
    day: days[now.getDay()],
    date: `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
  };
}

async function fetchArtistImage(wikiArtist) {
  try {
    const res = await fetch(`${WIKIMEDIA_API}${encodeURIComponent(wikiArtist)}`);
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    if (!data.thumbnail?.source) return null;
    return data.thumbnail.source.replace(/\/\d+px-/, '/800px-');
  } catch {
    return null;
  }
}

function buildSpotifyUrl(search) {
  return `https://open.spotify.com/search/${encodeURIComponent(search)}`;
}

function buildYouTubeUrl(artist, song) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${song}`)}`;
}

function buildAppleMusicUrl(artist, song) {
  return `https://music.apple.com/search?term=${encodeURIComponent(`${artist} ${song}`)}`;
}

function setImageWithFallback(imgEl, src, artistName) {
  const panel = document.getElementById('image-panel');
  if (!src) {
    showFallback(panel, artistName);
    return;
  }
  imgEl.onload = () => {
    imgEl.classList.add('loaded');
    panel.classList.remove('loading');
  };
  imgEl.onerror = () => {
    showFallback(panel, artistName);
  };
  imgEl.src = src;
}

function showFallback(panel, artistName) {
  panel.classList.remove('loading');
  panel.classList.add('fallback');
  const initials = artistName
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .split(/\s+/)
    .map(w => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const fb = panel.querySelector('.img-fallback');
  if (fb) fb.textContent = initials || 'KIR';
  const img = panel.querySelector('#artist-img');
  if (img) img.style.display = 'none';
}

async function init() {
  const entry = getTodayEntry();
  const { day, date } = formatDate();

  document.getElementById('day-name').textContent = day;
  document.getElementById('date-text').textContent = date;

  // Lyric: uppercase, show as-is (Bebas Neue handles all caps rendering)
  document.getElementById('lyric').textContent = `"${entry.lyric}"`;
  document.getElementById('artist-name').textContent = entry.artist;
  document.getElementById('song-title').textContent = entry.song;
  document.getElementById('reflection').textContent = entry.reflection;
  document.getElementById('action-step').textContent = entry.action;

  document.getElementById('spotify-btn').href = buildSpotifyUrl(entry.spotifySearch);
  document.getElementById('youtube-btn').href = buildYouTubeUrl(entry.artist, entry.song);
  document.getElementById('apple-btn').href = buildAppleMusicUrl(entry.artist, entry.song);

  const imgEl = document.getElementById('artist-img');
  const imgSrc = await fetchArtistImage(entry.wikiArtist);
  setImageWithFallback(imgEl, imgSrc, entry.artist);

  requestAnimationFrame(() => {
    document.body.classList.add('ready');
  });
}

document.addEventListener('DOMContentLoaded', init);
