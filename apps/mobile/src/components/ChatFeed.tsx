import React, { useState, useRef } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../store/useChatStore';
import { Message } from '../types';
import { getSocket } from '../services/socket';

export const ChatFeed: React.FC = () => {
  const {
    activeChannel,
    messages,
    currentUser,
    typingUsers,
    addMessage,
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChannel || !currentUser) return;

    const content = inputText.trim();
    setInputText('');

    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', {
        channelId: activeChannel.id,
        content,
      });
    } else {
      // Offline fallback / demo
      const fakeMsg: Message = {
        id: Math.random().toString(),
        channelId: activeChannel.id,
        senderId: currentUser.id,
        content,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          username: currentUser.username,
          displayName: currentUser.displayName,
          avatarUrl: currentUser.avatarUrl,
        },
      };
      addMessage(fakeMsg);
    }
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    const socket = getSocket();
    if (socket && activeChannel && currentUser) {
      if (text.length > 0) {
        socket.emit('typing_start', {
          channelId: activeChannel.id,
          username: currentUser.displayName,
        });
      } else {
        socket.emit('typing_stop', {
          channelId: activeChannel.id,
        });
      }
    }
  };

  if (!activeChannel) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles" size={64} color="#4e5058" />
        <Text style={styles.emptyTitle}>Kanal Seçilmedi</Text>
        <Text style={styles.emptySubtitle}>
          Sohbet etmek için sol menüden bir kanal seçin.
        </Text>
      </View>
    );
  }

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.senderId === currentUser?.id;
    const time = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <Image
            source={{
              uri:
                item.sender.avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(
                  item.sender.username,
                )}`,
            }}
            style={styles.messageAvatar}
          />
        )}

        <View
          style={[
            styles.bubbleContainer,
            isMe ? styles.bubbleMe : styles.bubbleOther,
          ]}
        >
          {!isMe && (
            <Text style={styles.senderName}>{item.sender.displayName}</Text>
          )}

          {item.replyTo && (
            <View style={styles.replyBox}>
              <Text style={styles.replySender}>
                {item.replyTo.sender.displayName}
              </Text>
              <Text style={styles.replyContent} numberOfLines={1}>
                {item.replyTo.content}
              </Text>
            </View>
          )}

          <Text style={styles.messageText}>{item.content}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.timestamp}>{time}</Text>
            {isMe && (
              <Ionicons
                name="checkmark-done"
                size={14}
                color="#25D366" // WhatsApp blue/green double ticks
                style={styles.checkIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Channel Bar */}
      <View style={styles.channelHeader}>
        <View style={styles.channelHeaderLeft}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#80848e" />
          <Text style={styles.channelTitle}>{activeChannel.name}</Text>
          {activeChannel.topic ? (
            <Text style={styles.channelTopic} numberOfLines={1}>
              — {activeChannel.topic}
            </Text>
          ) : null}
        </View>

        <View style={styles.channelHeaderRight}>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Ionicons name="call-outline" size={20} color="#b5bac1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Ionicons name="videocam-outline" size={20} color="#b5bac1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Ionicons name="search-outline" size={20} color="#b5bac1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List (Inverted for smooth WhatsApp feel) */}
      <FlatList
        ref={flatListRef}
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <View style={styles.typingBar}>
          <Text style={styles.typingText}>
            {typingUsers.join(', ')} yazıyor...
          </Text>
        </View>
      )}

      {/* WhatsApp Style Bottom Input Bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
          <Ionicons name="add" size={24} color="#b5bac1" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder={`#${activeChannel.name} kanalına mesaj yaz...`}
          placeholderTextColor="#80848e"
          value={inputText}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSendMessage}
          multiline
        />

        {inputText.trim().length > 0 ? (
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSendMessage}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.micBtn} activeOpacity={0.8}>
            <Ionicons name="mic" size={22} color="#25D366" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#313338',
  },
  channelHeader: {
    height: 52,
    backgroundColor: '#313338',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2023',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  channelHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f2f3f5',
    marginLeft: 8,
  },
  channelTopic: {
    fontSize: 13,
    color: '#949ba4',
    marginLeft: 8,
    flex: 1,
  },
  channelHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionBtn: {
    padding: 6,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  bubbleContainer: {
    maxWidth: '78%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMe: {
    backgroundColor: '#005c4b', // WhatsApp Dark Green message bubble
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#202c33', // WhatsApp Dark Slate bubble
    borderBottomLeftRadius: 4,
  },
  senderName: {
    color: '#5865F2',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
  },
  replyBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#5865F2',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  replySender: {
    color: '#e0e0e0',
    fontSize: 11,
    fontWeight: '600',
  },
  replyContent: {
    color: '#949ba4',
    fontSize: 11,
  },
  messageText: {
    color: '#e9edef',
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#8696a0',
  },
  checkIcon: {
    marginLeft: 4,
  },
  typingBar: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 12,
    color: '#25D366',
    fontStyle: 'italic',
  },
  inputContainer: {
    minHeight: 56,
    backgroundColor: '#202c33',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  attachBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2a3942',
    color: '#e9edef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00a884',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f2f3f5',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#949ba4',
    textAlign: 'center',
    marginTop: 6,
  },
});
