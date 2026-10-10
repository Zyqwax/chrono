import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ChatRoomScreen } from '../../components/ChatRoomScreen';
import { useChatStore } from '../../store/useChatStore';
import { chronoTheme } from '../../theme/colors';

const { colors } = chronoTheme;

export default function ChatDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { rooms, activeRoom, setActiveRoom, fetchRooms } = useChatStore();
  const [loading, setLoading] = useState(false);

  // ID'ye karşılık gelen odayı bul
  const room = rooms.find((r) => r.id === id) || (activeRoom?.id === id ? activeRoom : null);

  useEffect(() => {
    if (!room && id) {
      setLoading(true);
      fetchRooms().finally(() => setLoading(false));
    }
  }, [id, room]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.primaryLight} />
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top', 'left', 'right']}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.notFoundText}>Sohbet odası bulunamadı.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    return () => {
      const cur = useChatStore.getState().activeRoom;
      if (cur?.id === id) {
        setActiveRoom(null);
      }
    };
  }, [id]);

  return (
    <View style={styles.rootContainer}>
      <ChatRoomScreen
        room={room}
        onBack={() => {
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
