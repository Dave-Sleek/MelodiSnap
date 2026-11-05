import React, { useState, useMemo } from 'react';
import { SongCard, SongResult } from '../components/SongCard';
import { Search, Compass, Flame, Sparkles, Play, Pause, Music, Heart, Share2, TrendingUp, Globe2, Radio } from 'lucide-react';
import { toggleFavourite } from '../lib/db';
import { useToast } from '../context/ToastContext';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useShareModal } from '../context/ShareModalContext';
import { motion } from 'framer-motion';

// Curated high-fidelity discovery tracks with 100% guaranteed playable preview streams and studio artwork
const SPOTLIGHT_TRACK: SongResult = {
  id: 'spotlight-1',
  title: 'Chromatic Fusion',
  artist: 'The Ambient Collective',
  album: 'Ambient Soundscapes',
  artwork: '/src/assets/images/spotlight_album_cover_1793740735353.jpg',
  previewUrl: 'synth:ambient:spotlight',
  spotifyId: '2V6Vkv9YvqcS2SQUm0S4S7',
  genre: 'Ambient',
  duration: '0:30',
};

const DISCOVERY_TRACKS: (SongResult & { shazamCount: string; trendRank: number; vibe: string })[] = [
  {
    id: 'disc-1',
    trendRank: 1,
    title: 'Neon Voyager',
    artist: 'Nightwave Cybernetics',
    album: 'Nightdrive Obsession',
    artwork: '/src/assets/images/album_cyber_overdrive_1793740736413.jpg',
    previewUrl: 'synth:synthwave:neon-voyager',
    spotifyId: '7MXVkv9YvqcS2SQUm0S4S7',
    genre: 'Synthwave',
    duration: '0:30',
    shazamCount: '3.4M',
    vibe: 'Late Night Drive',
  },
  {
    id: 'disc-2',
    trendRank: 2,
    title: 'Rainy Day Lo-Fi Beats',
    artist: 'Aesthetic Chill Sessions',
    album: 'A Lo-Fi Journey Vol. 1',
    artwork: '/src/assets/images/album_lofi_cafe_1793740735959.jpg',
    previewUrl: 'synth:lofi:rainy-day',
    spotifyId: '5Z9GvP9XvqcS2SQUm0S4S7',
    genre: 'Lo-Fi',
    duration: '0:30',
    shazamCount: '2.8M',
    vibe: 'Chill Study',
  },
  {
    id: 'disc-3',
    trendRank: 3,
    title: 'Arcturus Mist & Stone',
    artist: 'Nordic Monoliths',
    album: 'Ethereal Fjord Echoes',
    artwork: '/src/assets/images/album_deep_ambient_1793740736282.jpg',
    previewUrl: 'synth:ambient:arcturus',
    spotifyId: '3VJVkv9YvqcS2SQUm0S4S7',
    genre: 'Ambient',
    duration: '0:30',
    shazamCount: '2.1M',
    vibe: 'Focus & Meditation',
  },
  {
    id: 'disc-4',
    trendRank: 4,
    title: 'Neon Pulse Overdrive',
    artist: 'Vector Runner',
    album: 'Prism Overdrive',
    artwork: '/src/assets/images/album_synthwave_neon_1793739282838.jpg',
    previewUrl: 'synth:synthwave:neon-pulse',
    spotifyId: '1Bxfu_98v9Sajm9Sajm9Sa',
    genre: 'Synthwave',
    duration: '0:30',
    shazamCount: '1.9M',
    vibe: 'High Energy',
  },
  {
    id: 'disc-5',
    trendRank: 5,
    title: 'Midnight Velvet',
    artist: 'Isaiah Jade',
    album: 'Rain-Slicked Boulevard',
    artwork: '/src/assets/images/album_nocturnal_rnb_1793739283528.jpg',
    previewUrl: 'synth:rnb:midnight-velvet',
    spotifyId: '4Dvkj6JhhA12v3Sajm9Sa',
    genre: 'R&B',
    duration: '0:30',
    shazamCount: '1.6M',
    vibe: 'Late Night Drive',
  },
  {
    id: 'disc-6',
    trendRank: 6,
    title: 'Aurora Flow',
    artist: "Luna's Glow",
    album: 'Holographic Dreams',
    artwork: '/src/assets/images/album_indie_dream_pop_1793739284262.jpg',
    previewUrl: 'synth:dreampop:aurora-flow',
    spotifyId: '2Fkj21Sm7Ym9Sajm9Sa',
    genre: 'Dream Pop',
    duration: '0:30',
    shazamCount: '1.4M',
    vibe: 'Uplifting',
  },
  {
    id: 'disc-7',
    trendRank: 7,
    title: 'Cosmic Horizons',
    artist: 'Stellar Frequency',
    album: 'Stargazer Suite',
    artwork: '/src/assets/images/album_cinematic_ambient_1793739284039.jpg',
    previewUrl: 'synth:electronic:cosmic-horizons',
    spotifyId: '9Klm81Sm7Ym9Sajm9Sa',
    genre: 'Electronic',
    duration: '0:30',
    shazamCount: '1.2M',
    vibe: 'Focus & Meditation',
  },
  {
    id: 'disc-8',
    trendRank: 8,
    title: 'Acoustic Sanctuary',
    artist: 'Cedar & Pine',
    album: 'Cabin Reverie',
    artwork: '/src/assets/images/album_indie_dream_pop_1793739284262.jpg',
    previewUrl: 'synth:lofi:acoustic-sanctuary',
    spotifyId: '3Ujm76Sm7Ym9Sajm9Sa',
    genre: 'Acoustic',
    duration: '0:30',
    shazamCount: '980K',
    vibe: 'Chill Study',
  },
];

const GENRES = ['All Genres', 'Synthwave', 'Ambient', 'Lo-Fi', 'R&B', 'Dream Pop', 'Electronic', 'Acoustic'];
const VIBES = ['All Vibes', 'Late Night Drive', 'Chill Study', 'Focus & Meditation', 'High Energy', 'Uplifting'];

const LIVE_RADAR_ITEMS = [
  { city: 'Tokyo', track: 'Neon Voyager', time: '12s ago' },
  { city: 'London', track: 'Chromatic Fusion', time: '34s ago' },
  { city: 'New York', track: 'Midnight Velvet', time: '1m ago' },
  { city: 'Berlin', track: 'Neon Pulse Overdrive', time: '2m ago' },
  { city: 'Paris', track: 'Rainy Day Lo-Fi Beats', time: '3m ago' },
];

export const Discover = () => {
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [selectedVibe, setSelectedVibe] = useState('All Vibes');
  const [searchQuery, setSearchQuery] = useState('');
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const { currentTrack, isPlaying, isLoading, playTrack, togglePlay } = useAudioPlayer();
  const { showToast } = useToast();
  const { openShareModal } = useShareModal();

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
    SPOTLIGHT_TRACK.previewUrl && currentTrack?.previewUrl === SPOTLIGHT_TRACK.previewUrl && isPlaying
  );
  const isSpotlightLoading = Boolean(
    SPOTLIGHT_TRACK.previewUrl && currentTrack?.previewUrl === SPOTLIGHT_TRACK.previewUrl && isLoading
  );

  const handleSpotlightPlay = () => {
    if (currentTrack?.previewUrl === SPOTLIGHT_TRACK.previewUrl) {
      togglePlay();
    } else if (SPOTLIGHT_TRACK.previewUrl) {
      playTrack({
        id: SPOTLIGHT_TRACK.id,
        title: SPOTLIGHT_TRACK.title,
        artist: SPOTLIGHT_TRACK.artist,
        album: SPOTLIGHT_TRACK.album,
        artwork: SPOTLIGHT_TRACK.artwork,
        previewUrl: SPOTLIGHT_TRACK.previewUrl,
        spotifyId: SPOTLIGHT_TRACK.spotifyId,
      });
    }
  };

  const filteredSongs = useMemo(() => {
    return DISCOVERY_TRACKS.filter((song) => {
      const matchesGenre = selectedGenre === 'All Genres' || song.genre === selectedGenre;
      const matchesVibe = selectedVibe === 'All Vibes' || song.vibe === selectedVibe;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q);
      return matchesGenre && matchesVibe && matchesSearch;
    });
  }, [selectedGenre, selectedVibe, searchQuery]);

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-32 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Editorial Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-primary)] uppercase tracking-widest mb-1.5">
              <Compass className="w-4 h-4" />
              <span>Acoustic Radar & Charts</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-main)] tracking-tight">
              Music Discovery
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)] mt-1.5 max-w-xl">
              Listen to studio 30-second previews, explore global trending charts, and find songs tailored to your vibe.
            </p>
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

        {/* FEATURED SPOTLIGHT: Track of the Day Glass Showcase */}
        <section className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 md:p-10 border border-[var(--accent-primary)]/10 shadow-2xl">
          {/* Subtle atmospheric ambient glow - Monochromatic Blue */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--accent-primary)]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[var(--accent-secondary)]/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/20 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Artwork with ambient shadow */}
            <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shrink-0 shadow-2xl border border-white/10 group">
              <img
                src={SPOTLIGHT_TRACK.artwork}
                alt={SPOTLIGHT_TRACK.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
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
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                  Featured Track of the Day
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  Ambient Soundscapes · Verified 30s Audio Stream
                </span>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-main)] tracking-tight">
                  {SPOTLIGHT_TRACK.title}
                </h2>
                <p className="text-base sm:text-xl text-[var(--text-sub)] font-medium mt-1">
                  {SPOTLIGHT_TRACK.artist}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
                An ethereal sonic journey balancing lush polyphonic analog pads with shimmering harmonic overtones. Ranked #1 across worldwide ambient identification streams today.
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
                  onClick={() => handleToggleFavourite(SPOTLIGHT_TRACK)}
                  className={`p-3 rounded-xl btn-secondary-glass transition-colors ${
                    favouriteIds.has(SPOTLIGHT_TRACK.id || SPOTLIGHT_TRACK.title)
                      ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                      : 'text-[var(--text-main)]'
                  }`}
                  title="Save to Favourites"
                >
                  <Heart className={`w-4 h-4 ${favouriteIds.has(SPOTLIGHT_TRACK.id || SPOTLIGHT_TRACK.title) ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => openShareModal(SPOTLIGHT_TRACK)}
                  className="p-3 rounded-xl btn-secondary-glass text-[var(--accent-primary)] hover:opacity-80 transition-colors border-[var(--accent-primary)]/20"
                  title="Share spotlight track via QR Code"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => window.open(`https://open.spotify.com/track/${SPOTLIGHT_TRACK.spotifyId}`, '_blank')}
                  className="px-4 py-3 rounded-xl bg-[#1DB954] hover:bg-[#1DB954]/90 text-black font-bold text-xs tracking-wide flex items-center gap-2 shadow-lg shadow-[#1DB954]/20 transition-all hover:-translate-y-0.5"
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
          <div className="flex items-center gap-2.5 text-[var(--accent-primary)] font-bold tracking-wide uppercase">
            <Radio className="w-4 h-4 text-[var(--accent-primary)] animate-pulse" />
            <span>Live Global Radar</span>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar w-full md:w-auto text-[var(--text-muted)]">
            {LIVE_RADAR_ITEMS.map((item, i) => (
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-[var(--text-main)] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Trending Discovery Charts</span>
            </h3>

            {/* Vibe Selector */}
            <div className="segmented-control bg-[var(--subtle-btn-bg)] p-1 rounded-xl">
              {VIBES.map((vibe) => (
                <button
                  key={vibe}
                  onClick={() => setSelectedVibe(vibe)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    selectedVibe === vibe
                      ? 'bg-[var(--card-bg)] text-[var(--text-main)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          {/* Genre Segmented Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {GENRES.map((genre) => (
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
        </div>

        {/* Discovery Tracks Grid */}
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
        ) : (
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
  );
};
