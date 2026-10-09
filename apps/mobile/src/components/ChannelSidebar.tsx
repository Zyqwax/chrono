import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../store/useChatStore';
import { Channel } from '../types';

interface Props {
  onCreateChannelPress: () => void;
  onInvitePress: () => void;
}

export const ChannelSidebar: React.FC<Props> = ({
  onCreateChannelPress,
  onInvitePress,
}) => {
  const {
    activeServer,
    activeChannel,
    setActiveChannel,
    activeVoiceChannel,
    joinVoiceChannel,
    currentUser,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
  } = useChatStore();

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  if (!activeServer) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Direkt Mesajlar</Text>
        </View>
        <View style={styles.emptyDm}>
          <Ionicons name="chatbubbles-outline" size={48} color="#80848e" />
          <Text style={styles.emptyDmText}>Sohbetler ve arkadaşlar burada listelenir</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Server Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={onInvitePress}
        activeOpacity={0.7}
      >
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeServer.name}
        </Text>
        <Ionicons name="person-add" size={18} color="#b5bac1" />
      </TouchableOpacity>

      {/* Channels List */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.channelsList}>
        {activeServer.categories?.map((cat) => {
          const isCollapsed = collapsedCategories[cat.id];
          return (
            <View key={cat.id} style={styles.categoryContainer}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={12}
                  color="#949ba4"
                />
                <Text style={styles.categoryTitle}>{cat.name}</Text>
                <TouchableOpacity
                  style={styles.addChannelBtn}
                  onPress={onCreateChannelPress}
                >
                  <Ionicons name="add" size={16} color="#949ba4" />
                </TouchableOpacity>
              </TouchableOpacity>

              {!isCollapsed &&
                cat.channels?.map((channel: Channel) => {
                  const isText = channel.type === 'TEXT';
                  const isActive = activeChannel?.id === channel.id;
                  const isVoiceActive = activeVoiceChannel?.id === channel.id;

                  return (
                    <TouchableOpacity
                      key={channel.id}
                      style={[
                        styles.channelItem,
                        isActive && isText && styles.activeChannelItem,
                        isVoiceActive && styles.activeVoiceChannelItem,
                      ]}
                      onPress={() => {
                        if (isText) {
                          setActiveChannel(channel);
                        } else {
                          joinVoiceChannel(channel);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isText ? 'chatbubble-ellipses' : 'volume-high'}
                        size={18}
                        color={isActive || isVoiceActive ? '#fff' : '#949ba4'}
                        style={styles.channelIcon}
                      />
                      <Text
                        style={[
                          styles.channelName,
                          (isActive || isVoiceActive) && styles.activeChannelName,
                        ]}
                        numberOfLines={1}
                      >
                        {channel.name}
                      </Text>

                      {!isText && isVoiceActive && (
                        <View style={styles.voiceLiveBadge}>
                          <Text style={styles.voiceLiveText}>CANLI</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom User Bar */}
      <View style={styles.userBar}>
        <View style={styles.userInfo}>
          {currentUser?.avatarUrl ? (
            <Image
              source={{ uri: currentUser.avatarUrl }}
              style={styles.userBarAvatar}
            />
          ) : (
            <View style={styles.userBarDefaultAvatar}>
              <Text style={styles.userBarAvatarText}>
                {currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.userNameBlock}>
            <Text style={styles.userDisplayName} numberOfLines={1}>
              {currentUser?.displayName || 'Misafir'}
            </Text>
            <Text style={styles.userUsername} numberOfLines={1}>
              @{currentUser?.username || 'user'}
            </Text>
          </View>
        </View>

        <View style={styles.userControls}>
          <TouchableOpacity
            style={styles.controlIconBtn}
            onPress={toggleMute}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={20}
              color={isMuted ? '#f23f43' : '#b5bac1'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlIconBtn}
            onPress={toggleDeafen}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDeafened ? 'headset-sharp' : 'headset-outline'}
              size={20}
              color={isDeafened ? '#f23f43' : '#b5bac1'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: '#2b2d31',
    borderRightWidth: 1,
    borderRightColor: '#1f2023',
  },
  header: {
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2023',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f2f3f5',
    flex: 1,
    marginRight: 8,
  },
  channelsList: {
    flex: 1,
    paddingTop: 8,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#949ba4',
    marginLeft: 6,
    flex: 1,
    letterSpacing: 0.5,
  },
  addChannelBtn: {
    padding: 2,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    borderRadius: 6,
    marginBottom: 2,
  },
  activeChannelItem: {
    backgroundColor: '#35373c',
  },
  activeVoiceChannelItem: {
    backgroundColor: 'rgba(35, 165, 90, 0.15)',
  },
  channelIcon: {
    marginRight: 8,
  },
  channelName: {
    fontSize: 14,
    color: '#949ba4',
    flex: 1,
  },
  activeChannelName: {
    color: '#f2f3f5',
    fontWeight: '600',
  },
  voiceLiveBadge: {
    backgroundColor: '#23a55a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  voiceLiveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userBar: {
    height: 56,
    backgroundColor: '#232428',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userBarAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  userBarDefaultAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#5865F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBarAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userNameBlock: {
    marginLeft: 8,
    flex: 1,
  },
  userDisplayName: {
    color: '#f2f3f5',
    fontSize: 13,
    fontWeight: '600',
  },
  userUsername: {
    color: '#949ba4',
    fontSize: 11,
  },
  userControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlIconBtn: {
    padding: 6,
    borderRadius: 4,
    marginLeft: 2,
  },
  emptyDm: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyDmText: {
    color: '#80848e',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 13,
  },
});
