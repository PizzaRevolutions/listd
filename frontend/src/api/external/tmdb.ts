import axios from 'axios';
import { MediaItem } from '../../types/media.js';

// Free / demo TMDB API key fallback or env variable
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY || '2c5a2c2dfbb85376c9687e14d35cb047';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export async function searchTMDB(query: string, type: 'movie' | 'tv' = 'movie'): Promise<Partial<MediaItem>[]> {
  if (!query.trim()) return [];

  try {
    const res = await axios.get(`${TMDB_BASE}/search/${type}`, {
      params: {
        api_key: TMDB_KEY,
        query,
        include_adult: false,
        language: 'en-US',
      },
    });

    const results = res.data.results || [];
    return results.slice(0, 15).map((item: any) => ({
      mediaType: type === 'movie' ? 'MOVIE' : 'TV',
      externalSource: 'tmdb',
      externalId: String(item.id),
      title: type === 'movie' ? item.title : item.name,
      originalTitle: type === 'movie' ? item.original_title : item.original_name,
      releaseDate: item.release_date || item.first_air_date,
      posterUrl: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : undefined,
      backdropUrl: item.backdrop_path ? `${IMAGE_BASE}${item.backdrop_path}` : undefined,
      genres: [], // genres are IDs in search, full details fetched on select
      metadata: {
        overview: item.overview,
        voteAverage: item.vote_average,
        voteCount: item.vote_count,
        popularity: item.popularity,
      },
      watchProviders: {
        link: `https://www.themoviedb.org/${type}/${item.id}/watch`,
      }
    }));
  } catch (err) {
    console.warn('[TMDB] Search failed', err);
    return [];
  }
}

export async function getTMDBDetails(id: string, type: 'movie' | 'tv'): Promise<Partial<MediaItem> | null> {
  try {
    const [detailRes, providerRes] = await Promise.all([
      axios.get(`${TMDB_BASE}/${type}/${id}`, {
        params: { api_key: TMDB_KEY, language: 'en-US' }
      }),
      axios.get(`${TMDB_BASE}/${type}/${id}/watch/providers`, {
        params: { api_key: TMDB_KEY }
      }).catch(() => ({ data: { results: {} } }))
    ]);

    const item = detailRes.data;
    const providers = providerRes.data?.results?.US || providerRes.data?.results?.IT || {};

    const watchProvidersList = (providers.flatrate || []).map((p: any) => ({
      name: p.provider_name,
      logoUrl: `${IMAGE_BASE}${p.logo_path}`,
      url: providers.link,
      type: 'flatrate' as const,
    }));

    return {
      mediaType: type === 'movie' ? 'MOVIE' : 'TV',
      externalSource: 'tmdb',
      externalId: String(item.id),
      title: type === 'movie' ? item.title : item.name,
      originalTitle: type === 'movie' ? item.original_title : item.original_name,
      releaseDate: item.release_date || item.first_air_date,
      posterUrl: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : undefined,
      backdropUrl: item.backdrop_path ? `${IMAGE_BASE}${item.backdrop_path}` : undefined,
      totalUnits: type === 'movie' ? item.runtime : item.number_of_episodes,
      genres: (item.genres || []).map((g: any) => g.name),
      metadata: {
        overview: item.overview,
        status: item.status,
        tagline: item.tagline,
        voteAverage: item.vote_average,
        runtime: item.runtime,
        numberOfSeasons: item.number_of_seasons,
        numberOfEpisodes: item.number_of_episodes,
      },
      watchProviders: {
        link: providers.link || `https://www.themoviedb.org/${type}/${item.id}/watch`,
        providers: watchProvidersList,
      }
    };
  } catch (err) {
    console.error('[TMDB] Detail fetch failed', err);
    return null;
  }
}
