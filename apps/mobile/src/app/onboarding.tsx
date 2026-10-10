import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { chronoTheme } from '../theme/colors';
import { useChatStore } from '../store/useChatStore';

const { colors, radius } = chronoTheme;

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  boldWord: string;
}

const SLIDES: Slide[] = [
  {
    id: 0,
    title: 'Chrono',
    subtitle: "Dünyanın en hızlı mesajlaşma uygulaması.\nÜcretsiz ve güvenli.",
    boldWord: 'hızlı',
  },
  {
    id: 1,
    title: 'Hızlı',
    subtitle: 'Chrono mesajları ışık hızında iletir,\nkesintisiz iletişim sağlar.',
    boldWord: 'ışık hızında',
  },
  {
    id: 2,
    title: 'Ücretsiz',
    subtitle: 'Chrono sonsuza kadar ücretsizdir.\nReklam yok, abonelik ücreti yok.',
    boldWord: 'ücretsizdir',
  },
  {
    id: 3,
    title: 'Güçlü',
    subtitle: 'Medya ve sohbetlerinizin boyutunda\nhiçbir sınır yoktur.',
    boldWord: 'sınır yoktur',
  },
  {
    id: 4,
    title: 'Güvenli',
    subtitle: 'Mesajlarınız hacker saldırılarına karşı\ngüçlü şifrelemeyle korunur.',
    boldWord: 'şifrelemeyle korunur',
  },
  {
    id: 5,
    title: 'Bulut Tabanlı',
    subtitle: 'Mesajlarınıza tüm cihazlarınızdan\naynı anda erişin.',
    boldWord: 'tüm cihazlarınızdan',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { currentUser } = useChatStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Zaten giriş yapılmışsa ana sekmelere yönlendir
  React.useEffect(() => {
    if (currentUser) {
      router.replace('/(tabs)');
    }
  }, [currentUser]);

  const handleNextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setCurrentSlide(0);
    }
  };

  const activeSlide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Üst Sağ Gece Modu İkonu (Screenshot 1) */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.moonButton} activeOpacity={0.7}>
          <Ionicons name="moon" size={24} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      {/* Orta Alan: Büyük Logo, Başlık, Açıklama, Noktalar (Screenshot 1) */}
      <TouchableOpacity
        style={styles.centerContent}
        onPress={handleNextSlide}
        activeOpacity={0.9}
      >
        {/* Chrono Uygulama Logosu */}
        <View style={styles.logoCircle}>
          <Image
            source={require('../../assets/app-icon-rounded.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Başlık & Açıklama */}
        <Text style={styles.appTitle}>{activeSlide.title}</Text>
        <Text style={styles.subtitleText}>{activeSlide.subtitle}</Text>

        {/* 6 Noktalı Gösterge (Screenshot 1) */}
        <View style={styles.paginationDots}>
          {SLIDES.map((slide) => {
            const isActive = slide.id === currentSlide;
            return (
              <View
                key={slide.id}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>
      </TouchableOpacity>

      {/* Alt Kısım: "Start Messaging" / "Sohbete Başla" Büyük Hap Buton */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => router.push('/auth')}
          activeOpacity={0.8}
        >
          <Text style={styles.startBtnText}>Start Messaging</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1621', // Telegram Night Dark
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  moonButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flex: 1,
  },
  logoCircle: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 130,
    height: 130,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    borderRadius: 4,
  },
  dotActive: {
    width: 8,
    height: 8,
    backgroundColor: '#2AABEE',
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomSection: {
    paddingBottom: 28,
    alignItems: 'center',
  },
  startBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2AABEE', // Telegram pill button color
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2AABEE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
