import { User } from './auth.js';
import { MediaItem, ItemStatus } from './media.js';

export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

export interface FriendRelation {
  friendshipId: string;
  status: FriendshipStatus;
  isOutgoingRequest: boolean;
  isIncomingRequest: boolean;
  user: User;
}

export interface LibraryComparisonItem {
  mediaItem: MediaItem;
  friendStatus: ItemStatus;
  friendRating: number | null;
  myStatus: ItemStatus | 'NOT_IN_LIBRARY';
  myRating: number | null;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  mediaItemId?: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  mediaItem?: MediaItem | null;
}
