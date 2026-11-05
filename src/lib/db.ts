import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MelodisnapDB extends DBSchema {
  history: {
    key: string;
    value: {
      id: string;
      title: string;
      artist: string;
      album: string;
      artwork: string;
      timestamp: number;
      spotifyId?: string;
      appleMusicId?: string;
      previewUrl?: string;
      isFavourite?: boolean;
    };
    indexes: { 'by-timestamp': number };
  };
  favourites: {
    key: string;
    value: {
      id: string;
      title: string;
      artist: string;
      album: string;
      artwork: string;
      timestamp: number;
      spotifyId?: string;
      appleMusicId?: string;
      previewUrl?: string;
    };
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<MelodisnapDB>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<MelodisnapDB>('melodisnap-db', 1, {
      upgrade(db) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id' });
        historyStore.createIndex('by-timestamp', 'timestamp');

        const favoritesStore = db.createObjectStore('favourites', { keyPath: 'id' });
        favoritesStore.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
};

export const addToHistory = async (record: Omit<MelodisnapDB['history']['value'], 'id' | 'timestamp'>) => {
  const db = await getDB();
  const id = crypto.randomUUID();
  const timestamp = Date.now();
  await db.put('history', { ...record, id, timestamp });
  return id;
};

export const getHistory = async () => {
  const db = await getDB();
  return db.getAllFromIndex('history', 'by-timestamp');
};

export const clearHistory = async () => {
  const db = await getDB();
  await db.clear('history');
};

export type DbTrackInput = {
  id?: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  timestamp?: number;
  spotifyId?: string;
  appleMusicId?: string;
  previewUrl?: string;
  isFavourite?: boolean;
};

export const toggleFavourite = async (song: DbTrackInput) => {
  const db = await getDB();
  const trackId = song.id || `${song.title}-${song.artist}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const existing = await db.get('favourites', trackId);
  const fullTrack: MelodisnapDB['history']['value'] = {
    id: trackId,
    title: song.title,
    artist: song.artist,
    album: song.album || '',
    artwork: song.artwork || '',
    timestamp: song.timestamp || Date.now(),
    spotifyId: song.spotifyId,
    appleMusicId: song.appleMusicId,
    previewUrl: song.previewUrl,
  };
  
  if (existing) {
    await db.delete('favourites', trackId);
    try {
      await db.put('history', { ...fullTrack, isFavourite: false });
    } catch {}
    return false;
  } else {
    await db.put('favourites', fullTrack);
    try {
      await db.put('history', { ...fullTrack, isFavourite: true });
    } catch {}
    return true;
  }
};

export const getFavourites = async () => {
  const db = await getDB();
  return db.getAllFromIndex('favourites', 'by-timestamp');
};
