import { create } from 'zustand';
import { Channel, Message, Server, User, VoiceParticipant } from '../types';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { setAuthToken } from '../services/api';

interface ChatStore {
  // Auth state
  currentUser: User | null;
  token: string | null;
  setAuth: (user: User | null, token: string | null) => void;
  logout: () => void;

  // Server & Channel state
  servers: Server[];
  setServers: (servers: Server[]) => void;
  activeServer: Server | null;
  setActiveServer: (server: Server | null) => void;
  activeChannel: Channel | null;
  setActiveChannel: (channel: Channel | null) => void;

  // Messages state
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  typingUsers: string[];
  setTypingUsers: (users: string[]) => void;

  // Voice room state
  activeVoiceChannel: Channel | null;
  voiceParticipants: VoiceParticipant[];
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn: boolean;
  isVoiceModalOpen: boolean;
  joinVoiceChannel: (channel: Channel) => void;
  leaveVoiceChannel: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleVideo: () => void;
  setVoiceModalOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentUser: null,
  token: null,
  setAuth: (user, token) => {
    set({ currentUser: user, token });
    setAuthToken(token);
    if (token) {
      const socket = connectSocket(token);
      socket.on('new_message', (message: Message) => {
        const { activeChannel, addMessage } = get();
        if (activeChannel && message.channelId === activeChannel.id) {
          addMessage(message);
        }
      });
      socket.on('user_typing', (data: { channelId: string; username: string; isTyping: boolean }) => {
        const { activeChannel, typingUsers } = get();
        if (activeChannel && data.channelId === activeChannel.id) {
          if (data.isTyping && !typingUsers.includes(data.username)) {
            set({ typingUsers: [...typingUsers, data.username] });
          } else if (!data.isTyping) {
            set({ typingUsers: typingUsers.filter((u) => u !== data.username) });
          }
        }
      });
    } else {
      disconnectSocket();
    }
  },
  logout: () => {
    disconnectSocket();
    setAuthToken(null);
    set({
      currentUser: null,
      token: null,
      activeServer: null,
      activeChannel: null,
      activeVoiceChannel: null,
      messages: [],
    });
  },

  servers: [],
  setServers: (servers) => set({ servers }),
  activeServer: null,
  setActiveServer: (server) => {
    set({ activeServer: server });
    // Auto select first text channel
    if (server) {
      const firstCat = server.categories?.find((c) =>
        c.channels?.some((ch) => ch.type === 'TEXT'),
      );
      const firstTextChannel =
        firstCat?.channels?.find((ch) => ch.type === 'TEXT') ||
        server.channels?.find((ch) => ch.type === 'TEXT');
      if (firstTextChannel) {
        get().setActiveChannel(firstTextChannel);
      }
    }
  },
  activeChannel: null,
  setActiveChannel: (channel) => {
    const socket = getSocket();
    const prev = get().activeChannel;
    if (socket && prev) {
      socket.emit('leave_channel', { channelId: prev.id });
    }
    set({ activeChannel: channel, messages: [], typingUsers: [] });
    if (socket && channel) {
      socket.emit('join_channel', { channelId: channel.id });
    }
  },

  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => {
    const exists = get().messages.some((m) => m.id === message.id);
    if (!exists) {
      set((state) => ({ messages: [message, ...state.messages] }));
    }
  },
  typingUsers: [],
  setTypingUsers: (users) => set({ typingUsers: users }),

  activeVoiceChannel: null,
  voiceParticipants: [],
  isMuted: false,
  isDeafened: false,
  isVideoOn: false,
  isVoiceModalOpen: false,
  joinVoiceChannel: (channel) => {
    const { currentUser, isMuted, isVideoOn } = get();
    const socket = getSocket();
    if (socket) {
      socket.emit('join_voice', { channelId: channel.id, serverId: channel.serverId });
    }
    const selfParticipant: VoiceParticipant = {
      id: currentUser?.id || 'me',
      userId: currentUser?.id || 'me',
      displayName: currentUser?.displayName || 'Ben',
      avatarUrl: currentUser?.avatarUrl,
      isSpeaking: false,
      isMuted,
      isVideoOn,
    };
    set({
      activeVoiceChannel: channel,
      voiceParticipants: [selfParticipant],
      isVoiceModalOpen: true,
    });
  },
  leaveVoiceChannel: () => {
    const { activeVoiceChannel } = get();
    const socket = getSocket();
    if (socket && activeVoiceChannel) {
      socket.emit('leave_voice', { channelId: activeVoiceChannel.id });
    }
    set({
      activeVoiceChannel: null,
      voiceParticipants: [],
      isVoiceModalOpen: false,
      isVideoOn: false,
    });
  },
  toggleMute: () =>
    set((state) => ({
      isMuted: !state.isMuted,
      voiceParticipants: state.voiceParticipants.map((p) =>
        p.userId === state.currentUser?.id ? { ...p, isMuted: !state.isMuted } : p,
      ),
    })),
  toggleDeafen: () =>
    set((state) => ({
      isDeafened: !state.isDeafened,
      isMuted: !state.isDeafened ? true : state.isMuted,
    })),
  toggleVideo: () =>
    set((state) => ({
      isVideoOn: !state.isVideoOn,
      voiceParticipants: state.voiceParticipants.map((p) =>
        p.userId === state.currentUser?.id ? { ...p, isVideoOn: !state.isVideoOn } : p,
      ),
    })),
  setVoiceModalOpen: (open) => set({ isVoiceModalOpen: open }),
}));
