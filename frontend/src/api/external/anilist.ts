import axios from 'axios';
import { MediaItem } from '../../types/media.js';

const ANILIST_API = 'https://graphql.anilist.co';

const SEARCH_QUERY = `
query ($search: String, $type: MediaType) {
  Page(page: 1, perPage: 15) {
    media(search: $search, type: $type, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      type
      format
      status
      description
      startDate {
        year
        month
        day
      }
      episodes
      chapters
      volumes
      genres
      averageScore
      coverImage {
        extraLarge
        large
        medium
      }
      bannerImage
      siteUrl
      externalLinks {
        site
        url
        icon
      }
    }
  }
}
`;

export async function searchAniList(query: string, type: 'ANIME' | 'MANGA'): Promise<Partial<MediaItem>[]> {
  if (!query.trim()) return [];

  try {
    const res = await axios.post(
      ANILIST_API,
      {
        query: SEARCH_QUERY,
        variables: {
          search: query,
          type,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    const mediaList = res.data.data?.Page?.media || [];

    return mediaList.map((item: any) => {
      const releaseYear = item.startDate?.year;
      const releaseDate = releaseYear ? `${releaseYear}-${String(item.startDate.month || 1).padStart(2, '0')}-${String(item.startDate.day || 1).padStart(2, '0')}` : undefined;

      const streamingLinks = (item.externalLinks || [])
        .filter((l: any) => ['Crunchyroll', 'Netflix', 'HIDIVE', 'Hulu'].includes(l.site))
        .map((l: any) => ({
          name: l.site,
          url: l.url,
          logoUrl: l.icon,
          type: 'stream' as const,
        }));

      return {
        mediaType: type === 'ANIME' ? 'ANIME' : 'MANGA',
        externalSource: 'anilist',
        externalId: String(item.id),
        title: item.title.english || item.title.romaji || item.title.native,
        originalTitle: item.title.native || item.title.romaji,
        releaseDate,
        posterUrl: item.coverImage?.extraLarge || item.coverImage?.large,
        backdropUrl: item.bannerImage || undefined,
        totalUnits: type === 'ANIME' ? item.episodes : (item.chapters || item.volumes),
        genres: item.genres || [],
        metadata: {
          format: item.format,
          status: item.status,
          averageScore: item.averageScore,
          description: item.description,
          siteUrl: item.siteUrl,
        },
        watchProviders: {
          link: item.siteUrl,
          providers: streamingLinks,
        }
      };
    });
  } catch (err) {
    console.warn('[AniList] Search failed', err);
    return [];
  }
}
