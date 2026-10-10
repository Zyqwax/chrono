import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { RoomsListScreen } from '../../components/RoomsListScreen';
import { useChatStore } from '../../store/useChatStore';
import { chronoTheme } from '../../theme/colors';

const { colors } = chronoTheme;

export default function ChatsTab() {
  const router = useRouter();
  const { setActiveRoom } = useChatStore();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <RoomsListScreen
        onSelectRoom={(room) => {
          setActiveRoom(room);
          router.push({
            pathname: '/chat/[id]',
            params: { id: room.id },
          });
        }}
        onOpenAuth={() => {
          router.push('/auth');
        }}
      />
    </View>
  );
}
