import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { chronoTheme } from '../../theme/colors';
import { useChatStore } from '../../store/useChatStore';
import { api } from '../../services/api';

const { colors } = chronoTheme;

export default function SettingsScreen() {
  const router = useRouter();
  const {
    currentUser,
    settings,
    fetchSettings,
    updateSettings,
    logout,
  } = useChatStore();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Chrono hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/onboarding');
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.prompt
      ? Alert.prompt(
          'Hesabı Sil',
          'Hesabınızı ve tüm verilerinizi kalıcı olarak silmek için mevcut şifrenizi girin:',
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Kalıcı Olarak Sil',
              style: 'destructive',
              onPress: async (pwd?: string) => {
                if (!pwd) return;
                try {
                  await api.post('/users/me/delete', { password: pwd });
                  logout();
                  router.replace('/onboarding');
                } catch (err: any) {
                  Alert.alert('Hata', err.response?.data?.message || 'Hesap silinemedi');
                }
              },
            },
          ],
          'secure-text',
        )
      : Alert.alert(
          'Hesabı Sil',
          'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Sil',
              style: 'destructive',
              onPress: async () => {
                // Şifresiz fallback veya bilgilendirme
                setPasswordModalVisible(true);
              },
            },
          ],
        );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun');
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi');
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.message || 'Şifre değiştirilemedi');
    } finally {
      setSavingPassword(false);
    }
  };

  const cycleVisibility = async (key: 'lastSeenVisibility' | 'callVisibility' | 'roomInviteVisibility') => {
    const current = settings?.[key] || 'EVERYONE';
    const nextMap = {
      EVERYONE: 'CONTACTS',
      CONTACTS: 'NOBODY',
      NOBODY: 'EVERYONE',
    } as const;
    const next = nextMap[current as keyof typeof nextMap];
    await updateSettings({ [key]: next });
  };

  const getVisibilityLabel = (val?: string) => {
    switch (val) {
      case 'EVERYONE':
        return 'Herkes';
      case 'CONTACTS':
        return 'Kişilerim';
      case 'NOBODY':
        return 'Hiçkimse';
      default:
        return 'Herkes';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Üst Başlık */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Kullanıcı Profil Başlığı */}
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarWrapper}>
            {currentUser?.avatarUrl ? (
              <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {(currentUser?.displayName || currentUser?.username || 'Z')
                    .slice(0, 1)
                    .toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.profileName}>
            {currentUser?.displayName || currentUser?.username || 'Kullanıcı'}
          </Text>
          <Text style={styles.profileSubtitle}>
            @{currentUser?.username || 'kullanici'} • Dokunarak profili düzenleyin
          </Text>
        </TouchableOpacity>

        {/* 1. GRUP: Gizlilik ve Güvenlik (Tamamı DB'ye bağlı) */}
        <Text style={styles.sectionTitle}>GİZLİLİK VE GÜVENLİK</Text>
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.itemRow, styles.itemRowBorder]}
            onPress={() => cycleVisibility('lastSeenVisibility')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconBox, { backgroundColor: '#16A34A' }]}>
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Son Görülme ve Çevrimiçi</Text>
              <Text style={styles.itemSubtitle}>
                {getVisibilityLabel(settings?.lastSeenVisibility)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.itemRow, styles.itemRowBorder]}
            onPress={() => cycleVisibility('callVisibility')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconBox, { backgroundColor: '#0284C7' }]}>
              <Ionicons name="call-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Beni Arayabilecek Kişiler</Text>
              <Text style={styles.itemSubtitle}>
                {getVisibilityLabel(settings?.callVisibility)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.itemRow, styles.itemRowBorder]}
            onPress={() => cycleVisibility('roomInviteVisibility')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconBox, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="people-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Sohbet Odalarına Davet</Text>
              <Text style={styles.itemSubtitle}>
                {getVisibilityLabel(settings?.roomInviteVisibility)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.itemRow, styles.itemRowBorder]}>
            <View style={[styles.itemIconBox, { backgroundColor: '#0D9488' }]}>
              <Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Okundu Bilgisi (Mavi Tik)</Text>
              <Text style={styles.itemSubtitle}>
                {settings?.readReceipts ? 'Açık' : 'Kapalı'}
              </Text>
            </View>
            <Switch
              value={settings?.readReceipts ?? true}
              onValueChange={(val) => updateSettings({ readReceipts: val })}
              trackColor={{ false: '#334155', true: colors.primary }}
            />
          </View>

          <TouchableOpacity
            style={styles.itemRow}
            onPress={() => setPasswordModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconBox, { backgroundColor: '#EA580C' }]}>
              <Ionicons name="key-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Şifre Değiştir</Text>
              <Text style={styles.itemSubtitle}>Hesap güvenliğinizi koruyun</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 2. GRUP: Bildirimler */}
        <Text style={styles.sectionTitle}>BİLDİRİMLER</Text>
        <View style={styles.cardContainer}>
          <View style={[styles.itemRow, styles.itemRowBorder]}>
            <View style={[styles.itemIconBox, { backgroundColor: '#DC2626' }]}>
              <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Özel Sohbet Bildirimleri</Text>
              <Text style={styles.itemSubtitle}>Birebir mesajlar için bildirim</Text>
            </View>
            <Switch
              value={settings?.notifyPrivate ?? true}
              onValueChange={(val) => updateSettings({ notifyPrivate: val })}
              trackColor={{ false: '#334155', true: colors.primary }}
            />
          </View>

          <View style={[styles.itemRow, styles.itemRowBorder]}>
            <View style={[styles.itemIconBox, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Sohbet Odası Bildirimleri</Text>
              <Text style={styles.itemSubtitle}>Odalardan gelen bildirimler</Text>
            </View>
            <Switch
              value={settings?.notifyRooms ?? true}
              onValueChange={(val) => updateSettings({ notifyRooms: val })}
              trackColor={{ false: '#334155', true: colors.primary }}
            />
          </View>

          <View style={styles.itemRow}>
            <View style={[styles.itemIconBox, { backgroundColor: '#10B981' }]}>
              <Ionicons name="volume-medium-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Uygulama İçi Sesler</Text>
              <Text style={styles.itemSubtitle}>Mesaj alıp verirken ses çal</Text>
            </View>
            <Switch
              value={settings?.inAppSounds ?? true}
              onValueChange={(val) => updateSettings({ inAppSounds: val })}
              trackColor={{ false: '#334155', true: colors.primary }}
            />
          </View>
        </View>

        {/* 3. GRUP: Sohbet Ayarları */}
        <Text style={styles.sectionTitle}>SOHBET AYARLARI</Text>
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.itemRow, styles.itemRowBorder]}
            onPress={() => {
              const current = settings?.messageTextSize || 16;
              const next = current === 14 ? 16 : current === 16 ? 18 : 14;
              updateSettings({ messageTextSize: next });
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconBox, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="text-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>Mesaj Metin Boyutu</Text>
              <Text style={styles.itemSubtitle}>{settings?.messageTextSize || 16} px</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.itemRow}>
            <View style={[styles.itemIconBox, { backgroundColor: '#6366F1' }]}>
              <Ionicons name="time-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemTitle}>24 Saat Zaman Biçimi</Text>
              <Text style={styles.itemSubtitle}>Saat damgalarında 24s kullan</Text>
            </View>
            <Switch
              value={settings?.timeFormat24h ?? true}
              onValueChange={(val) => updateSettings({ timeFormat24h: val })}
              trackColor={{ false: '#334155', true: colors.primary }}
            />
          </View>
        </View>

        {/* 4. GRUP: Hesap Yönetimi & Çıkış */}
        <Text style={styles.sectionTitle}>HESAP VE ÇIKIŞ</Text>
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.itemRow, styles.itemRowBorder]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconBox, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={[styles.itemTitle, { color: '#EF4444' }]}>Çıkış Yap</Text>
              <Text style={styles.itemSubtitle}>Oturumu güvenle sonlandır</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.itemRow}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconBox, { backgroundColor: '#7F1D1D' }]}>
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.itemTextContainer}>
              <Text style={[styles.itemTitle, { color: '#EF4444' }]}>Hesabımı Sil</Text>
              <Text style={styles.itemSubtitle}>Tüm verileri ve mesajları kalıcı sil</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Şifre Değiştirme Modalı */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Şifre Değiştir</Text>

            <Text style={styles.modalInputLabel}>Mevcut Şifre</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.modalInputLabel}>Yeni Şifre (En az 6 karakter)</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Güncelle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarWrapper: {
    marginBottom: 10,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardContainer: {
    backgroundColor: '#151E2B',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  itemRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#151E2B',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0F1622',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCancelBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
