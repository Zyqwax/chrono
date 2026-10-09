import React, { useState, useEffect } from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../store/useChatStore';

export const VoiceRoomModal: React.FC = () => {
  const {
    isVoiceModalOpen,
    setVoiceModalOpen,
    activeVoiceChannel,
    voiceParticipants,
    isMuted,
    isDeafened,
    isVideoOn,
    toggleMute,
    toggleDeafen,
    toggleVideo,
    leaveVoiceChannel,
  } = useChatStore();

  const [simulatedSpeaking, setSimulatedSpeaking] = useState(false);

  // Audio wave simulation
  useEffect(() => {
    if (!isMuted && isVoiceModalOpen) {
      const interval = setInterval(() => {
        setSimulatedSpeaking((prev) => !prev);
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setSimulatedSpeaking(false);
    }
  }, [isMuted, isVoiceModalOpen]);

  if (!activeVoiceChannel) return null;

  return (
    <Modal
      visible={isVoiceModalOpen}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setVoiceModalOpen(false)}
          >
            <Ionicons name="chevron-down" size={26} color="#f2f3f5" />
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.titleText}>{activeVoiceChannel.name}</Text>
            <View style={styles.connectedRow}>
              <View style={styles.greenDot} />
              <Text style={styles.connectedText}>WebRTC SFU • 24ms</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn}>
            <Ionicons name="people-outline" size={22} color="#f2f3f5" />
          </TouchableOpacity>
        </View>

        {/* Video / Voice Participant Grid */}
        <View style={styles.gridContainer}>
          {voiceParticipants.map((p) => {
            const isSpeakingNow = simulatedSpeaking && !isMuted;
            return (
              <View
                key={p.id}
                style={[
                  styles.participantCard,
                  isSpeakingNow && styles.participantCardSpeaking,
                ]}
              >
                {isVideoOn ? (
                  <View style={styles.videoStreamContainer}>
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60',
                      }}
                      style={styles.mockVideoFeed}
                    />
                    <View style={styles.videoBadge}>
                      <Text style={styles.videoBadgeText}>Kamera Açık</Text>
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.avatarWrapper,
                      isSpeakingNow && styles.avatarWrapperSpeaking,
                    ]}
                  >
                    {p.avatarUrl ? (
                      <Image
                        source={{ uri: p.avatarUrl }}
                        style={styles.participantAvatar}
                      />
                    ) : (
                      <View style={styles.defaultAvatar}>
                        <Text style={styles.defaultAvatarText}>
                          {p.displayName[0]?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Name & status tag */}
                <View style={styles.participantTag}>
                  <Text style={styles.participantName} numberOfLines={1}>
                    {p.displayName}
                  </Text>
                  {isMuted && (
                    <Ionicons
                      name="mic-off"
                      size={14}
                      color="#f23f43"
                      style={styles.micIcon}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Bottom Stage Control Dock */}
        <View style={styles.controlDock}>
          <TouchableOpacity
            style={[styles.dockBtn, isVideoOn && styles.dockBtnActive]}
            onPress={toggleVideo}
          >
            <Ionicons
              name={isVideoOn ? 'videocam' : 'videocam-off'}
              size={24}
              color={isVideoOn ? '#fff' : '#b5bac1'}
            />
            <Text style={styles.dockBtnLabel}>Kamera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockBtn, isMuted && styles.dockBtnMuted]}
            onPress={toggleMute}
          >
            <Ionicons
              name={isMuted ? 'mic-off' : 'mic'}
              size={24}
              color={isMuted ? '#fff' : '#b5bac1'}
            />
            <Text style={styles.dockBtnLabel}>
              {isMuted ? 'Açık Değil' : 'Mikrofon'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockBtn, isDeafened && styles.dockBtnMuted]}
            onPress={toggleDeafen}
          >
            <Ionicons
              name={isDeafened ? 'headset-sharp' : 'headset-outline'}
              size={24}
              color={isDeafened ? '#fff' : '#b5bac1'}
            />
            <Text style={styles.dockBtnLabel}>Kulaklık</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockBtn, styles.dockBtnDisconnect]}
            onPress={leaveVoiceChannel}
          >
            <Ionicons name="call" size={24} color="#fff" />
            <Text style={[styles.dockBtnLabel, { color: '#fff' }]}>Ayrıl</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1f22',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2b2d31',
  },
  closeBtn: {
    padding: 6,
  },
  titleBlock: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f2f3f5',
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#23a55a',
    marginRight: 4,
  },
  connectedText: {
    fontSize: 11,
    color: '#23a55a',
  },
  gridContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantCard: {
    width: '100%',
    height: 280,
    backgroundColor: '#2b2d31',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  participantCardSpeaking: {
    borderColor: '#23a55a',
  },
  avatarWrapper: {
    padding: 6,
    borderRadius: 60,
  },
  avatarWrapperSpeaking: {
    backgroundColor: 'rgba(35, 165, 90, 0.25)',
  },
  participantAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  defaultAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#5865F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  videoStreamContainer: {
    width: '100%',
    height: '100%',
  },
  mockVideoFeed: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  participantTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    color: '#f2f3f5',
    fontSize: 13,
    fontWeight: 'bold',
  },
  micIcon: {
    marginLeft: 6,
  },
  controlDock: {
    height: 84,
    backgroundColor: '#111214',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  dockBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2b2d31',
  },
  dockBtnActive: {
    backgroundColor: '#5865F2',
  },
  dockBtnMuted: {
    backgroundColor: '#f23f43',
  },
  dockBtnDisconnect: {
    backgroundColor: '#f23f43',
    transform: [{ rotate: '135deg' }],
  },
  dockBtnLabel: {
    fontSize: 10,
    color: '#949ba4',
    marginTop: 2,
  },
});
