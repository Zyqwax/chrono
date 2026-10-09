import React from 'react';
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
import { Server } from '../types';

interface Props {
  onAddServerPress: () => void;
  onProfilePress: () => void;
}

export const ServerRail: React.FC<Props> = ({
  onAddServerPress,
  onProfilePress,
}) => {
  const { servers, activeServer, setActiveServer, currentUser } = useChatStore();

  return (
    <View style={styles.rail}>
      {/* Home / Direct Messages button */}
      <TouchableOpacity
        style={[
          styles.serverIcon,
          activeServer === null && styles.activeServerIcon,
          styles.homeIcon,
        ]}
        onPress={() => setActiveServer(null)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Server List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {servers.map((server: Server) => {
          const isActive = activeServer?.id === server.id;
          return (
            <TouchableOpacity
              key={server.id}
              style={[
                styles.serverIcon,
                isActive && styles.activeServerIcon,
              ]}
              onPress={() => setActiveServer(server)}
              activeOpacity={0.8}
            >
              {server.iconUrl ? (
                <Image
                  source={{ uri: server.iconUrl }}
                  style={styles.serverImage}
                />
              ) : (
                <Text style={styles.serverInitials}>
                  {server.name.slice(0, 2).toUpperCase()}
                </Text>
              )}
              {isActive && <View style={styles.activePill} />}
            </TouchableOpacity>
          );
        })}

        {/* Add Server Button */}
        <TouchableOpacity
          style={[styles.serverIcon, styles.addServerIcon]}
          onPress={onAddServerPress}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={26} color="#23a55a" />
        </TouchableOpacity>
      </ScrollView>

      {/* User Avatar at bottom */}
      <TouchableOpacity
        style={styles.userAvatarContainer}
        onPress={onProfilePress}
        activeOpacity={0.8}
      >
        {currentUser?.avatarUrl ? (
          <Image
            source={{ uri: currentUser.avatarUrl }}
            style={styles.userAvatar}
          />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.defaultAvatarText}>
              {currentUser?.displayName?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.onlineDot} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  rail: {
    width: 72,
    backgroundColor: '#1e1f22',
    alignItems: 'center',
    paddingVertical: 12,
  },
  homeIcon: {
    backgroundColor: '#25D366', // WhatsApp Green accent
  },
  divider: {
    width: 32,
    height: 2,
    backgroundColor: '#35363c',
    borderRadius: 1,
    marginVertical: 8,
  },
  scrollList: {
    alignItems: 'center',
    gap: 10,
  },
  serverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#313338',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activeServerIcon: {
    borderRadius: 16,
    backgroundColor: '#5865F2',
  },
  serverImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  serverInitials: {
    color: '#f2f3f5',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activePill: {
    position: 'absolute',
    left: 0,
    width: 4,
    height: 36,
    backgroundColor: '#ffffff',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  addServerIcon: {
    backgroundColor: '#2b2d31',
    borderWidth: 1,
    borderColor: '#35363c',
  },
  userAvatarContainer: {
    marginTop: 8,
    position: 'relative',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  defaultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5865F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#23a55a',
    borderWidth: 2,
    borderColor: '#1e1f22',
  },
});
