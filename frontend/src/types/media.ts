export type MediaType = 'MOVIE' | 'TV' | 'ANIME' | 'MANGA' | 'GAME' | 'MUSIC';

export type ItemStatus = 'PLAN_TO_CONSUME' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';

export interface WatchProvider {
  name: string;
  logoUrl?: string;
  url?: string;
  type: 'flatrate' | 'buy' | 'rent' | 'stream' | 'app' | 'store';
}

export interface MediaItem {
  id: string;
  mediaType: MediaType;
  externalSource: string;
  externalId: string;
  title: string;
  originalTitle?: string;
  releaseDate?: string;
  posterUrl?: string;
  backdropUrl?: string;
  totalUnits?: number; // Episodes, chapters, or duration
  genres: string[];
  metadata: Record<string, any>;
  watchProviders?: {
    link?: string;
    providers?: WatchProvider[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface UserLibraryItem {
  id: string;
  userId: string;
  mediaItemId: string;
  status: ItemStatus;
  rating?: number | null;
  progressUnits: number;
  repeatCount: number;
  customPlatform?: string | null;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  mediaItem: MediaItem;
}
