import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { Message, Room } from '../types';
import { useChatStore } from '../store/useChatStore';
import { RoomInfoModal } from './RoomInfoModal';
import { VoiceRoomSheet } from './VoiceRoomSheet';
import { chronoTheme } from '../theme/colors';

const { colors } = chronoTheme;

interface ChatRoomScreenProps {
  room: Room;
  onBack: () => void;
}

export const ChatRoomScreen: React.FC<ChatRoomScreenProps> = ({ room, onBack }) => {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [voiceSheetVisible, setVoiceSheetVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Yanıtlama & Düzenleme state'leri
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const {
    currentUser,
    messages,
    fetchMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    typingUsers,
    sendTyping,
    markAsRead,
    activeVoiceRoomId,
    joinRoomVoice,
    startCall,
    roomVoiceStates,
  } = useChatStore();

  const isDirect = room.type === 'DIRECT';
  const chatTitle = isDirect
    ? room.peer?.displayName || room.peer?.username || 'Kullanıcı'
    : room.name || 'Sohbet Odası';

  const isPeerOnline = isDirect && room.peer?.status === 'ONLINE';

  useEffect(() => {
    loadChat();
    markAsRead(room.id);
  }, [room.id]);

  const loadChat = async () => {
    setLoading(true);
    await fetchMessages(room.id);
    setLoading(false);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text.length > 0) {
      sendTyping(room.id, true);
    } else {
      sendTyping(room.id, false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();

    if (editingMessage) {
      await editMessage(editingMessage.id, text);
      setEditingMessage(null);
    } else {
      await sendMessage(room.id, text, replyMessage?.id);
      setReplyMessage(null);
    }

    setInputText('');
    sendTyping(room.id, false);
  };

  const handleStartCall = (video = false) => {
    Alert.alert(
      video ? 'Görüntülü Arama' : 'Sesli Arama',
      `${chatTitle} kullanıcısını aramak istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ara',
          onPress: () => {
            startCall(room.id, video);
          },
        },
      ],
    );
  };

  const handleVoiceJoin = () => {
    joinRoomVoice(room.id);
    setVoiceSheetVisible(true);
  };

  const handleMessageLongPress = (item: Message) => {
    const isMe = item.senderId === currentUser?.id;
    const options: { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress: () => void }[] = [
      {
        text: 'Yanıtla',
        onPress: () => setReplyMessage(item),
      },
    ];

    if (isMe && item.type === 'TEXT') {
      options.push({
        text: 'Düzenle',
        onPress: () => {
          setEditingMessage(item);
          setInputText(item.content);
        },
      });
    }

    if (isMe) {
      options.push({
        text: 'Sil',
        style: 'destructive',
        onPress: () => deleteMessage(item.id),
      });
    }

    options.push({ text: 'İptal', style: 'cancel', onPress: () => {} });

    Alert.alert('Mesaj Seçenekleri', undefined, options);
  };

  const voiceState = roomVoiceStates?.[room.id];
  const activeVoiceCount = voiceState?.count ?? 0;
  const isVoiceActiveInThisRoom = !isDirect && (activeVoiceCount > 0 || activeVoiceRoomId === room.id);
  const isMeInVoice = activeVoiceRoomId === room.id;

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatCallDuration = (secs: number) => {
    if (secs <= 0) return '';
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins > 0) {
      return `${mins} dk ${remainingSecs > 0 ? `${remainingSecs} sn` : ''}`;
    }
    return `${remainingSecs} sn`;
  };

  const renderCallBubble = (item: Message, isMe: boolean) => {
    let callData = { video: false, status: 'ended', duration: 0 };
    try {
      if (typeof item.content === 'string' && item.content.startsWith('{')) {
        callData = JSON.parse(item.content);
      }
    } catch {
      // fallback
    }

    const { video, status, duration } = callData;
    const isMissed = !isMe && (status === 'missed' || status === 'declined' || status === 'busy');
    const isCancelled = isMe && (status === 'missed' || status === 'cancelled');
    const isDeclined = isMe && status === 'declined';
    const isEnded = status === 'ended';

    let title = 'Sesli Arama';
    let sub = formatTime(item.createdAt);
    let iconName: any = video ? 'videocam' : 'call';
    let badgeColor = '#10B981';
    let badgeBg = 'rgba(16, 185, 129, 0.15)';

    if (isMissed) {
      title = video ? 'Cevapsız Görüntülü Arama' : 'Cevapsız Arama';
      iconName = video ? 'videocam-off' : 'call-outline';
      badgeColor = '#EF4444';
      badgeBg = 'rgba(239, 68, 68, 0.18)';
    } else if (isCancelled) {
      title = video ? 'İptal Edilen Görüntülü Arama' : 'İptal Edilen Arama';
      iconName = video ? 'videocam' : 'call';
      badgeColor = '#94A3B8';
      badgeBg = 'rgba(148, 163, 184, 0.15)';
    } else if (isDeclined) {
      title = video ? 'Reddedilen Görüntülü Arama' : 'Reddedilen Arama';
      iconName = video ? 'close-circle' : 'call';
      badgeColor = '#F59E0B';
      badgeBg = 'rgba(245, 158, 11, 0.18)';
    } else if (isEnded) {
      title = isMe
        ? (video ? 'Giden Görüntülü Arama' : 'Giden Sesli Arama')
        : (video ? 'Gelen Görüntülü Arama' : 'Gelen Sesli Arama');
      const durStr = formatCallDuration(duration);
      if (durStr) {
        sub = `${durStr} · ${sub}`;
      }
    }

    return (
      <View style={styles.callMessageCenterContainer}>
        <TouchableOpacity
          style={styles.callBubbleCard}
          onPress={() => isDirect && handleStartCall(video)}
          activeOpacity={0.8}
        >
          <View style={[styles.callBadgeCircle, { backgroundColor: badgeBg }]}>
            <Ionicons name={iconName} size={20} color={badgeColor} />
          </View>

          <View style={styles.callTextColumn}>
            <Text style={[styles.callTitleText, isMissed && { color: '#F87171' }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.callSubtitleText}>{sub}</Text>
          </View>

          {isDirect && (
            <TouchableOpacity
              style={styles.callActionIconBtn}
              onPress={() => handleStartCall(video)}
              activeOpacity={0.7}
            >
              <Ionicons name={video ? 'videocam' : 'call'} size={16} color={colors.primaryLight} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const giftedMessages = React.useMemo<IMessage[]>(() => {
    return messages.map((item) => {
      const isSystem = item.type === 'SYSTEM';
      return {
        _id: item.id,
        text: item.deletedAt ? '🚫 Bu mesaj silindi' : item.content,
        createdAt: new Date(item.createdAt),
        user: {
          _id: item.senderId,
          name: item.sender?.displayName || item.sender?.username || 'Kullanıcı',
          avatar: item.sender?.avatarUrl || undefined,
        },
        system: isSystem,
        sent: true,
        received: !!room.othersReadAt,
        raw: item,
      } as IMessage & { raw: Message };
    });
  }, [messages, room.othersReadAt]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        {/* ------------------------------------------------------------- */}
        {/* Telegram Style Chat Header                                    */}
        {/* ------------------------------------------------------------- */}
        <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Room Header Info (Clickable for Room / Profile Details) */}
        <TouchableOpacity
          style={styles.roomHeaderInfo}
          onPress={() => setInfoModalVisible(true)}
          activeOpacity={0.8}
        >
          {isDirect && room.peer?.avatarUrl ? (
            <Image source={{ uri: room.peer.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {chatTitle.charAt(0).toUpperCase()}
              </Text>
              {isVoiceActiveInThisRoom && <View style={styles.headerVoiceDot} />}
            </View>
          )}

          <View style={styles.headerTitles}>
            <Text style={styles.roomName} numberOfLines={1}>
              {chatTitle}
            </Text>
            <Text style={styles.roomStatus} numberOfLines={1}>
              {typingUsers.length > 0 ? (
                <Text style={{ color: colors.primaryLight }}>
                  {typingUsers.map((u) => u.displayName).join(', ')} yazıyor...
                </Text>
              ) : isDirect ? (
                isPeerOnline ? (
                  <Text style={{ color: '#10B981' }}>çevrimiçi</Text>
                ) : (
                  <Text style={{ color: colors.textSecondary }}>son görülme yakınlarda</Text>
                )
              ) : isVoiceActiveInThisRoom ? (
                <Text style={{ color: colors.primaryLight }}>🎙️ Canlı Sesli Sohbet</Text>
              ) : (
                `${room.membersCount || room.members?.length || 1} üye`
              )}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Header Actions: DM ise Arama; Oda ise Sesli Sohbet */}
        <View style={styles.headerActions}>
          {isDirect ? (
            <>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => handleStartCall(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={21} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => handleStartCall(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="videocam-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionIconBtn,
                isVoiceActiveInThisRoom && styles.actionIconBtnActive,
              ]}
              onPress={handleVoiceJoin}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isVoiceActiveInThisRoom ? 'volume-high' : 'mic-outline'}
                size={22}
                color={isVoiceActiveInThisRoom ? colors.primaryLight : colors.textPrimary}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => setInfoModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ------------------------------------------------------------- */}
      {/* Live Voice Chat Header Banner (Sohbet Odaları için)           */}
      {/* ------------------------------------------------------------- */}
      {!isDirect && isVoiceActiveInThisRoom && (
        <TouchableOpacity
          style={[styles.liveVoiceBanner, isMeInVoice && { backgroundColor: '#0B291B', borderColor: '#10B98155' }]}
          onPress={() => {
            if (!isMeInVoice) {
              handleVoiceJoin();
            } else {
              setVoiceSheetVisible(true);
            }
          }}
          activeOpacity={0.85}
        >
          <View style={styles.voiceBannerContent}>
            <View style={[styles.voiceWaveIconBg, isMeInVoice && { backgroundColor: '#10B981' }]}>
              <Ionicons name={isMeInVoice ? 'volume-high' : 'mic'} size={16} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.voiceBannerTitle, isMeInVoice && { color: '#10B981' }]}>
                {isMeInVoice ? 'Sesli Sohbet Sürdürülüyor' : 'Canlı Sesli Sohbet'}
              </Text>
              <Text style={styles.voiceBannerSubtitle}>
                {activeVoiceCount > 0
                  ? `${activeVoiceCount} kişi odada konuşuyor`
                  : 'Dokunarak konuşmaya katılın'}
              </Text>
            </View>
          </View>
          <View style={[styles.joinBtnPill, isMeInVoice && { backgroundColor: '#10B981' }]}>
            <Text style={styles.joinBtnText}>{isMeInVoice ? 'YÖNET' : 'KATIL'}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Mesaj Beslemesi & Gifted Chat Loader                          */}
      {/* ------------------------------------------------------------- */}
      <View style={styles.chatArea}>
        {loading && messages.length === 0 ? (
          <View style={styles.giftedLoaderContainer}>
            <ActivityIndicator size="large" color={colors.primaryLight} />
            <Text style={styles.giftedLoaderText}>Mesajlar yükleniyor...</Text>
          </View>
        ) : (
          <GiftedChat
            messages={giftedMessages}
            user={{
              _id: currentUser?.id || '',
              name: currentUser?.displayName || 'Kullanıcı',
              avatar: currentUser?.avatarUrl || undefined,
            }}
            loadEarlier={false}
            isLoadingEarlier={loading}
            onLoadEarlier={() => loadChat()}
            renderLoading={() => (
              <View style={styles.giftedLoaderContainer}>
                <ActivityIndicator size="large" color={colors.primaryLight} />
                <Text style={styles.giftedLoaderText}>Mesajlar yükleniyor...</Text>
              </View>
            )}
            renderBubble={(bubbleProps) => {
              const currentMsg = bubbleProps.currentMessage as
                | (IMessage & { raw?: Message })
                | undefined;
              const item = currentMsg?.raw;
              if (!item) return null;

              const isMe = item.senderId === currentUser?.id;
              const isDeleted = !!item.deletedAt;

              if (item.type === 'SYSTEM') {
                const isVoiceEnd = item.content.includes('Sesli sohbet sona erdi');
                return (
                  <View style={[styles.systemMessageContainer, isVoiceEnd && styles.systemVoiceEndContainer]}>
                    <Text style={[styles.systemMessageText, isVoiceEnd && styles.systemVoiceEndText]}>
                      {item.content}
                    </Text>
                  </View>
                );
              }

              if (item.type === 'CALL') {
                return renderCallBubble(item, isMe);
              }

              return (
                <TouchableOpacity
                  style={[
                    styles.messageBubbleContainer,
                    isMe ? styles.myMessageContainer : styles.otherMessageContainer,
                  ]}
                  onLongPress={() => handleMessageLongPress(item)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.myBubble : styles.otherBubble,
                    ]}
                  >
                    {!isDirect && !isMe && (
                      <Text style={styles.senderName}>
                        {item.sender?.displayName || item.sender?.username || 'Kullanıcı'}
                      </Text>
                    )}

                    {item.replyTo && (
                      <View style={styles.replyPreviewInBubble}>
                        <Text style={styles.replySenderInBubble}>
                          {item.replyTo.sender?.displayName || 'Kullanıcı'}
                        </Text>
                        <Text style={styles.replyTextInBubble} numberOfLines={1}>
                          {item.replyTo.content || 'Silinmiş mesaj'}
                        </Text>
                      </View>
                    )}

                    <Text style={[styles.messageContent, isDeleted && styles.deletedMessageText]}>
                      {isDeleted ? '🚫 Bu mesaj silindi' : item.content}
                    </Text>

                    <View style={styles.metaRow}>
                      {item.editedAt && !isDeleted && (
                        <Text style={styles.editedTag}>düzenlendi </Text>
                      )}
                      <Text
                        style={[
                          styles.timeText,
                          isMe ? styles.myTimeText : styles.otherTimeText,
                        ]}
                      >
                        {formatTime(item.createdAt)}
                      </Text>
                      {isMe && (
                        <Ionicons
                          name={room.othersReadAt ? 'checkmark-done' : 'checkmark'}
                          size={15}
                          color={room.othersReadAt ? colors.primaryLight : colors.bubbleSentTime}
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            renderChatEmpty={() => (
              <View style={styles.emptyFeed}>
                <View style={styles.emptyFeedIconBg}>
                  <Ionicons name="chatbubbles-outline" size={36} color={colors.primaryLight} />
                </View>
                <Text style={styles.emptyFeedTitle}>Henüz mesaj yok</Text>
                <Text style={styles.emptyFeedText}>İlk mesajı göndererek sohbeti başlatın.</Text>
              </View>
            )}
            renderInputToolbar={() => null}
            minInputToolbarHeight={0}
            messagesContainerStyle={styles.messagesList}
            listViewProps={{
              keyboardDismissMode: 'on-drag',
              keyboardShouldPersistTaps: 'handled',
            }}
          />
        )}
        </View>

        {/* Yanıtlama veya Düzenleme Banner'ı */}
        {(replyMessage || editingMessage) && (
          <View style={styles.actionBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionBannerTitle}>
                {editingMessage ? 'Mesajı Düzenle' : `Yanıtla: ${replyMessage?.sender?.displayName || 'Kullanıcı'}`}
              </Text>
              <Text style={styles.actionBannerText} numberOfLines={1}>
                {editingMessage ? editingMessage.content : replyMessage?.content}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setReplyMessage(null);
                setEditingMessage(null);
                setInputText('');
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Telegram Input Bar                                            */}
        {/* ------------------------------------------------------------- */}
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: isKeyboardVisible ? 8 : Math.max(insets.bottom, 8) },
          ]}
        >
          <View style={styles.inputBox}>
            <TouchableOpacity style={styles.inputIconBtn} activeOpacity={0.7}>
              <Ionicons name="happy-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Mesaj yazın..."
              placeholderTextColor={colors.inputPlaceholder}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
            />

            <TouchableOpacity style={styles.inputIconBtn} activeOpacity={0.7}>
              <Ionicons name="attach-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Dinamik Gönder Butonu */}
          <TouchableOpacity
            style={[
              styles.actionSendBtn,
              inputText.trim() ? styles.actionSendBtnActive : styles.actionMicBtn,
            ]}
            onPress={inputText.trim() ? handleSend : (!isDirect ? handleVoiceJoin : undefined)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={inputText.trim() ? 'send' : 'mic'}
              size={19}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <RoomInfoModal
        visible={infoModalVisible}
        roomId={room.id}
        onClose={() => setInfoModalVisible(false)}
        onRoomDeletedOrLeft={onBack}
      />

      {!isDirect && (
        <VoiceRoomSheet
          visible={voiceSheetVisible}
          roomName={chatTitle}
          onClose={() => setVoiceSheetVisible(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingRoot: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
  },
  roomHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarText: {
    color: colors.primaryLight,
    fontSize: 16,
    fontWeight: '700',
  },
  headerVoiceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.online,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  headerTitles: {
    flex: 1,
  },
  roomName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  roomStatus: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  liveVoiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  voiceBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  voiceWaveIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceBannerTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  voiceBannerSubtitle: {
    color: colors.primaryLight,
    fontSize: 11,
  },
  joinBtnPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  joinBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chatArea: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageBubbleContainer: {
    marginVertical: 4,
    maxWidth: '82%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: colors.bubbleSent,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.bubbleReceived,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  senderName: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  replyPreviewInBubble: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryLight,
    paddingLeft: 8,
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 4,
    paddingVertical: 2,
  },
  replySenderInBubble: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  replyTextInBubble: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageContent: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  deletedMessageText: {
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  editedTag: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  myTimeText: {
    color: colors.bubbleSentTime,
  },
  otherTimeText: {
    color: colors.bubbleTime,
  },
  systemMessageContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(21, 29, 48, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    marginVertical: 6,
  },
  systemMessageText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  systemVoiceEndContainer: {
    backgroundColor: '#0B291B',
    borderColor: '#10B98155',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
    marginVertical: 8,
  },
  systemVoiceEndText: {
    color: '#34D399',
    fontSize: 12.5,
    fontWeight: '600',
  },
  emptyFeed: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    transform: [{ scaleY: -1 }],
  },
  emptyFeedIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  emptyFeedTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyFeedText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  actionBannerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 22,
    paddingHorizontal: 8,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  actionSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  actionSendBtnActive: {
    backgroundColor: colors.primary,
  },
  actionMicBtn: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  giftedLoaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  giftedLoaderText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  callMessageCenterContainer: {
    alignSelf: 'center',
    marginVertical: 6,
    width: '92%',
    maxWidth: 340,
  },
  callBubbleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151D30',
    borderWidth: 1,
    borderColor: '#222F4C',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  callBadgeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callTextColumn: {
    flex: 1,
  },
  callTitleText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '600',
  },
  callSubtitleText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  callActionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
