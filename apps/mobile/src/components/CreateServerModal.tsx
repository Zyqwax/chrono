import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../store/useChatStore';
import { api } from '../services/api';
import { Server } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const CreateServerModal: React.FC<Props> = ({ visible, onClose }) => {
  const { servers, setServers, setActiveServer, currentUser } = useChatStore();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [serverName, setServerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!serverName.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/servers', { name: serverName.trim() });
      const newServer: Server = res.data;
      setServers([...servers, newServer]);
      setActiveServer(newServer);
      onClose();
      setServerName('');
    } catch (err: any) {
      // Offline fallback mock creation
      const fakeServer: Server = {
        id: `srv-${Date.now()}`,
        name: serverName.trim(),
        ownerId: currentUser?.id || 'me',
        categories: [
          {
            id: `cat-1-${Date.now()}`,
            serverId: `srv-${Date.now()}`,
            name: 'METİN KANALLARI',
            position: 0,
            channels: [
              {
                id: `ch-1-${Date.now()}`,
                serverId: `srv-${Date.now()}`,
                name: 'genel',
                type: 'TEXT',
                position: 0,
              },
            ],
          },
          {
            id: `cat-2-${Date.now()}`,
            serverId: `srv-${Date.now()}`,
            name: 'SES KANALLARI',
            position: 1,
            channels: [
              {
                id: `ch-2-${Date.now()}`,
                serverId: `srv-${Date.now()}`,
                name: '🔊 Sohbet Odası 1',
                type: 'VOICE',
                position: 0,
              },
            ],
          },
        ],
      };
      setServers([...servers, fakeServer]);
      setActiveServer(fakeServer);
      onClose();
      setServerName('');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/servers/join', { inviteCode: inviteCode.trim() });
      const joined: Server = res.data;
      setServers([...servers, joined]);
      setActiveServer(joined);
      onClose();
      setInviteCode('');
    } catch (err: any) {
      setError('Geçersiz davet kodu veya sunucu bulunamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {tab === 'create' ? 'Yeni Sunucu Oluştur' : 'Bir Sunucuya Katıl'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#949ba4" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, tab === 'create' && styles.activeTab]}
              onPress={() => setTab('create')}
            >
              <Text
                style={[styles.tabText, tab === 'create' && styles.activeTabText]}
              >
                Oluştur
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'join' && styles.activeTab]}
              onPress={() => setTab('join')}
            >
              <Text
                style={[styles.tabText, tab === 'join' && styles.activeTabText]}
              >
                Katıl
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {tab === 'create' ? (
            <View style={styles.form}>
              <Text style={styles.label}>Sunucu İsmi</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Oyun & Yazılım Topluluğu"
                placeholderTextColor="#80848e"
                value={serverName}
                onChangeText={setServerName}
              />
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!serverName.trim() || loading) && styles.submitBtnDisabled,
                ]}
                onPress={handleCreate}
                disabled={!serverName.trim() || loading}
              >
                <Text style={styles.submitBtnText}>Sunucuyu Oluştur</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Davet Kodu veya Bağlantısı</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: a8b4c-9821..."
                placeholderTextColor="#80848e"
                value={inviteCode}
                onChangeText={setInviteCode}
              />
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!inviteCode.trim() || loading) && styles.submitBtnDisabled,
                ]}
                onPress={handleJoin}
                disabled={!inviteCode.trim() || loading}
              >
                <Text style={styles.submitBtnText}>Sunucuya Katıl</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#2b2d31',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#35373c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1e1f22',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#5865F2',
  },
  tabText: {
    color: '#949ba4',
    fontWeight: '600',
    fontSize: 13,
  },
  activeTabText: {
    color: '#fff',
  },
  errorText: {
    color: '#f23f43',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  form: {
    gap: 12,
  },
  label: {
    color: '#b5bac1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#1e1f22',
    color: '#f2f3f5',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#5865F2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
