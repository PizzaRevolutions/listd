import axios from 'axios';
import { MediaItem } from '../../types/media.js';

// Free / demo TMDB API key (if provided by user in .env)
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Resilient public fallback endpoints requiring zero authentication barriers
const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || 'trilogy';
const OMDB_BASE = 'https://www.omdbapi.com';
const TVMAZE_BASE = 'https://api.tvmaze.com';

/**
 * Searches Movies or TV Series using TMDB with seamless fallback to OMDb and TVMaze.
 */
export async function searchTMDB(query: string, type: 'movie' | 'tv' = 'movie'): Promise<Partial<MediaItem>[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  // 1. Try TMDB first if an API key is configured
  if (TMDB_KEY) {
    try {
      const res = await axios.get(`${TMDB_BASE}/search/${type}`, {
        params: {
          api_key: TMDB_KEY,
          query: cleanQuery,
          include_adult: false,
          language: 'en-US',
        },
        timeout: 4000,
      });

      const results = res.data.results || [];
      if (results.length > 0) {
        return results.slice(0, 18).map((item: any) => ({
          mediaType: type === 'movie' ? 'MOVIE' : 'TV',
          externalSource: 'tmdb',
          externalId: String(item.id),
          title: type === 'movie' ? item.title : item.name,
          originalTitle: type === 'movie' ? item.original_title : item.original_name,
          releaseDate: item.release_date || item.first_air_date,
          posterUrl: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : undefined,
          backdropUrl: item.backdrop_path ? `${IMAGE_BASE}${item.backdrop_path}` : undefined,
          genres: [],
          metadata: {
            overview: item.overview,
            voteAverage: item.vote_average,
            voteCount: item.vote_count,
            popularity: item.popularity,
          },
          watchProviders: {
            link: `https://www.justwatch.com/it/ricerca?q=${encodeURIComponent(type === 'movie' ? item.title : item.name)}`,
          }
        }));
      }
    } catch (err) {
      console.warn('[TMDB] Request failed or unauthorized, switching to free fallback provider', err);
    }
  }

  // 2. Fallback for TV Series: TVMaze (100% free, rich TV metadata, no API key needed)
  if (type === 'tv') {
    try {
      const res = await axios.get(`${TVMAZE_BASE}/search/shows`, {
        params: { q: cleanQuery },
        timeout: 5000,
      });

      const results = res.data || [];
      return results.map(({ show }: any) => {
        const cleanSummary = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : undefined;
        const watchLink = show.officialSite || `https://www.justwatch.com/it/ricerca?q=${encodeURIComponent(show.name)}`;
        
        return {
          mediaType: 'TV',
          externalSource: 'tvmaze',
          externalId: String(show.id),
          title: show.name,
          originalTitle: show.name,
          releaseDate: show.premiered,
          posterUrl: show.image?.original || show.image?.medium,
          backdropUrl: show.image?.original || show.image?.medium,
          genres: show.genres || [],
          totalUnits: show.averageRuntime ? undefined : undefined,
          metadata: {
            overview: cleanSummary,
            voteAverage: show.rating?.average ? Number(show.rating.average) : undefined,
            status: show.status,
            runtime: show.averageRuntime || show.runtime,
            network: show.webChannel?.name || show.network?.name,
          },
          watchProviders: {
            link: watchLink,
            providers: show.webChannel ? [{
              name: show.webChannel.name,
              type: 'flatrate' as const,
            }] : undefined,
          }
        };
      });
    } catch (err) {
      console.warn('[TVMaze] Fallback search failed', err);
    }
  }

  // 3. Fallback for Movies: OMDb / IMDb catalog
  try {
    const res = await axios.get(OMDB_BASE, {
      params: {
        s: cleanQuery,
        type: type === 'movie' ? 'movie' : 'series',
        apikey: OMDB_API_KEY,
      },
      timeout: 5000,
    });

    const searchResults = res.data?.Search || [];
    return searchResults.map((item: any) => {
      const hasPoster = item.Poster && item.Poster !== 'N/A';
      return {
        mediaType: type === 'movie' ? 'MOVIE' : 'TV',
        externalSource: 'omdb',
        externalId: item.imdbID,
        title: item.Title,
        originalTitle: item.Title,
        releaseDate: item.Year,
        posterUrl: hasPoster ? item.Poster : undefined,
        backdropUrl: hasPoster ? item.Poster : undefined,
        genres: [],
        metadata: {
          overview: undefined,
          voteAverage: undefined,
        },
        watchProviders: {
          link: `https://www.justwatch.com/it/ricerca?q=${encodeURIComponent(item.Title)}`,
        }
      };
    });
  } catch (err) {
    console.error('[OMDb] Fallback movie search failed', err);
    return [];
  }
}

/**
 * Fetches full details for a Movie or TV Show by ID.
 */
export async function getTMDBDetails(id: string, type: 'movie' | 'tv'): Promise<Partial<MediaItem> | null> {
  // If it's a TVMaze ID (numeric and type is TV or from TVMaze)
  if (type === 'tv' && !id.startsWith('tt') && (!TMDB_KEY || isNaN(Number(id)))) {
    try {
      const res = await axios.get(`${TVMAZE_BASE}/shows/${id}`, {
        params: { embed: 'episodes' },
        timeout: 5000,
      });
      const show = res.data;
      const cleanSummary = show.summary ? show.summary.replace(/<[^>]*>?/gm, '') : undefined;
      const episodesCount = show._embedded?.episodes?.length || undefined;

      return {
        mediaType: 'TV',
        externalSource: 'tvmaze',
        externalId: String(show.id),
        title: show.name,
        originalTitle: show.name,
        releaseDate: show.premiered,
        posterUrl: show.image?.original || show.image?.medium,
        backdropUrl: show.image?.original || show.image?.medium,
        totalUnits: episodesCount,
        genres: show.genres || [],
        metadata: {
          overview: cleanSummary,
          voteAverage: show.rating?.average ? Number(show.rating.average) : undefined,
          status: show.status,
          runtime: show.averageRuntime || show.runtime,
          numberOfEpisodes: episodesCount,
        },
        watchProviders: {
          link: show.officialSite || `https://www.justwatch.com/it/ricerca?q=${encodeURIComponent(show.name)}`,
          providers: show.webChannel ? [{
            name: show.webChannel.name,
            type: 'flatrate' as const,
          }] : undefined,
        }
      };
    } catch (err) {
      console.warn('[TVMaze] Detail fetch failed', err);
    }
  }

  // If it's an IMDb ID (starts with 'tt') or OMDb item
  if (id.startsWith('tt')) {
    try {
      const res = await axios.get(OMDB_BASE, {
        params: {
          i: id,
          plot: 'full',
          apikey: OMDB_API_KEY,
        },
        timeout: 5000,
      });

      const item = res.data;
      const hasPoster = item.Poster && item.Poster !== 'N/A';
      const parsedRuntime = item.Runtime ? parseInt(item.Runtime.replace(/\D/g, ''), 10) : undefined;
      const rating = item.imdbRating && item.imdbRating !== 'N/A' ? parseFloat(item.imdbRating) : undefined;

      return {
        mediaType: item.Type === 'series' ? 'TV' : 'MOVIE',
        externalSource: 'omdb',
        externalId: item.imdbID,
        title: item.Title,
        originalTitle: item.Title,
        releaseDate: item.Released !== 'N/A' ? item.Released : item.Year,
        posterUrl: hasPoster ? item.Poster : undefined,
        backdropUrl: hasPoster ? item.Poster : undefined,
        totalUnits: parsedRuntime,
        genres: item.Genre && item.Genre !== 'N/A' ? item.Genre.split(', ') : [],
        metadata: {
          overview: item.Plot !== 'N/A' ? item.Plot : undefined,
          voteAverage: rating,
          runtime: parsedRuntime,
          director: item.Director !== 'N/A' ? item.Director : undefined,
          actors: item.Actors !== 'N/A' ? item.Actors : undefined,
        },
        watchProviders: {
          link: `https://www.justwatch.com/it/ricerca?q=${encodeURIComponent(item.Title)}`,
        }
      };
    } catch (err) {
      console.warn('[OMDb] Detail fetch failed', err);
    }
  }

  // If TMDB key is available and it's a TMDB ID
  if (TMDB_KEY) {
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
          link: providers.link || `https://www.justwatch.com/it/ricerca?q=${encodeURIComponent(type === 'movie' ? item.title : item.name)}`,
          providers: watchProvidersList,
        }
      };
    } catch (err) {
      console.error('[TMDB] Detail fetch failed', err);
    }
  }

  return null;
}
