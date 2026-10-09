import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { ServerRail } from './src/components/ServerRail';
import { ChannelSidebar } from './src/components/ChannelSidebar';
import { ChatFeed } from './src/components/ChatFeed';
import { VoiceRoomBar } from './src/components/VoiceRoomBar';
import { VoiceRoomModal } from './src/components/VoiceRoomModal';
import { AuthModal } from './src/components/AuthModal';
import { CreateServerModal } from './src/components/CreateServerModal';
import { useChatStore } from './src/store/useChatStore';
import { Server } from './src/types';

export default function App() {
  const {
    currentUser,
    setAuth,
    servers,
    setServers,
    setActiveServer,
    setMessages,
  } = useChatStore();

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [createServerModalVisible, setCreateServerModalVisible] = useState(false);

  // Initialize demo data if empty
  useEffect(() => {
    // 1. Initial User
    if (!currentUser) {
      const defaultUser = {
        id: 'user-demo-1',
        email: 'ahmet@chatagram.app',
        username: 'ahmet',
        displayName: 'Ahmet Yılmaz',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/png?seed=ahmet',
        status: 'ONLINE' as const,
      };
      setAuth(defaultUser, 'demo-token');
    }

    // 2. Initial Starter Servers (Discord structure)
    if (servers.length === 0) {
      const demoServers: Server[] = [
        {
          id: 'server-1',
          name: 'Chatagram Ana Topluluk',
          description: 'Resmi Chatagram Discord & WhatsApp Hibrit Topluluğu',
          iconUrl: 'https://api.dicebear.com/7.x/identicon/png?seed=chatagram',
          inviteCode: 'chatagram-2026',
          ownerId: 'user-demo-1',
          categories: [
            {
              id: 'cat-text-1',
              serverId: 'server-1',
              name: 'METİN SOHBET ODALARI',
              position: 0,
              channels: [
                {
                  id: 'ch-text-1',
                  serverId: 'server-1',
                  name: 'genel',
                  type: 'TEXT',
                  topic: 'Herkesin sohbet ettiği ana salon',
                  position: 0,
                },
                {
                  id: 'ch-text-2',
                  serverId: 'server-1',
                  name: 'duyurular',
                  type: 'TEXT',
                  topic: 'Önemli güncellemeler ve haberler',
                  position: 1,
                },
                {
                  id: 'ch-text-3',
                  serverId: 'server-1',
                  name: 'fikir-ve-öneriler',
                  type: 'TEXT',
                  topic: 'Uygulama hakkında geri bildirimler',
                  position: 2,
                },
              ],
            },
            {
              id: 'cat-voice-1',
              serverId: 'server-1',
              name: 'SES VE VİDEO ODALARI',
              position: 1,
              channels: [
                {
                  id: 'ch-voice-1',
                  serverId: 'server-1',
                  name: '🔊 Genel Sohbet Odası',
                  type: 'VOICE',
                  position: 0,
                },
                {
                  id: 'ch-voice-2',
                  serverId: 'server-1',
                  name: '🔊 Oyun & Müzik Odası',
                  type: 'VOICE',
                  position: 1,
                },
                {
                  id: 'ch-voice-3',
                  serverId: 'server-1',
                  name: '📹 Görüntülü Sahne',
                  type: 'VOICE',
                  position: 2,
                },
              ],
            },
          ],
        },
        {
          id: 'server-2',
          name: 'Gamer Lounge 🎮',
          iconUrl: 'https://api.dicebear.com/7.x/identicon/png?seed=gamer',
          ownerId: 'user-demo-2',
          categories: [
            {
              id: 'cat-game-1',
              serverId: 'server-2',
              name: 'OYUN KANALLARI',
              position: 0,
              channels: [
                {
                  id: 'ch-game-1',
                  serverId: 'server-2',
                  name: 'oyun-sohbet',
                  type: 'TEXT',
                  position: 0,
                },
                {
                  id: 'ch-game-2',
                  serverId: 'server-2',
                  name: '🔊 Takım Odası 1',
                  type: 'VOICE',
                  position: 1,
                },
              ],
            },
          ],
        },
        {
          id: 'server-3',
          name: 'Yazılımcılar Kulübü 💻',
          iconUrl: 'https://api.dicebear.com/7.x/identicon/png?seed=developers',
          ownerId: 'user-demo-3',
          categories: [
            {
              id: 'cat-dev-1',
              serverId: 'server-3',
              name: 'GELİŞTİRME',
              position: 0,
              channels: [
                {
                  id: 'ch-dev-1',
                  serverId: 'server-3',
                  name: 'kod-paylasimi',
                  type: 'TEXT',
                  position: 0,
                },
                {
                  id: 'ch-dev-2',
                  serverId: 'server-3',
                  name: '🔊 Pair Programming',
                  type: 'VOICE',
                  position: 1,
                },
              ],
            },
          ],
        },
      ];

      setServers(demoServers);
      setActiveServer(demoServers[0]);

      // Seed starter messages in #genel
      const starterMessages = [
        {
          id: 'msg-3',
          channelId: 'ch-text-1',
          senderId: 'user-demo-1',
          content: 'Süper! Hem WhatsApp balonları gibi akıcı hem de Discord ses odaları hazır 🚀',
          createdAt: new Date().toISOString(),
          sender: {
            id: 'user-demo-1',
            username: 'ahmet',
            displayName: 'Ahmet Yılmaz',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/png?seed=ahmet',
          },
        },
        {
          id: 'msg-2',
          channelId: 'ch-text-1',
          senderId: 'user-demo-2',
          content: 'Ses odasına tıkla ve konuşmaya başla, gürültü engelleme ve LiveKit SFU çalışıyor 🎙️',
          createdAt: new Date(Date.now() - 60000).toISOString(),
          sender: {
            id: 'user-demo-2',
            username: 'ayse',
            displayName: 'Ayşe Kaya',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/png?seed=ayse',
          },
        },
        {
          id: 'msg-1',
          channelId: 'ch-text-1',
          senderId: 'user-demo-3',
          content: 'Chatagram sunucusuna hoş geldiniz! Discord sunucu mantığı ile WhatsApp akıcılığı burada bir arada.',
          createdAt: new Date(Date.now() - 120000).toISOString(),
          sender: {
            id: 'user-demo-3',
            username: 'mehmet',
            displayName: 'Mehmet Demir',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/png?seed=mehmet',
          },
        },
      ];
      setMessages(starterMessages);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1e1f22" />

      {/* Main 3-Column Layout: ServerRail + ChannelSidebar + ChatFeed */}
      <View style={styles.appContainer}>
        <ServerRail
          onAddServerPress={() => setCreateServerModalVisible(true)}
          onProfilePress={() => setAuthModalVisible(true)}
        />

        <ChannelSidebar
          onCreateChannelPress={() => {}}
          onInvitePress={() => {}}
        />

        <ChatFeed />
      </View>

      {/* Floating Active Voice Room Status Bar */}
      <VoiceRoomBar />

      {/* Fullscreen Voice/Video Stage Modal */}
      <VoiceRoomModal />

      {/* Modals */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />

      <CreateServerModal
        visible={createServerModalVisible}
        onClose={() => setCreateServerModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1e1f22',
  },
  appContainer: {
    flex: 1,
    flexDirection: 'row',
  },
});
