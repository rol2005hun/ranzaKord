export type SearchResultType = 'song' | 'artist' | 'album' | 'video' | 'playlist' | 'profile';

export interface SearchResultArtist {
  name: string;
  id?: string;
}

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  artist: string;
  artists?: SearchResultArtist[];
  artistId?: string;
  albumId?: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  plays?: string;
}

export interface CategorizedSearchResults {
  topResult?: SearchResult;
  songs: SearchResult[];
  artists: SearchResult[];
  albums: SearchResult[];
  profiles: SearchResult[];
}

export interface ArtistDetail {
  id: string;
  name: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  description?: string;
  topSongs: SearchResult[];
  albums: SearchResult[];
}

export interface PaginatedSongs {
  items: SearchResult[];
  continuation?: string;
}

export interface AlbumDetail {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  year?: string;
  tracks: SearchResult[];
}
