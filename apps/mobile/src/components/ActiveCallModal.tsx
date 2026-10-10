import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../store/useChatStore';
import { api } from '../services/api';
import { chronoTheme } from '../theme/colors';
import { callKeepService } from '../services/callkeep';
import { liveKitService } from '../services/livekit';

const { colors } = chronoTheme;

export const ActiveCallModal: React.FC = () => {
  const {
    activeCall,
    currentUser,
    acceptCall,
    declineCall,
    endCall,
    isMuted,
    toggleMute,
    isVideoOn,
    toggleVideo,
  } = useChatStore();

  const [callDuration, setCallDuration] = useState(0);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [livekitServer, setLivekitServer] = useState<string | null>(null);
  const [livekitLoading, setLivekitLoading] = useState(false);

  // Dalga / Pulse animasyonu
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isMeCaller = activeCall?.caller?.id === currentUser?.id;
  const otherUser = isMeCaller ? activeCall?.callee : activeCall?.caller;
  const isIncoming = !isMeCaller && activeCall?.state === 'ringing';
  const isOutgoing = isMeCaller && activeCall?.state === 'ringing';
  const isActive = activeCall?.state === 'active';

  // CallKeep (CallKit / TelecomManager) dinleyicilerini bağla
  useEffect(() => {
    callKeepService.setup({
      onAnswerCall: (callId) => acceptCall(callId),
      onEndCall: (callId) => endCall(callId),
    });
  }, []);

  // Sistem araması (CallKeep) senkronizasyonu
  const lastCallIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeCall) {
      lastCallIdRef.current = activeCall.callId;
      const callerName = otherUser?.displayName || otherUser?.username || 'Kullanıcı';

      if (isIncoming && activeCall.state === 'ringing') {
        callKeepService.displayIncomingCall(activeCall.callId, callerName, activeCall.video);
      } else if (isOutgoing && activeCall.state === 'ringing') {
        callKeepService.startOutgoingCall(activeCall.callId, callerName, activeCall.video);
      } else if (isActive) {
        callKeepService.reportConnectedCall(activeCall.callId);
      }
    } else if (lastCallIdRef.current) {
      callKeepService.endCall(lastCallIdRef.current);
      lastCallIdRef.current = null;
      liveKitService.disconnect();
    }
  }, [activeCall, isIncoming, isOutgoing, isActive]);

  // Yalnızca gelen aramada (aranan kişinin telefonunda) titreşim
  useEffect(() => {
    if (isIncoming && activeCall?.state === 'ringing') {
      // 0ms gecikme ile hemen başla, 1000ms titreş, 1000ms bekle döngüsü
      Vibration.vibrate([0, 1000, 1000, 1000], true);
      return () => {
        Vibration.cancel();
      };
    } else {
      Vibration.cancel();
    }
  }, [isIncoming, activeCall?.state]);

  // Radar / Halka animasyonu
  useEffect(() => {
    if (activeCall?.state === 'ringing') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [activeCall?.state]);

  // Arama süresi sayacı ve LiveKit bağlantısı
  useEffect(() => {
    let timer: any = null;
    if (isActive) {
      setCallDuration(0);
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // LiveKit token'ını sunucudan çek
      if (activeCall?.mediaRoom) {
        setLivekitLoading(true);
        api
          .get(`/livekit/token/${activeCall.mediaRoom}`)
          .then((res) => {
            const token = res.data?.token || null;
            const server = res.data?.serverUrl || null;
            setLivekitToken(token);
            setLivekitServer(server);

            // Gerçek WebRTC LiveKit odasına bağlan
            if (token && server) {
              liveKitService.connect(server, token, !isMuted, isVideoOn);
            }
          })
          .catch((err) => {
            console.warn('LiveKit token alma hatası:', err?.message);
          })
          .finally(() => {
            setLivekitLoading(false);
          });
      }
    } else {
      setCallDuration(0);
      setLivekitToken(null);
      setLivekitServer(null);
      liveKitService.disconnect();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, activeCall?.mediaRoom]);

  // Mikrofon ve Kamera durumu değiştiğinde LiveKit'e bildir
  useEffect(() => {
    if (isActive) {
      liveKitService.setMicrophoneEnabled(!isMuted);
    }
  }, [isMuted, isActive]);

  useEffect(() => {
    if (isActive) {
      liveKitService.setCameraEnabled(isVideoOn);
    }
  }, [isVideoOn, isActive]);

  if (!activeCall) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const otherName =
    otherUser?.displayName || otherUser?.username || 'Kullanıcı';

  return (
    <Modal visible={!!activeCall} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        {/* Üst Bilgi Barı */}
        <View style={styles.topHeader}>
          <View style={styles.callTypePill}>
            <Ionicons
              name={activeCall.video ? 'videocam' : 'call'}
              size={14}
              color={colors.primaryLight}
            />
            <Text style={styles.callTypeText}>
              {activeCall.video ? 'GÖRÜNTÜLÜ ARAMA' : 'SESLİ ARAMA'}
            </Text>
          </View>
        </View>

        {/* Ana Arama Alanı (Kullanıcı Avatarı & Durum) */}
        <View style={styles.centerContent}>
          <Animated.View
            style={[
              styles.avatarRing,
              activeCall.state === 'ringing' && {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {otherUser?.avatarUrl ? (
              <Image source={{ uri: otherUser.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {otherName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </Animated.View>

          <Text style={styles.callerName}>{otherName}</Text>

          {/* Durum Metni */}
          <View style={styles.statusRow}>
            {isActive ? (
              <View style={styles.activeDurationBadge}>
                <View style={styles.greenLiveDot} />
                <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
              </View>
            ) : (
              <Text style={styles.ringingStatusText}>
                {isIncoming ? 'Gelen Arama...' : 'Çalıyor...'}
              </Text>
            )}
          </View>

          {/* LiveKit Medya Durumu Bilgisi */}
          {isActive && (
            <View style={styles.livekitBadge}>
              {livekitLoading ? (
                <View style={styles.livekitRow}>
                  <ActivityIndicator size="small" color={colors.primaryLight} />
                  <Text style={styles.livekitText}>LiveKit sunucusuna bağlanılıyor...</Text>
                </View>
              ) : livekitToken ? (
                <View style={styles.livekitRow}>
                  <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                  <Text style={[styles.livekitText, { color: '#10B981' }]}>
                    LiveKit Canlı WebRTC Bağlantısı Aktif
                  </Text>
                </View>
              ) : (
                <View style={styles.livekitRow}>
                  <Ionicons name="radio" size={16} color={colors.primaryLight} />
                  <Text style={styles.livekitText}>P2P Sinyalleşme Aktif</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Alt Butonlar */}
        <View style={styles.controlsFooter}>
          {isIncoming ? (
            /* Gelen Arama Kontrolleri: Reddet ve Cevapla */
            <View style={styles.incomingButtonsRow}>
              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.declineBtn]}
                  onPress={() => declineCall(activeCall.callId)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="call"
                    size={28}
                    color="#FFFFFF"
                    style={{ transform: [{ rotate: '135deg' }] }}
                  />
                </TouchableOpacity>
                <Text style={styles.btnLabel}>Reddet</Text>
              </View>

              <View style={styles.buttonCol}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => acceptCall(activeCall.callId)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={28} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.btnLabel}>Cevapla</Text>
              </View>
            </View>
          ) : (
            /* Aktif veya Giden Arama Kontrolleri */
            <View style={styles.inCallControlsWrapper}>
              <View style={styles.inCallOptionsRow}>
                {/* Mikrofon Sustur/Aç */}
                <TouchableOpacity
                  style={[styles.circleOptionBtn, isMuted && styles.circleOptionBtnActive]}
                  onPress={toggleMute}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={24}
                    color={isMuted ? '#EF4444' : '#FFFFFF'}
                  />
                </TouchableOpacity>

                {/* Hoparlör */}
                <TouchableOpacity
                  style={[styles.circleOptionBtn, speakerOn && styles.circleOptionBtnActive]}
                  onPress={() => setSpeakerOn(!speakerOn)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={speakerOn ? 'volume-high' : 'volume-medium'}
                    size={24}
                    color={speakerOn ? colors.primaryLight : '#FFFFFF'}
                  />
                </TouchableOpacity>

                {/* Kamera */}
                {activeCall.video && (
                  <TouchableOpacity
                    style={[styles.circleOptionBtn, !isVideoOn && styles.circleOptionBtnActive]}
                    onPress={toggleVideo}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isVideoOn ? 'videocam' : 'videocam-off'}
                      size={24}
                      color={!isVideoOn ? '#EF4444' : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Aramayı Sonlandır Butonu */}
              <TouchableOpacity
                style={[styles.actionBtn, styles.endCallBtn]}
                onPress={() => endCall(activeCall.callId)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="call"
                  size={32}
                  color="#FFFFFF"
                  style={{ transform: [{ rotate: '135deg' }] }}
                />
              </TouchableOpacity>
              <Text style={[styles.btnLabel, { marginTop: 8 }]}>Sonlandır</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F1A', // Chrono Deep Night
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topHeader: {
    alignItems: 'center',
    paddingTop: 16,
  },
  callTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  callTypeText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  avatarRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 3,
    borderColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: '#151D30',
  },
  avatarImage: {
    width: 136,
    height: 136,
    borderRadius: 68,
  },
  avatarPlaceholder: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 52,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callerName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    textAlign: 'center',
  },
  statusRow: {
    marginTop: 10,
    alignItems: 'center',
  },
  ringingStatusText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  greenLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  durationText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  livekitBadge: {
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#151D30',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  livekitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livekitText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  controlsFooter: {
    paddingBottom: 28,
  },
  incomingButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonCol: {
    alignItems: 'center',
  },
  actionBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  declineBtn: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  endCallBtn: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  btnLabel: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inCallControlsWrapper: {
    alignItems: 'center',
  },
  inCallOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginBottom: 28,
  },
  circleOptionBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleOptionBtnActive: {
    backgroundColor: '#334155',
    borderColor: colors.primaryLight,
  },
});
