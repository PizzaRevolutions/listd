import axios from 'axios';
import { MediaItem } from '../../types/media.js';

const RAWG_BASE = 'https://api.rawg.io/api';
// Free / demo RAWG API key
const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY || 'c542e67aec3a4340908f9de9e86038af';

export async function searchRAWG(query: string): Promise<Partial<MediaItem>[]> {
  if (!query.trim()) return [];

  try {
    const res = await axios.get(`${RAWG_BASE}/games`, {
      params: {
        key: RAWG_KEY,
        search: query,
        page_size: 15,
      },
    });

    const results = res.data.results || [];
    return results.map((item: any) => {
      const platforms = (item.platforms || []).map((p: any) => p.platform?.name).filter(Boolean);
      const stores = (item.stores || []).map((s: any) => ({
        name: s.store?.name,
        url: s.store?.domain ? `https://${s.store.domain}` : undefined,
        type: 'store' as const,
      }));

      return {
        mediaType: 'GAME',
        externalSource: 'rawg',
        externalId: String(item.id),
        title: item.name,
        releaseDate: item.released,
        posterUrl: item.background_image || undefined,
        backdropUrl: item.background_image || undefined,
        genres: (item.genres || []).map((g: any) => g.name),
        metadata: {
          rating: item.rating,
          metacritic: item.metacritic,
          platforms,
          playtime: item.playtime,
        },
        watchProviders: {
          link: `https://rawg.io/games/${item.slug}`,
          providers: stores,
        }
      };
    });
  } catch (err) {
    console.warn('[RAWG] Search failed', err);
    return [];
  }
}
