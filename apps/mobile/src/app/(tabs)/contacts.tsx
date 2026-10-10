import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
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
import { Contact } from '../../types';
import { api } from '../../services/api';

const { colors } = chronoTheme;

export default function ContactsScreen() {
  const router = useRouter();
  const {
    contacts,
    fetchContacts,
    addContact,
    removeContact,
    openDirect,
    setActiveRoom,
  } = useChatStore();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Yeni kişi ekleme modalı
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    await fetchContacts();
    setLoading(false);
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/users/search', { params: { q } });
      setSearchResults(res.data);
    } catch {
      // Hata durumunda sessiz kal
    } finally {
      setSearching(false);
    }
  };

  const handleAddUserAsContact = async (user: any) => {
    try {
      await addContact(user.id);
      setAddModalVisible(false);
      setSearchQuery('');
      setSearchResults([]);
      Alert.alert('Başarılı', `${user.displayName} kişilerinize eklendi.`);
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.message || 'Kişi eklenemedi');
    }
  };

  const handleContactPress = async (contact: Contact) => {
    try {
      const direct = await openDirect(contact.user.id);
      setActiveRoom(direct);
      router.push({ pathname: '/chat/[id]', params: { id: direct.id } });
    } catch (err: any) {
      Alert.alert('Hata', err.response?.data?.message || 'Sohbet açılamadı');
    }
  };

  const handleContactLongPress = (contact: Contact) => {
    Alert.alert(
      contact.user.displayName,
      `@${contact.user.username}`,
      [
        {
          text: 'Mesaj Gönder',
          onPress: () => handleContactPress(contact),
        },
        {
          text: 'Kişiyi Sil',
          style: 'destructive',
          onPress: () => removeContact(contact.user.id),
        },
        { text: 'İptal', style: 'cancel' },
      ],
    );
  };

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase();
    const name = (c.nickname || c.user.displayName || '').toLowerCase();
    const username = (c.user.username || '').toLowerCase();
    return name.includes(q) || username.includes(q);
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kişiler</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#6E7F91" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kişilerde Ara..."
            placeholderTextColor="#6E7F91"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#6E7F91" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Kişiler Listesi */}
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadContacts}
        ListHeaderComponent={
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => setAddModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBadge, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Yeni Kişi Ekle</Text>
            </TouchableOpacity>
            <View style={styles.sectionDivider} />
          </View>
        }
        renderItem={({ item }) => {
          const isOnline = item.user.status === 'ONLINE';
          const title = item.nickname || item.user.displayName;

          return (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => handleContactPress(item)}
              onLongPress={() => handleContactLongPress(item)}
              activeOpacity={0.65}
            >
              {item.user.avatarUrl ? (
                <Image source={{ uri: item.user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>
                    {title.charAt(0).toUpperCase()}
                  </Text>
                  {isOnline && <View style={styles.onlineBadge} />}
                </View>
              )}

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{title}</Text>
                <Text
                  style={[
                    styles.contactStatus,
                    isOnline && styles.onlineStatusText,
                  ]}
                >
                  {isOnline ? 'çevrimiçi' : `@${item.user.username}`}
                </Text>
              </View>

              <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Henüz kayıtlı kişi yok</Text>
              <Text style={styles.emptySubtitle}>
                Kişi ekleyerek doğrudan birebir sohbet başlatabilirsiniz.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Yeni Kişi Ekle Modalı */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.modalBackBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Kişi Ekle</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#6E7F91" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Kullanıcı adı veya isim arayın..."
                placeholderTextColor="#6E7F91"
                value={searchQuery}
                onChangeText={handleSearchUsers}
                autoFocus
              />
            </View>
          </View>

          {searching && (
            <ActivityIndicator color={colors.primaryLight} style={{ marginVertical: 16 }} />
          )}

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => {
              const alreadyContact = contacts.some((c) => c.user.id === item.id);
              return (
                <View style={styles.searchItem}>
                  <View style={styles.searchAvatar}>
                    <Text style={styles.avatarInitials}>
                      {(item.displayName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchName}>{item.displayName}</Text>
                    <Text style={styles.searchUsername}>@{item.username}</Text>
                  </View>
                  {alreadyContact ? (
                    <Text style={styles.alreadyAddedText}>Ekli</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleAddUserAsContact(item)}
                    >
                      <Text style={styles.addBtnText}>Ekle</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        </SafeAreaView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16212E',
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: 110,
  },
  quickActions: {
    paddingTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 16,
  },
  actionIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: colors.background,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  contactStatus: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  onlineStatusText: {
    color: '#38BDF8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    gap: 14,
  },
  searchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  searchUsername: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  alreadyAddedText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
