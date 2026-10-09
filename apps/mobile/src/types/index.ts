export type ChannelType = 'TEXT' | 'VOICE' | 'ANNOUNCEMENT';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status?: 'ONLINE' | 'IDLE' | 'DND' | 'OFFLINE';
}

export interface Channel {
  id: string;
  serverId: string;
  categoryId?: string | null;
  name: string;
  type: ChannelType;
  topic?: string | null;
  position: number;
}

export interface Category {
  id: string;
  serverId: string;
  name: string;
  position: number;
  channels: Channel[];
}

export interface Server {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  inviteCode?: string;
  ownerId: string;
  categories: Category[];
  channels?: Channel[];
  members?: { user: User }[];
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user?: {
    username: string;
  };
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  replyTo?: {
    id: string;
    content: string;
    sender: {
      displayName: string;
    };
  } | null;
  reactions?: MessageReaction[];
}

export interface VoiceParticipant {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
}
