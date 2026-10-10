import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useChatStore } from '../store/useChatStore';
import { chronoTheme } from '../theme/colors';

const { colors, radius } = chronoTheme;

interface CreateRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onRoomCreated?: (room: any) => void;
}

const PRESET_ICONS = ['💬', '🚀', '🎮', '💡', '🔥', '🎧', '⚡', '☕', '🌟'];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  visible,
  onClose,
  onRoomCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('💬');
  const [loading, setLoading] = useState(false);
  const { fetchRooms, setActiveRoom } = useChatStore();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir sohbet odası adı girin');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/rooms', {
        name: `${selectedIcon} ${name.trim()}`,
        description: description.trim(),
        iconUrl: null,
      });

      await fetchRooms();
      setActiveRoom(res.data);
      if (onRoomCreated) onRoomCreated(res.data);
      setName('');
      setDescription('');
      onClose();
    } catch (err: any) {
      Alert.alert(
        'Hata',
        err.response?.data?.message || 'Sohbet odası oluşturulurken bir hata oluştu',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <SafeAreaView style={styles.card} edges={['bottom']}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View>
                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={styles.title}>Yeni Sohbet Odası</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.subtitle}>
                    Telegram benzeri topluluk ve canlı sesli sohbet odası başlatın.
                  </Text>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Icon Picker */}
                    <Text style={styles.label}>Oda Simgesi</Text>
                    <View style={styles.iconRow}>
                      {PRESET_ICONS.map((icon) => (
                        <TouchableOpacity
                          key={icon}
                          style={[
                            styles.iconBadge,
                            selectedIcon === icon && styles.selectedIconBadge,
                          ]}
                          onPress={() => setSelectedIcon(icon)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.iconText}>{icon}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Room Name */}
                    <Text style={styles.label}>Sohbet Odası Adı</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Örn: Yazılım ve Tasarım"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={name}
                      onChangeText={setName}
                      maxLength={40}
                    />

                    {/* Room Description */}
                    <Text style={styles.label}>Açıklama (İsteğe Bağlı)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Odanın amacını veya kurallarını belirtin..."
                      placeholderTextColor={colors.inputPlaceholder}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      maxLength={150}
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[styles.createBtn, loading && styles.btnDisabled]}
                      onPress={handleCreate}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.createBtnText}>Sohbet Odasını Başlat</Text>
                      )}
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 18,
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  selectedIconBadge: {
    borderColor: colors.primaryLight,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    transform: [{ scale: 1.08 }],
  },
  iconText: {
    fontSize: 20,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
