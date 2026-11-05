import React, { useEffect, useState, useMemo } from 'react';
import { getFavourites, toggleFavourite } from '../lib/db';
import { SongCard, SongResult } from '../components/SongCard';
import { Heart, Search, LayoutGrid, List } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';

export const Favourites = () => {
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { showToast } = useToast();

  useEffect(() => {
    loadFavourites();
  }, []);

  const loadFavourites = async () => {
    try {
      const favs = await getFavourites();
      setSongs(favs.reverse());
    } catch {
      // Fallback
    }
  };

  const handleToggleFavourite = async (song: SongResult) => {
    const isFav = await toggleFavourite(song);
    loadFavourites();
    showToast(isFav ? `Saved to Favourites` : `Removed from Favourites`);
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
              Saved Tracks
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)] mt-1">
              {songs.length} {songs.length === 1 ? 'track' : 'tracks'} pinned to your personal library
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search favourites..."
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
          </div>
        </header>

        {/* Content */}
        {filteredSongs.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSongs.map((song, i) => (
                <SongCard
                  key={song.id}
                  song={{ ...song, isFavourite: true }}
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
                  song={{ ...song, isFavourite: true }}
                  onToggleFavourite={() => handleToggleFavourite(song)}
                  layout="list"
                  index={i}
                />
              ))}
            </div>
          )
        ) : (
          <div className="py-24 text-center glass-card rounded-3xl p-8 max-w-md mx-auto shadow-xl">
            <div className="w-14 h-14 bg-rose-500/15 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-md">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-main)] mb-1">
              {searchQuery ? 'No matching favourites' : 'No saved tracks yet'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto mb-6">
              {searchQuery
                ? 'Try searching with another keyword.'
                : 'Tap the heart icon on any track to save it here for instant listening.'}
            </p>
            {!searchQuery && (
              <Link
                to="/discover"
                className="btn-primary-glass inline-flex px-6 py-3 rounded-xl font-bold text-xs tracking-wider shadow-lg active:scale-95"
              >
                Explore Discoveries
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
