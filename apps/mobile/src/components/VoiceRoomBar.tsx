import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../store/useChatStore';

export const VoiceRoomBar: React.FC = () => {
  const {
    activeVoiceChannel,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeafen,
    leaveVoiceChannel,
    setVoiceModalOpen,
  } = useChatStore();

  if (!activeVoiceChannel) return null;

  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={styles.infoArea}
        onPress={() => setVoiceModalOpen(true)}
        activeOpacity={0.8}
      >
        <View style={styles.statusRow}>
          <View style={styles.greenDot} />
          <Text style={styles.statusText}>Ses Bağlandı</Text>
        </View>
        <Text style={styles.channelName} numberOfLines={1}>
          {activeVoiceChannel.name}
        </Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, isMuted && styles.activeMuteBtn]}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? 'mic-off' : 'mic'}
            size={18}
            color={isMuted ? '#fff' : '#b5bac1'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, isDeafened && styles.activeMuteBtn]}
          onPress={toggleDeafen}
        >
          <Ionicons
            name={isDeafened ? 'headset-sharp' : 'headset-outline'}
            size={18}
            color={isDeafened ? '#fff' : '#b5bac1'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.disconnectBtn]}
          onPress={leaveVoiceChannel}
        >
          <Ionicons name="call" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 54,
    backgroundColor: '#111214',
    borderTopWidth: 1,
    borderTopColor: '#23a55a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  infoArea: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#23a55a',
    marginRight: 6,
  },
  statusText: {
    color: '#23a55a',
    fontSize: 11,
    fontWeight: 'bold',
  },
  channelName: {
    color: '#949ba4',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2b2d31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeMuteBtn: {
    backgroundColor: '#f23f43',
  },
  disconnectBtn: {
    backgroundColor: '#f23f43',
    transform: [{ rotate: '135deg' }],
  },
});
