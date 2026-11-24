import axios from 'axios';
import { MediaItem } from '../../types/media.js';

export async function searchMusic(query: string): Promise<Partial<MediaItem>[]> {
  if (!query.trim()) return [];

  try {
    // Apple / iTunes public search (zero authentication required, CORS enabled)
    const res = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query,
        media: 'music',
        entity: 'album',
        limit: 15,
      },
    });

    const results = res.data.results || [];
    return results.map((item: any) => ({
      mediaType: 'MUSIC',
      externalSource: 'itunes',
      externalId: String(item.collectionId),
      title: item.collectionName,
      releaseDate: item.releaseDate,
      posterUrl: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : undefined,
      totalUnits: item.trackCount,
      genres: [item.primaryGenreName].filter(Boolean),
      metadata: {
        artistName: item.artistName,
        trackCount: item.trackCount,
        copyright: item.copyright,
      },
      watchProviders: {
        link: item.collectionViewUrl,
        providers: [
          {
            name: 'Apple Music',
            url: item.collectionViewUrl,
            type: 'stream' as const,
          },
          {
            name: 'Spotify Search',
            url: `https://open.spotify.com/search/${encodeURIComponent(item.collectionName + ' ' + item.artistName)}`,
            type: 'stream' as const,
          }
        ]
      }
    }));
  } catch (err) {
    console.warn('[Music] Search failed', err);
    return [];
  }
}
