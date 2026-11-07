import React, { useState, useMemo, useEffect } from 'react';
import { SongCard, SongResult } from '../components/SongCard';
import { Search, Compass, Flame, Play, Pause, Heart, Share2, TrendingUp, Radio, RefreshCw, Sparkles, Globe } from 'lucide-react';
import { toggleFavourite, getChart, saveChart } from '../lib/db';
import { useToast } from '../context/ToastContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useShareModal } from '../context/ShareModalContext';

export interface DiscoveryTrack extends SongResult {
  shazamCount: string;
  trendRank: number;
  vibe: string;
}

export const AFRICAN_COUNTRIES = [
  { id: 'ng', name: 'Nigeria', flag: '🇳🇬' },
  { id: 'za', name: 'South Africa', flag: '🇿🇦' },
  { id: 'gh', name: 'Ghana', flag: '🇬🇭' },
  { id: 'ke', name: 'Kenya', flag: '🇰🇪' },
  { id: 'tz', name: 'Tanzania', flag: '🇹🇿' },
  { id: 'ug', name: 'Uganda', flag: '🇺🇬' },
  { id: 'cm', name: 'Cameroon', flag: '🇨🇲' },
  { id: 'sn', name: 'Senegal', flag: '🇸🇳' },
  { id: 'ci', name: 'Côte d’Ivoire', flag: '🇨🇮' },
  { id: 'cd', name: 'DR Congo', flag: '🇨🇩' },
];

// Curated latest global megahits as instant initial state & reliable offline fallback
const DEFAULT_SPOTLIGHT_TRACK: SongResult = {
  id: 'spotlight-die-with-a-smile',
  title: 'Die With A Smile',
  artist: 'Lady Gaga & Bruno Mars',
  album: 'Die With A Smile - Single',
  artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ce/d5/08/ced50821-2e6d-5bf1-f2f2-d5cb3f779774/24UMGIM89622.rgb.jpg/600x600bb.png',
  previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/2f/ca/442fca12-ebcb-92c4-a694-be8d1dfcbb39/mzaf_6718045958611186716.plus.aac.p.m4a',
  spotifyId: '2plbrEY59IikOBgB57599W',
  genre: 'Pop',
  duration: '4:11',
};

const DEFAULT_DISCOVERY_TRACKS: DiscoveryTrack[] = [
  {
    id: 'disc-taste',
    trendRank: 1,
    title: 'Taste',
    artist: 'Sabrina Carpenter',
    album: 'Short n\' Sweet',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5a/0f/37/5a0f37be-00d9-7607-f6c6-ef443d3688b5/24UMGIM69450.rgb.jpg/600x600bb.png',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/5a/4b/58/5a4b5840-7ec8-5be0-3aa9-cff060cae6ec/mzaf_10034424368223696870.plus.aac.p.m4a',
    spotifyId: '5G2f63n7IPVPPjfNIGih7Q',
    genre: 'Pop',
    duration: '2:37',
    shazamCount: '8.4M',
    vibe: 'High Energy',
  },
  {
    id: 'disc-birds-of-a-feather',
    trendRank: 2,
    title: 'BIRDS OF A FEATHER',
    artist: 'Billie Eilish',
    album: 'HIT ME HARD AND SOFT',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/dc/4b/81/dc4b8156-f897-4008-0131-f6eb0ee6c63b/24UMGIM36916.rgb.jpg/600x600bb.png',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4a/0f/50/4a0f5076-13d8-e565-d0c8-c923304eb411/mzaf_12891398544976458532.plus.aac.p.m4a',
    spotifyId: '6dOtVTDmmpWGvwugZrRUsQ',
    genre: 'Alternative',
    duration: '3:03',
    shazamCount: '9.1M',
    vibe: 'Late Night Drive',
  },
  {
    id: 'disc-good-luck-babe',
    trendRank: 3,
    title: 'Good Luck, Babe!',
    artist: 'Chappell Roan',
    album: 'Good Luck, Babe! - Single',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/09/27/ef/0927eff6-3392-80ba-7d49-43a0889ecae6/24UMGIM33140.rgb.jpg/600x600bb.png',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fe/5e/11/fe5e1194-c119-9ec6-8968-30693a1523a6/mzaf_13596771141416715694.plus.aac.p.m4a',
    spotifyId: '0xKAXnJkM6Z7qTj5iH0a7n',
    genre: 'Pop',
    duration: '3:38',
    shazamCount: '7.6M',
    vibe: 'High Energy',
  },
  {
    id: 'disc-espresso',
    trendRank: 4,
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: 'Short n\' Sweet',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5a/0f/37/5a0f37be-00d9-7607-f6c6-ef443d3688b5/24UMGIM69450.rgb.jpg/600x600bb.png',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f7/60/a4/f760a4f5-5cf6-52bb-db63-a2a1a8c0ef0e/mzaf_3366368305419163276.plus.aac.p.m4a',
    spotifyId: '2qSkXiYg9WYCQ9392WIZ6R',
    genre: 'Pop',
    duration: '2:55',
    shazamCount: '8.9M',
    vibe: 'Uplifting',
  },
  {
    id: 'disc-a-bar-song',
    trendRank: 5,
    title: 'A Bar Song (Tipsy)',
    artist: 'Shaboozey',
    album: 'Where I\'ve Been, Isn\'t Where I\'m Going',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/71/2c/3e/712c3e10-ffb0-fc39-5096-2c93710fc9ee/198588045763.jpg/600x600bb.png',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ba/68/73/ba68739d-27f1-8319-7be6-46c764a7ad74/mzaf_6139454157121703649.plus.aac.p.m4a',
    spotifyId: '2FQrifJ1N335Ljm3T1PdMh',
    genre: 'Country',
    duration: '2:51',
    shazamCount: '9.3M',
    vibe: 'Uplifting',
  },
  {
    id: 'disc-i-had-some-help',
    trendRank: 6,
    title: 'I Had Some Help (feat. Morgan Wallen)',
    artist: 'Post Malone',
    album: 'F-1 Trillion',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3d/bf/d0/3dbfd0ee-e1fc-99f5-e44e-09a803a6476d/24UMGIM52317.rgb.jpg/600x600bb.png',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/80/7e/3d/807e3d1a-f3c5-bc59-710c-939a95085ba6/mzaf_10793666248967919830.plus.aac.p.m4a',
    spotifyId: '722tgOgdIbNe3BE8Lnejw4',
    genre: 'Country',
    duration: '2:58',
    shazamCount: '7.9M',
    vibe: 'Late Night Drive',
  },
  {
    id: 'disc-not-like-us',
    trendRank: 7,
    title: 'Not Like Us',
    artist: 'Kendrick Lamar',
    album: 'Not Like Us - Single',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5a/2a/3b/5a2a3b04-ca05-18ae-ae84-60e5db7033a8/24UMGIM52818.rgb.jpg/600x600bb.png',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c3/8c/d7/c38cd731-8e05-c1fc-f29e-1dc63c0a2b8e/mzaf_9748682976159265213.plus.aac.p.m4a',
    spotifyId: '6AI3ezQ4o3HUJW8BMv8vGS',
    genre: 'Hip-Hop',
    duration: '4:34',
    shazamCount: '8.2M',
    vibe: 'High Energy',
  },
  {
    id: 'disc-beautiful-things',
    trendRank: 8,
    title: 'Beautiful Things',
    artist: 'Benson Boone',
    album: 'Fireworks & Rollerblades',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/b8/b6/c6/b8b6c62c-8aa3-b467-f495-266150fe1f14/093624855583.jpg/600x600bb.png',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/37/ba/a6/37baa647-73d7-e070-e41c-3b7c7b8979c5/mzaf_17730997781079549301.plus.aac.p.m4a',
    spotifyId: '6tNQ70jh4OwmHG92648583',
    genre: 'Pop',
    duration: '3:00',
    shazamCount: '8.7M',
    vibe: 'Uplifting',
  },
  {
    id: 'disc-lose-control',
    trendRank: 9,
    title: 'Lose Control',
    artist: 'Teddy Swims',
    album: 'I\'ve Tried Everything But Therapy (Part 1)',
    artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/6c/fb/80/6cfb80be-ee77-658b-0856-7ee6db15adba/093624853039.jpg/600x600bb.png',
    previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/44/bd/ff/44bdff9f-442a-a9e9-74d7-789cfef5ffdf/mzaf_8405051930268487212.plus.aac.p.m4a',
    spotifyId: '17phhZDnlda3wkJuYegRjO',
    genre: 'R&B',
    duration: '3:30',
    shazamCount: '7.1M',
    vibe: 'Chill Study',
  },
];

const VIBES = ['All Vibes', 'Late Night Drive', 'Chill Study', 'Focus & Meditation', 'High Energy', 'Uplifting'];

function mapCategoryToVibe(genre: string, index: number): string {
  const g = (genre || '').toLowerCase();
  if (g.includes('dance') || g.includes('house') || g.includes('electronic') || g.includes('rock') || g.includes('metal')) {
    return 'High Energy';
  }
  if (g.includes('hip-hop') || g.includes('rap') || g.includes('r&b') || g.includes('soul')) {
    return 'Late Night Drive';
  }
  if (g.includes('country') || g.includes('pop') || g.includes('latin')) {
    return 'Uplifting';
  }
  if (g.includes('acoustic') || g.includes('folk') || g.includes('indie')) {
    return 'Chill Study';
  }
  if (g.includes('classical') || g.includes('ambient') || g.includes('instrumental')) {
    return 'Focus & Meditation';
  }
  const defaults = ['Late Night Drive', 'Chill Study', 'High Energy', 'Uplifting'];
  return defaults[index % defaults.length];
}

export const Discover = () => {
  const [spotlightTrack, setSpotlightTrack] = useState<SongResult>(DEFAULT_SPOTLIGHT_TRACK);
  const [discoveryTracks, setDiscoveryTracks] = useState<DiscoveryTrack[]>(DEFAULT_DISCOVERY_TRACKS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartStatus, setChartStatus] = useState<string>('Live Global Charts');
  const [selectedCountry, setSelectedCountry] = useState<string>('global');
  const [lastUpdatedDate, setLastUpdatedDate] = useState<string>('');

  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [selectedVibe, setSelectedVibe] = useState('All Vibes');
  const [searchQuery, setSearchQuery] = useState('');
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());

  const { currentTrack, isPlaying, isLoading, playTrack, togglePlay } = useAudioPlayer();
  const { showToast } = useToast();
  const { openShareModal } = useShareModal();

  // Load real-time top chart dynamically with Intelligent Caching
  const loadLiveCharts = async (countryCode = 'global', forceRefresh = false) => {
    setIsRefreshing(true);
    const chartKey = countryCode === 'global' ? 'us' : countryCode;
    
    try {
      // 1. Check Database Cache First
      if (!forceRefresh) {
        const cached = await getChart(countryCode);
        if (cached) {
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;
          const oneWeek = 7 * oneDay;
          const expiry = countryCode === 'global' ? oneWeek : oneDay;
          
          if (now - cached.lastUpdated < expiry) {
            setSpotlightTrack(cached.tracks[0]);
            setDiscoveryTracks(cached.tracks.slice(1));
            setLastUpdatedDate(new Date(cached.lastUpdated).toLocaleDateString());
            setChartStatus(`${countryCode === 'global' ? 'Global' : AFRICAN_COUNTRIES.find(c => c.id === countryCode)?.name} Top 30`);
            setIsRefreshing(false);
            return;
          }
        }
      }

      // 2. Fetch Fresh Data from iTunes Store RSS
      const res = await fetch(`https://itunes.apple.com/${chartKey}/rss/topsongs/limit=30/json`, {
        headers: { Accept: 'application/json' },
      });
      
      if (!res.ok) throw new Error('Live chart unavailable');

      const data = await res.json();
      const entries = data.feed?.entry;
      if (!entries || !Array.isArray(entries) || entries.length === 0) {
        throw new Error('Empty chart feed');
      }

      const parsed: DiscoveryTrack[] = entries.map((e: any, idx: number) => {
        const title = e['im:name']?.label || 'Trending Hit';
        const artist = e['im:artist']?.label || 'Popular Artist';
        const album = e['im:collection']?.['im:name']?.label || title;
        const rawArtwork = e['im:image']?.[2]?.label || e['im:image']?.[1]?.label || '';
        const artwork = rawArtwork ? rawArtwork.replace('170x170bb', '600x600bb') : '';
        const previewUrl = e.link?.find((l: any) => l.attributes?.['im:assetType'] === 'preview')?.attributes?.href || '';
        const genre = e.category?.attributes?.label || 'Pop';
        const rank = idx + 1;
        const vibe = mapCategoryToVibe(genre, idx);
        const estShazams = Math.max(1.2, +(9.6 - idx * 0.28).toFixed(1));

        return {
          id: `chart-${countryCode}-${e.id?.attributes?.['im:id'] || idx}-${rank}`,
          trendRank: rank,
          title,
          artist,
          album,
          artwork,
          previewUrl,
          spotifyId: '',
          genre,
          duration: '3:20',
          shazamCount: `${estShazams}M`,
          vibe,
        };
      });

      if (parsed.length > 0) {
        setSpotlightTrack(parsed[0]);
        setDiscoveryTracks(parsed.slice(1));
        const now = Date.now();
        setLastUpdatedDate(new Date(now).toLocaleDateString());
        setChartStatus(`${countryCode === 'global' ? 'Global' : AFRICAN_COUNTRIES.find(c => c.id === countryCode)?.name} Top 30`);
        
        // Save to cache
        await saveChart(countryCode, parsed);
        
        if (forceRefresh) {
          showToast(`Refreshed ${countryCode === 'global' ? 'Global' : 'African'} charts!`);
        }
      }
    } catch (err) {
      console.error('Chart fetch failed:', err);
      // Fallback to cache if fresh fetch fails
      const cached = await getChart(countryCode);
      if (cached) {
        setSpotlightTrack(cached.tracks[0]);
        setDiscoveryTracks(cached.tracks.slice(1));
        setLastUpdatedDate(new Date(cached.lastUpdated).toLocaleDateString());
        showToast('Using cached chart data (offline or server error)', 'info');
      } else if (countryCode === 'global') {
        // Fallback to hardcoded defaults for global only
        setSpotlightTrack(DEFAULT_SPOTLIGHT_TRACK);
        setDiscoveryTracks(DEFAULT_DISCOVERY_TRACKS);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadLiveCharts(selectedCountry);
  }, [selectedCountry]);

  const handleToggleFavourite = async (song: SongResult) => {
    try {
      const isFav = await toggleFavourite(song);
      setFavouriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(song.id || song.title);
        else next.delete(song.id || song.title);
        return next;
      });
      showToast(isFav ? `Added "${song.title}" to Favourites` : `Removed "${song.title}" from Favourites`);
    } catch {
      showToast('Could not update favourite', 'error');
    }
  };

  const isSpotlightPlaying = Boolean(
    spotlightTrack.previewUrl && currentTrack?.previewUrl === spotlightTrack.previewUrl && isPlaying
  );
  const isSpotlightLoading = Boolean(
    spotlightTrack.previewUrl && currentTrack?.previewUrl === spotlightTrack.previewUrl && isLoading
  );

  const handleSpotlightPlay = () => {
    if (currentTrack?.previewUrl === spotlightTrack.previewUrl) {
      togglePlay();
    } else if (spotlightTrack.previewUrl) {
      playTrack({
        id: spotlightTrack.id,
        title: spotlightTrack.title,
        artist: spotlightTrack.artist,
        album: spotlightTrack.album,
        artwork: spotlightTrack.artwork,
        previewUrl: spotlightTrack.previewUrl,
        spotifyId: spotlightTrack.spotifyId,
      });
    }
  };

  const handleOpenSpotlightSpotify = () => {
    if (spotlightTrack.spotifyId) {
      window.open(`https://open.spotify.com/track/${spotlightTrack.spotifyId}`, '_blank');
    } else {
      window.open(`https://open.spotify.com/search/${encodeURIComponent(`${spotlightTrack.title} ${spotlightTrack.artist}`)}`, '_blank');
    }
  };

  // Dynamic Genres extracted from current songs
  const genres = useMemo(() => {
    const set = new Set<string>();
    discoveryTracks.forEach((t) => {
      if (t.genre) set.add(t.genre);
    });
    if (spotlightTrack.genre) set.add(spotlightTrack.genre);
    return ['All Genres', ...Array.from(set)];
  }, [discoveryTracks, spotlightTrack]);

  const filteredSongs = useMemo(() => {
    return discoveryTracks.filter((song) => {
      const matchesGenre = selectedGenre === 'All Genres' || song.genre === selectedGenre;
      const matchesVibe = selectedVibe === 'All Vibes' || song.vibe === selectedVibe;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q) || (song.album && song.album.toLowerCase().includes(q));
      return matchesGenre && matchesVibe && matchesSearch;
    });
  }, [discoveryTracks, selectedGenre, selectedVibe, searchQuery]);

  const liveRadarItems = useMemo(() => {
    const cities = ['Tokyo', 'London', 'New York', 'Berlin', 'Paris'];
    const times = ['14s ago', '38s ago', '1m ago', '2m ago', '4m ago'];
    return cities.map((city, idx) => ({
      city,
      track: discoveryTracks[idx]?.title || spotlightTrack.title,
      time: times[idx],
    }));
  }, [discoveryTracks, spotlightTrack]);

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-32 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Editorial Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-primary)] uppercase tracking-widest">
              <Compass className="w-4 h-4" />
              <span>{selectedCountry === 'global' ? 'Global Top 30 Charts · Updated Weekly' : 'African Top 30 Charts · Updated Daily'}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-main)] tracking-tight">
              {selectedCountry === 'global' ? 'Global Discovery' : 'African Discovery'}
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl">
              {selectedCountry === 'global' 
                ? "Real-time trending songs updated every week. Discover what's hot worldwide right now."
                : `Hottest hits and emerging sounds from ${AFRICAN_COUNTRIES.find(c => c.id === selectedCountry)?.name}. Updated daily.`
              }
            </p>

            {/* Live Chart Status & Refresh Trigger */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{chartStatus}</span>
              </span>
              
              {lastUpdatedDate && (
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight bg-[var(--subtle-btn-bg)] px-2.5 py-1 rounded-lg">
                  Last Updated: {lastUpdatedDate}
                </span>
              )}

              <button
                onClick={() => loadLiveCharts(selectedCountry, true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl btn-secondary-glass text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors active:scale-95 disabled:opacity-50"
                title="Refresh current live chart"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-bold">Refresh</span>
              </button>
            </div>
          </div>

          {/* Search bar with glassmorphic glow */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search title, artist, or vibe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-card rounded-2xl pl-11 pr-4 py-3 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-all shadow-sm bg-[var(--input-bg)]"
            />
          </div>
        </header>

        {/* COUNTRY SELECTOR: AFRICAN TOP CHARTS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2 uppercase tracking-tighter">
                <Globe className="w-5 h-5 text-[var(--accent-primary)]" />
                <span>African Top Charts</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">Discover the hottest songs and emerging hits across Africa.</p>
            </div>

            <div className="flex items-center gap-2 bg-[var(--subtle-btn-bg)] p-1 rounded-xl border border-[var(--glass-border)]">
              <button
                onClick={() => setSelectedCountry('global')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCountry === 'global'
                    ? 'bg-[var(--accent-primary)] text-white shadow-md'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Global Top 30
              </button>
              <div className="w-[1px] h-4 bg-[var(--glass-border)]" />
              <span className="px-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Select Region</span>
            </div>
          </div>

          {/* Country Selection Grid/Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
            {AFRICAN_COUNTRIES.map((country) => (
              <button
                key={country.id}
                onClick={() => setSelectedCountry(country.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 group ${
                  selectedCountry === country.id
                    ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] shadow-[0_0_15px_rgba(0,122,255,0.1)]'
                    : 'bg-[var(--card-bg)] border-[var(--glass-border)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--subtle-btn-bg)]'
                }`}
              >
                <span className={`text-2xl mb-1 transition-transform group-hover:scale-110 ${selectedCountry === country.id ? 'scale-110' : ''}`}>
                  {country.flag}
                </span>
                <span className={`text-[10px] font-bold text-center truncate w-full ${
                  selectedCountry === country.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'
                }`}>
                  {country.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* FEATURED SPOTLIGHT: #1 Chart Track Glass Showcase */}
        <section className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 md:p-10 border border-[var(--accent-primary)]/10 shadow-2xl">
          {/* Subtle atmospheric ambient glow - Monochromatic Blue */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-primary)]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--accent-secondary)]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Artwork with ambient shadow */}
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/10 group bg-[var(--subtle-btn-bg)]">
              {spotlightTrack.artwork && (
                <img
                  src={spotlightTrack.artwork}
                  alt={spotlightTrack.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              )}
              <button
                onClick={handleSpotlightPlay}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={isSpotlightPlaying ? 'Pause spotlight preview' : 'Play spotlight preview'}
              >
                <div className="w-16 h-16 rounded-full btn-primary-glass flex items-center justify-center shadow-2xl text-white">
                  {isSpotlightLoading ? (
                    <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isSpotlightPlaying ? (
                    <Pause className="w-7 h-7 fill-current" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-0.5" />
                  )}
                </div>
              </button>
            </div>

            {/* Spotlight Content */}
            <div className="flex-1 text-center lg:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>#1 in {selectedCountry === 'global' ? 'Global Charts' : AFRICAN_COUNTRIES.find(c => c.id === selectedCountry)?.name}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#1DB954]"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z"/></svg>
                  <span>Verified 30s Studio Preview</span>
                </span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-main)] tracking-tight">
                  {spotlightTrack.title}
                </h2>
                <p className="text-base sm:text-xl text-[var(--text-sub)] font-medium mt-1">
                  {spotlightTrack.artist}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
                Holding the top position on this region's streaming charts. Listen to the 30-second studio audio preview or launch the complete track directly in Spotify.
              </p>

              {/* Playback & Action Controls */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <button
                  onClick={handleSpotlightPlay}
                  className="btn-primary-glass px-6 py-3 rounded-xl font-bold text-xs tracking-wider flex items-center gap-2.5 active:scale-95 shadow-xl text-white"
                >
                  {isSpotlightLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isSpotlightPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>{isSpotlightLoading ? 'Buffering...' : isSpotlightPlaying ? 'Pause Audio Preview' : 'Play 30s Studio Preview'}</span>
                </button>

                <button
                  onClick={() => handleToggleFavourite(spotlightTrack)}
                  className={`p-3 rounded-xl btn-secondary-glass transition-colors ${
                    favouriteIds.has(spotlightTrack.id || spotlightTrack.title)
                      ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                      : 'text-[var(--text-main)]'
                  }`}
                  title="Save to Favourites"
                >
                  <Heart className={`w-4 h-4 ${favouriteIds.has(spotlightTrack.id || spotlightTrack.title) ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => openShareModal(spotlightTrack)}
                  className="p-3 rounded-xl btn-secondary-glass text-[var(--accent-primary)] hover:opacity-80 transition-colors border-[var(--accent-primary)]/20"
                  title="Share spotlight track via QR Code"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={handleOpenSpotlightSpotify}
                  className="px-4 py-3 rounded-xl bg-[#1DB954] hover:bg-[#1DB954]/90 text-black font-bold text-xs tracking-wide flex items-center gap-2 shadow-lg shadow-[#1DB954]/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z"/></svg>
                  <span>Spotify</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Live Community Discovery Strip */}
        <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[var(--glass-border)] text-xs">
          <div className="flex items-center gap-2.5 text-[var(--accent-primary)] font-bold tracking-wide uppercase whitespace-nowrap">
            <Radio className="w-4 h-4 text-[var(--accent-primary)] animate-pulse" />
            <span>Live {selectedCountry === 'global' ? 'Global' : AFRICAN_COUNTRIES.find(c => c.id === selectedCountry)?.name} Radar</span>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar w-full md:w-auto text-[var(--text-muted)]">
            {liveRadarItems.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span className="font-semibold text-[var(--text-main)]">{item.city}</span>
                <span>·</span>
                <span className="text-[var(--accent-primary)]">"{item.track}"</span>
                <span className="text-[10px] text-[var(--text-muted)]">({item.time})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Controls (Genres & Vibe Radar) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Trending Discovery Charts (Top 30)</span>
            </h3>
          </div>

          {/* Genre Segmented Tabs - fully responsive */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  selectedGenre === genre
                    ? 'btn-primary-glass text-white'
                    : 'btn-secondary-glass text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Vibe Selector - fully responsive */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full">
            {VIBES.map((vibe) => (
              <button
                key={vibe}
                onClick={() => setSelectedVibe(vibe)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  selectedVibe === vibe
                    ? 'btn-primary-glass text-white'
                    : 'btn-secondary-glass text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {vibe}
              </button>
            ))}
          </div>
        </div>

        {/* Discovery Tracks Grid */}
        <div className="relative min-h-[400px]">
          {isRefreshing && (
            <div className="absolute inset-0 z-30 bg-[var(--bg-primary)]/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
              <RefreshCw className="w-10 h-10 text-[var(--accent-primary)] animate-spin mb-4" />
              <p className="text-sm font-bold text-[var(--text-main)]">Refreshing Charts...</p>
              <p className="text-xs text-[var(--text-muted)]">Fetching latest hits for this region</p>
            </div>
          )}

          {filteredSongs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSongs.map((song, i) => (
                <div key={song.id} className="relative">
                  {/* Ranking Pill Overlay */}
                  <div className="absolute top-2 left-2 z-20 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-black text-white border border-white/10 shadow-lg flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[var(--accent-primary)]" />
                    <span>#{song.trendRank}</span>
                    <span className="text-white/40">·</span>
                    <span className="text-[var(--accent-primary)]">{song.shazamCount}</span>
                  </div>

                  <SongCard
                    song={{
                      ...song,
                      isFavourite: favouriteIds.has(song.id || song.title),
                    }}
                    onToggleFavourite={() => handleToggleFavourite(song)}
                    index={i}
                  />
                </div>
              ))}
            </div>
          ) : !isRefreshing && (
            <div className="py-24 text-center glass-card rounded-3xl p-8 border border-[var(--glass-border)] max-w-md mx-auto">
              <p className="text-sm font-bold text-[var(--text-main)] mb-1">No matching tracks found</p>
              <p className="text-xs text-[var(--text-muted)] mb-5">
                Try choosing a different genre or clearing your search filter.
              </p>
              <button
                onClick={() => {
                  setSelectedGenre('All Genres');
                  setSelectedVibe('All Vibes');
                  setSearchQuery('');
                }}
                className="btn-primary-glass px-5 py-2.5 rounded-xl text-xs font-bold text-white"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
