import React, { useEffect, useState, useMemo } from 'react';
import { getHistory, clearHistory, toggleFavourite } from '../lib/db';
import { SongCard, SongResult } from '../components/SongCard';
import { Trash2, Search, LayoutGrid, List, Download, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';

export const History = () => {
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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

  const handleExport = () => {
    if (songs.length === 0) {
      showToast('No tracks in history to export', 'info');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(songs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chatcham_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported history as JSON');
  };

  const filteredSongs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return songs;
    return songs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

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
            <div className="relative flex-1 md:w-64">
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

            {/* Export Button */}
            {songs.length > 0 && (
              <button
                onClick={handleExport}
                className="p-2.5 rounded-xl btn-secondary-glass text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                title="Export history JSON"
                aria-label="Export history JSON"
              >
                <Download className="w-4 h-4" />
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
