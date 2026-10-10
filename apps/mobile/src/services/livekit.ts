import { Room, RoomEvent, Track } from 'livekit-client';

let isLiveKitNativeReady = false;

try {
  const { registerGlobals } = require('@livekit/react-native');
  if (typeof registerGlobals === 'function') {
    registerGlobals();
    isLiveKitNativeReady = true;
    console.log('🎙️ LiveKit WebRTC globals başarıyla yüklendi.');
  }
} catch (e) {
  // Expo Go veya WebRTC olmayan ortam
  isLiveKitNativeReady = false;
}

class LiveKitService {
  private currentRoom: Room | null = null;

  async connect(serverUrl: string, token: string, enableMic = true, enableCam = false): Promise<Room | null> {
    if (this.currentRoom) {
      await this.disconnect();
    }

    try {
      const room = new Room({
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
        publishDefaults: {
          videoSimulcastLayers: [],
        },
      });

      this.currentRoom = room;

      room.on(RoomEvent.Connected, () => {
        console.log('🟢 LiveKit odasına bağlandı:', room.name);
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('🔴 LiveKit odasından ayrıldı.');
      });

      await room.connect(serverUrl, token);

      if (enableMic) {
        await room.localParticipant.setMicrophoneEnabled(true).catch((err) => {
          console.warn('Mikrofon açma uyarısı:', err?.message);
        });
      }

      if (enableCam) {
        await room.localParticipant.setCameraEnabled(true).catch((err) => {
          console.warn('Kamera açma uyarısı:', err?.message);
        });
      }

      return room;
    } catch (err: any) {
      console.warn('LiveKit bağlantı hatası:', err?.message);
      return null;
    }
  }

  async setMicrophoneEnabled(enabled: boolean) {
    if (this.currentRoom?.localParticipant) {
      await this.currentRoom.localParticipant.setMicrophoneEnabled(enabled).catch(console.warn);
    }
  }

  async setCameraEnabled(enabled: boolean) {
    if (this.currentRoom?.localParticipant) {
      await this.currentRoom.localParticipant.setCameraEnabled(enabled).catch(console.warn);
    }
  }

  async disconnect() {
    if (this.currentRoom) {
      try {
        await this.currentRoom.disconnect();
      } catch (err) {
        console.warn('LiveKit bağlantı kesme hatası:', err);
      }
      this.currentRoom = null;
    }
  }
}

export const liveKitService = new LiveKitService();
