import React, { useEffect, useState, useMemo } from 'react';
import { getHistory, clearHistory, toggleFavourite } from '../lib/db';
import { SongCard, SongResult } from '../components/SongCard';
import { Trash2, Search, LayoutGrid, List, Share2, ArrowUpDown, AlertTriangle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { isSpotifyConnected, saveTracksToSpotify } from '../lib/spotify';

export const History = () => {
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSyncingSpotify, setIsSyncingSpotify] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await getHistory();
      setSongs(history.reverse());
    } catch {
      // Fallback
    }
  };

  const handleClear = async () => {
    await clearHistory();
    setSongs([]);
    setShowClearConfirm(false);
    showToast('History cleared successfully');
  };

  const handleToggleFavourite = async (song: SongResult) => {
    const isFav = await toggleFavourite(song);
    loadHistory();
    showToast(isFav ? `Added "${song.title}" to Favourites` : `Removed "${song.title}" from Favourites`);
  };

  const handleShareTracklist = async () => {
    if (songs.length === 0) {
      showToast('No tracks in history to share', 'info');
      return;
    }

    const listText = songs
      .map((s, idx) => `${idx + 1}. ${s.title} — ${s.artist}`)
      .join('\n');
    const sharePayload = `🎵 Songs discovered with melodisnap:\n\n${listText}\n\nCaptured with melodisnap`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My melodisnap Discoveries',
          text: sharePayload,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(sharePayload);
      showToast('Tracklist copied to clipboard!');
    } catch {
      showToast('Could not copy tracklist', 'error');
    }
  };

  const handleSyncToSpotify = async () => {
    if (songs.length === 0) return;
    const spotifyIds = songs.map((s) => s.spotifyId).filter(Boolean) as string[];
    if (spotifyIds.length === 0) {
      showToast('No tracks with Spotify links found to sync', 'info');
      return;
    }

    if (!isSpotifyConnected()) {
      showToast('Connect your Spotify in the Connect tab to sync Liked Songs', 'info');
      return;
    }

    setIsSyncingSpotify(true);
    try {
      const res = await saveTracksToSpotify(spotifyIds);
      showToast(`Saved ${res.count} ${res.count === 1 ? 'track' : 'tracks'} to your Spotify Liked Songs! 🟢`);
    } catch (err: any) {
      showToast(err.message || 'Failed to sync to Spotify', 'error');
    } finally {
      setIsSyncingSpotify(false);
    }
  };

  const toggleSortOrder = () => {
    if (sortOrder === 'newest') setSortOrder('oldest');
    else if (sortOrder === 'oldest') setSortOrder('alphabetical');
    else setSortOrder('newest');
    
    showToast(`Sorted by: ${
      sortOrder === 'newest' ? 'Oldest first' : sortOrder === 'oldest' ? 'A-Z alphabetical' : 'Newest first'
    }`);
  };

  const filteredSongs = useMemo(() => {
    let result = [...songs];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      );
    }
    if (sortOrder === 'oldest') {
      return [...result].reverse();
    }
    if (sortOrder === 'alphabetical') {
      return [...result].sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [songs, searchQuery, sortOrder]);

  return (
    <div className="min-h-screen pt-24 md:pt-32 pb-32 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-main)] tracking-tight">
              Recognition History
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)] mt-1">
              {songs.length} {songs.length === 1 ? 'track' : 'tracks'} identified and saved locally
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-card rounded-xl pl-10 pr-3 py-2.5 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]/50 shadow-sm"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl glass-card">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'btn-primary-glass shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'btn-primary-glass shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title="List view"
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Order Toggle */}
            {songs.length > 1 && (
              <button
                onClick={toggleSortOrder}
                className="p-2.5 rounded-xl btn-secondary-glass text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1.5"
                title={`Sort: ${sortOrder}`}
                aria-label="Toggle sort order"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline">{sortOrder}</span>
              </button>
            )}

            {/* Share Tracklist Button */}
            {songs.length > 0 && (
              <button
                onClick={handleShareTracklist}
                className="p-2.5 rounded-xl btn-secondary-glass text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1.5"
                title="Share tracklist"
                aria-label="Share tracklist"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-[10px] font-bold tracking-wider hidden sm:inline">Share</span>
              </button>
            )}

            {/* Sync to Spotify Button */}
            {songs.length > 0 && (
              <button
                onClick={handleSyncToSpotify}
                disabled={isSyncingSpotify}
                className="px-3 py-2 rounded-xl bg-[#1DB954]/15 hover:bg-[#1DB954]/25 text-[#1DB954] border border-[#1DB954]/30 hover:border-[#1DB954]/50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                title="Save tracks to Spotify Liked Songs"
                aria-label="Save tracks to Spotify Liked Songs"
              >
                {isSyncingSpotify ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.2.3-.6.4-.9.2-2.8-1.7-6.2-2.1-10.3-1.1-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 4.5-1 8.3-.6 11.4 1.2.3.2.4.6.2.9zm1.5-3.3c-.3.4-.8.5-1.2.3-3.2-1.9-8-2.5-11.8-1.3-.5.1-1-.2-1.1-.7s.2-1 .7-1.1c4.4-1.3 9.7-.7 13.5 1.6.4.2.5.8.2 1.2zm.1-3.4C15.2 8.3 8.7 8.1 4.9 9.3c-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.5-1.4 11.7-1.1 16.5 1.7.6.3.8 1.1.4 1.7-.3.5-1.1.7-1.7.4z"/></svg>
                )}
                <span className="text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline">Sync Spotify</span>
              </button>
            )}

            {/* Clear Button */}
            {songs.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-2.5 rounded-xl btn-secondary-glass text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/40 transition-colors"
                title="Clear all history"
                aria-label="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        {filteredSongs.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSongs.map((song, i) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onToggleFavourite={() => handleToggleFavourite(song)}
                  layout="grid"
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-w-4xl mx-auto">
              {filteredSongs.map((song, i) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onToggleFavourite={() => handleToggleFavourite(song)}
                  layout="list"
                  index={i}
                />
              ))}
            </div>
          )
        ) : (
          <div className="py-24 text-center glass-card rounded-3xl p-8 max-w-md mx-auto shadow-xl">
            <h3 className="text-base font-bold text-[var(--text-main)] mb-1">
              {searchQuery ? 'No matching tracks' : 'No history yet'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
              {searchQuery
                ? 'Try a different search term.'
                : 'Any music you identify with melodisnap will appear here automatically.'}
            </p>
          </div>
        )}

        {/* Custom Confirmation Modal for Clear History */}
        <AnimatePresence>
          {showClearConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="glass-card rounded-3xl p-7 max-w-md w-full shadow-2xl relative border border-red-500/20"
              >
                <div className="flex items-center gap-3 text-red-500 mb-4">
                  <div className="p-3 bg-red-500/15 rounded-2xl border border-red-500/20 shadow-md">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-main)]">Clear History</h3>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
                  Are you sure you want to delete all identified tracks from your local device? This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="btn-secondary-glass px-5 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95"
                  >
                    Clear All
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
