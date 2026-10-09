# Chatagram 🚀
> Discord Sunucu & Oda Mimarili, WhatsApp & Telegram Akıcılığında Mobil İletişim Platformu

Chatagram; topluluk yönetimini (Sunucular, Kategoriler, Metin ve Ses/Video Odaları, Roller) **Discord** mantığıyla kurgulayan; mesajlaşma deneyimini, hızını ve sezgiselliğini ise **WhatsApp ve Telegram** akıcılığıyla sunan yeni nesil bir mobil iletişim platformudur.

---

## 🏗️ Proje Mimarisi

Monorepo yapısı `pnpm workspaces` ile yönetilmektedir:

```
chatagram/
├── apps/
│   ├── mobile/                    # React Native (Expo SDK) Mobil Uygulaması
│   │   ├── src/
│   │   │   ├── components/        # ServerRail, ChannelSidebar, ChatFeed, VoiceRoomBar, VoiceRoomModal...
│   │   │   ├── store/             # Zustand (State & Socket yönetimi)
│   │   │   ├── services/          # API & Socket.io istemcisi
│   │   │   └── types/             # Tip tanımlamaları
│   │   └── App.tsx                # Ana arayüz kabuğu
│   │
│   └── server/                    # NestJS Gerçek Zamanlı Backend & API Sunucusu
│       ├── prisma/
│       │   └── schema.prisma      # PostgreSQL şeması (User, Server, Channel, Message, Voice...)
│       ├── src/
│       │   ├── auth/              # JWT kimlik doğrulama, bcrypt, @CurrentUser()
│       │   ├── servers/           # Sunucu oluşturma, listeleme, davet kodu ile katılma
│       │   ├── channels/          # Metin (TEXT) ve Ses (VOICE) odaları
│       │   ├── messages/          # Mesaj gönderme, sayfalama, emoji reaksiyonları
│       │   ├── livekit/           # WebRTC SFU oda token servisi
│       │   └── gateway/           # Socket.io WebSocket Gateway (Realtime eventler)
│       └── main.ts
│
├── package.json                   # Root monorepo scriptleri
└── pnpm-workspace.yaml
```

---

## ⚡ Hızlı Başlangıç

### 1. Bağımlılıkları Yükleme
```bash
pnpm install
```

### 2. Backend Sunucusunu Başlatma
```bash
# apps/server dizininde veya root'tan:
pnpm server:dev
```
Backend API varsayılan olarak `http://localhost:3001/api` adresinde, WebSocket ise `ws://localhost:3001` adresinde çalışacaktır.

### 3. Mobil Uygulamayı Başlatma
```bash
# apps/mobile dizininde veya root'tan:
pnpm mobile:dev
```
Expo geliştirici menüsü açılacaktır:
- `a` tuşuna basarak Android Emülatöründe,
- `i` tuşuna basarak iOS Simülatöründe,
- `w` tuşuna basarak Web tarayıcısında anında test edebilirsiniz.

---

## 🎙️ Özellikler

- **Discord Hiyerarşisi:** Sunucular (Guilds) -> Kategoriler -> Metin & Ses/Görüntü Odaları.
- **WhatsApp Tarzı Mesajlaşma:**
  - Yeşil/gri balon tasarımı, çift tikli iletim durumu.
  - Alıntılama, yanıtlama (reply-to) ve anlık reaksiyonlar.
  - "Yazıyor..." (typing indicator) ve anlık WebSocket mesaj dağıtımı.
- **Ses ve Görüntü Odaları (WebRTC SFU):**
  - Tek tıkla odaya katılma.
  - Konuşan kişi etrafında parlayan yeşil aura (speaking visualizer).
  - Alt barda sabit kalan hızlı ses çubuğu (Mute, Kulaklık susturma, Ayrıl).
  - Tam ekran sahne (Stage Grid) video ve kamera paylaşımı modu.
- **Tek Tıkla Demo Profilleri:** Giriş ekranında tek dokunuşla farklı kullanıcılar (Ahmet, Ayşe, Mehmet) arasında geçiş yaparak çift yönlü anlık sohbeti test etme imkanı.
