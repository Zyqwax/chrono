import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Uygulama açıkken bildirimlerin görünüm davranışı
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isSilent = notification.request.content.data?.isSilent;
    return {
      shouldShowAlert: true,
      shouldPlaySound: !isSilent,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

class NotificationService {
  private isConfigured = false;
  private currentCallNotificationId: string | null = null;

  async init() {
    if (this.isConfigured) return;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (Platform.OS === 'android') {
        // 1. Mesaj Bildirim Kanalı (Öncelikli & Sesli)
        await Notifications.setNotificationChannelAsync('messages_channel', {
          name: 'Mesajlar',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#38BDF8',
          sound: 'default',
        });

        // 2. Gelen Arama Bildirim Kanalı (En yüksek öncelik / Heads-up)
        await Notifications.setNotificationChannelAsync('calls_channel', {
          name: 'Gelen Aramalar',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 1000, 1000, 1000],
          lightColor: '#10B981',
          sound: 'default',
        });

        // 3. Sessiz Bildirim Kanalı (Sesli sohbet başlangıçları vb.)
        await Notifications.setNotificationChannelAsync('silent_channel', {
          name: 'Sessiz Bildirimler',
          importance: Notifications.AndroidImportance.LOW,
          vibrationPattern: [],
          sound: undefined,
          enableVibrate: false,
        });
      }

      this.isConfigured = true;
    } catch (err) {
      console.warn('NotificationService init hatası:', err);
    }
  }

  // Giden / Yeni gelen mesajlar için bildirim
  async showMessageNotification(senderName: string, text: string, roomId: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: senderName,
          body: text,
          data: { roomId, type: 'message' },
          sound: 'default',
          color: '#38BDF8',
        },
        trigger: null, // Hemen göster
      });
    } catch (err) {
      console.warn('Mesaj bildirimi gösterme hatası:', err);
    }
  }

  // Gelen arama bildirimi (Heads-up / Tam bildirim)
  async showCallNotification(callerName: string, isVideo: boolean, callId: string) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: isVideo ? '📹 Gelen Görüntülü Arama' : '📞 Gelen Sesli Arama',
          body: `${callerName} sizi arıyor...`,
          data: { callId, type: 'call' },
          sound: 'default',
          color: '#10B981',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
      this.currentCallNotificationId = id;
    } catch (err) {
      console.warn('Arama bildirimi gösterme hatası:', err);
    }
  }

  // Arama sonlandığında bildirimi temizle
  async dismissCallNotification() {
    if (this.currentCallNotificationId) {
      try {
        await Notifications.dismissNotificationAsync(this.currentCallNotificationId);
      } catch (err) {
        // yut
      }
      this.currentCallNotificationId = null;
    }
  }

  // Odalardaki sesli sohbet için SESSİZ bildirim (arama gibi çalmaz)
  async showSilentVoiceRoomNotification(roomName: string, userDisplayName: string, roomId: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎙️ ${roomName}`,
          body: `${userDisplayName} sesli sohbete katıldı`,
          data: { roomId, type: 'voice_room', isSilent: true },
          sound: undefined,
        },
        trigger: null,
      });
    } catch (err) {
      console.warn('Sessiz sesli sohbet bildirimi hatası:', err);
    }
  }
}

export const notificationService = new NotificationService();
