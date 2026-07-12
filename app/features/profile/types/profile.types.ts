import type { PlaylistSummary } from '../../playlists/types/playlists.types';

export interface UserProfileInfo {
  sub: string;
  name: string;
  picture: string;
  isPublicProfile: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface UserProfileResponse {
  profile: UserProfileInfo;
  playlists: PlaylistSummary[];
}

export interface UserConnection {
  sub: string;
  name: string;
  picture: string;
}

export interface UserConnectionsResponse {
  users: UserConnection[];
  anonymousCount: number;
}
