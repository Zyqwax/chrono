import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useChatStore } from '../store/useChatStore';
import { chronoTheme } from '../theme/colors';

const { colors, radius } = chronoTheme;

type AuthStage =
  | 'CHECK_USERNAME'
  | 'ENTER_PASSWORD'
  | 'USER_NOT_FOUND'
  | 'REGISTER_NAME'
  | 'REGISTER_EMAIL'
  | 'REGISTER_PASSWORD';

interface FoundUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export const AuthScreen: React.FC = () => {
  const { setAuth } = useChatStore();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [stage, setStage] = useState<AuthStage>('CHECK_USERNAME');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanUsername = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9_]/g, '');
  };

  // 1. STEP: Check if user exists
  const handleCheckUsername = async () => {
    setError(null);
    const clean = username.trim().toLowerCase();

    if (!clean) {
      setError('Lütfen bir kullanıcı adı girin');
      return;
    }
    if (clean.length < 3 || clean.length > 20) {
      setError('Kullanıcı adı 3 ile 20 karakter arasında olmalıdır');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/check-user', { identifier: clean });

      if (res.data?.exists && res.data?.user) {
        setFoundUser(res.data.user);
        setPassword('');
        setStage('ENTER_PASSWORD');
      } else {
        setStage('USER_NOT_FOUND');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Sunucuya ulaşılamadı. Lütfen bağlantınızı kontrol edin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. STEP: Login with password
  const handleLogin = async () => {
    setError(null);
    if (!password) {
      setError('Lütfen şifrenizi girin');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', {
        identifier: username.trim(),
        password,
      });
      setAuth(res.data.user, res.data.accessToken);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Şifre hatalı. Lütfen tekrar deneyin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. STEP: Register step validation & progression
  const handleNextRegisterStep = () => {
    setError(null);

    if (stage === 'REGISTER_NAME') {
      if (!displayName.trim()) {
        setError('Lütfen görünen adınızı girin');
        return;
      }
      setStage('REGISTER_EMAIL');
    } else if (stage === 'REGISTER_EMAIL') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Geçerli bir e-posta adresi girin');
        return;
      }
      setStage('REGISTER_PASSWORD');
    }
  };

  // 4. STEP: Finalize registration
  const handleFinalRegister = async () => {
    setError(null);
    if (!password || password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      setAuth(res.data.user, res.data.accessToken);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.message)
          ? err.response?.data?.message[0]
          : null) ||
        'Kayıt işlemi başarısız oldu. Lütfen bilgileri kontrol edin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToStart = () => {
    setError(null);
    setPassword('');
    setStage('CHECK_USERNAME');
  };

  const isRegistering =
    stage === 'REGISTER_NAME' ||
    stage === 'REGISTER_EMAIL' ||
    stage === 'REGISTER_PASSWORD';

  const getRegisterStepIndex = () => {
    if (stage === 'REGISTER_NAME') return 1;
    if (stage === 'REGISTER_EMAIL') return 2;
    if (stage === 'REGISTER_PASSWORD') return 3;
    return 1;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            isKeyboardVisible && styles.scrollContentWithKeyboard,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.innerWrapper}>
              {/* Header Brand */}
              <View style={[styles.header, isKeyboardVisible && styles.headerCompact]}>
                <Image
                  source={require('../../assets/splash-icon.png')}
                  style={[styles.logoImage, isKeyboardVisible && styles.logoImageCompact]}
                  resizeMode="contain"
                />
                <Text style={[styles.title, isKeyboardVisible && styles.titleCompact]}>Chrono</Text>
                {!isKeyboardVisible && (
                  <Text style={styles.subtitle}>
                    Yeni nesil oda tabanlı mesajlaşma & ses
                  </Text>
                )}
              </View>

            {/* Error Banner */}
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#ea4335" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* -------------------------------------------------------- */}
            {/* STAGE 1: Check Username (Google Login Style - First step) */}
            {/* -------------------------------------------------------- */}
            {stage === 'CHECK_USERNAME' && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.stepTitle}>Giriş Yap veya Başla</Text>
                  <Text style={styles.stepDesc}>
                    Devam etmek için kullanıcı adınızı yazın.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kullanıcı Adı</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.atPrefix}>@</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="kullanici_adi"
                      placeholderTextColor="#8696a0"
                      value={username}
                      onChangeText={(t) => {
                        setError(null);
                        setUsername(cleanUsername(t));
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={handleCheckUsername}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Örn: enes, ahmet_12, developer
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleCheckUsername}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>İleri</Text>
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* -------------------------------------------------------- */}
            {/* STAGE 2: Password (User Exists!)                         */}
            {/* -------------------------------------------------------- */}
            {stage === 'ENTER_PASSWORD' && (
              <View style={styles.card}>
                {/* Found User Account Pill */}
                <View style={styles.userFoundBanner}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>
                      {foundUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userFoundName}>
                      {foundUser?.displayName}
                    </Text>
                    <Text style={styles.userFoundUsername}>
                      @{foundUser?.username}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeUserBtn}
                    onPress={handleResetToStart}
                  >
                    <Text style={styles.changeUserText}>Değiştir</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardHeader}>
                  <Text style={styles.stepTitle}>Hoş Geldiniz</Text>
                  <Text style={styles.stepDesc}>
                    Hesabınıza giriş yapmak için şifrenizi girin.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Şifre</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#8696a0"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#8696a0"
                      value={password}
                      onChangeText={(p) => {
                        setError(null);
                        setPassword(p);
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#8696a0"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={handleResetToStart}
                    disabled={loading}
                  >
                    <Ionicons name="arrow-back" size={16} color="#8696a0" />
                    <Text style={styles.secondaryBtnText}>Geri</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      { flex: 1 },
                      loading && styles.btnDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Giriş Yap</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* -------------------------------------------------------- */}
            {/* STAGE 3: User Not Found Notice                           */}
            {/* -------------------------------------------------------- */}
            {stage === 'USER_NOT_FOUND' && (
              <View style={styles.card}>
                <View style={styles.notFoundIconCircle}>
                  <Ionicons name="person-remove-outline" size={32} color="#f59e0b" />
                </View>

                <View style={styles.cardHeader}>
                  <Text style={styles.stepTitle}>Kullanıcı Bulunamadı</Text>
                  <Text style={styles.stepDesc}>
                    <Text style={{ color: colors.primaryLight, fontWeight: '700' }}>
                      @{username}
                    </Text>{' '}
                    kullanıcı adına ait bir hesap bulunamadı.
                  </Text>
                </View>

                <View style={styles.notFoundInfoBox}>
                  <Ionicons name="information-circle-outline" size={20} color="#8696a0" />
                  <Text style={styles.notFoundInfoText}>
                    Bu kullanıcı adıyla hemen yeni bir Chrono hesabı
                    oluşturabilirsiniz.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    setError(null);
                    setStage('REGISTER_NAME');
                  }}
                >
                  <Text style={styles.primaryBtnText}>Hesap Oluştur</Text>
                  <Ionicons name="sparkles" size={16} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.textActionBtn}
                  onPress={handleResetToStart}
                >
                  <Text style={styles.textActionBtnText}>
                    Farklı bir kullanıcı adı dene
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* -------------------------------------------------------- */}
            {/* STAGE 4: Google Form Style Multi-Step Registration       */}
            {/* -------------------------------------------------------- */}
            {isRegistering && (
              <View style={styles.card}>
                {/* Stepper Progress Bar */}
                <View style={styles.stepperHeader}>
                  <View style={styles.stepperBadge}>
                    <Text style={styles.stepperBadgeText}>
                      Adım {getRegisterStepIndex()} / 3
                    </Text>
                  </View>
                  <View style={styles.stepperProgressTrack}>
                    <View
                      style={[
                        styles.stepperProgressBar,
                        { width: `${(getRegisterStepIndex() / 3) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.stepperUsername}>@{username}</Text>
                </View>

                {/* Sub-step 1: Display Name */}
                {stage === 'REGISTER_NAME' && (
                  <View style={{ gap: 16 }}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.stepTitle}>Sizi Nasıl Çağıralım?</Text>
                      <Text style={styles.stepDesc}>
                        Sohbet odalarında diğer kullanıcıların göreceği görünen
                        adınızı girin.
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Görünen Ad</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color="#8696a0"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Örn: Enes Samed"
                          placeholderTextColor="#8696a0"
                          value={displayName}
                          onChangeText={(t) => {
                            setError(null);
                            setDisplayName(t);
                          }}
                          autoFocus
                          autoCapitalize="words"
                          returnKeyType="next"
                          onSubmitEditing={handleNextRegisterStep}
                        />
                      </View>
                    </View>

                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={handleResetToStart}
                      >
                        <Text style={styles.secondaryBtnText}>Vazgeç</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.primaryBtn, { flex: 1 }]}
                        onPress={handleNextRegisterStep}
                      >
                        <Text style={styles.primaryBtnText}>İleri</Text>
                        <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Sub-step 2: Email */}
                {stage === 'REGISTER_EMAIL' && (
                  <View style={{ gap: 16 }}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.stepTitle}>E-posta Adresiniz</Text>
                      <Text style={styles.stepDesc}>
                        Hesap güvenliği ve kurtarma için geçerli bir e-posta
                        adresi girin.
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>E-posta</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="mail-outline"
                          size={20}
                          color="#8696a0"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="ornek@email.com"
                          placeholderTextColor="#8696a0"
                          value={email}
                          onChangeText={(t) => {
                            setError(null);
                            setEmail(t);
                          }}
                          autoFocus
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={handleNextRegisterStep}
                        />
                      </View>
                    </View>

                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => setStage('REGISTER_NAME')}
                      >
                        <Ionicons name="arrow-back" size={16} color="#8696a0" />
                        <Text style={styles.secondaryBtnText}>Geri</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.primaryBtn, { flex: 1 }]}
                        onPress={handleNextRegisterStep}
                      >
                        <Text style={styles.primaryBtnText}>İleri</Text>
                        <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Sub-step 3: Password */}
                {stage === 'REGISTER_PASSWORD' && (
                  <View style={{ gap: 16 }}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.stepTitle}>Bir Şifre Belirleyin</Text>
                      <Text style={styles.stepDesc}>
                        Hesabınızı korumak için en az 6 karakterlik bir şifre
                        oluşturun.
                      </Text>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Şifre</Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color="#8696a0"
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor="#8696a0"
                          value={password}
                          onChangeText={(t) => {
                            setError(null);
                            setPassword(t);
                          }}
                          secureTextEntry={!showPassword}
                          autoFocus
                          autoCapitalize="none"
                          returnKeyType="done"
                          onSubmitEditing={handleFinalRegister}
                        />
                        <TouchableOpacity
                          style={styles.eyeBtn}
                          onPress={() => setShowPassword(!showPassword)}
                        >
                          <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#8696a0"
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.helperText}>En az 6 karakter</Text>
                    </View>

                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => setStage('REGISTER_EMAIL')}
                        disabled={loading}
                      >
                        <Ionicons name="arrow-back" size={16} color="#8696a0" />
                        <Text style={styles.secondaryBtnText}>Geri</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.primaryBtn,
                          { flex: 1 },
                          loading && styles.btnDisabled,
                        ]}
                        onPress={handleFinalRegister}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <>
                            <Text style={styles.primaryBtnText}>
                              Hesabı Oluştur ve Başla
                            </Text>
                            <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Chrono Dark #0B0F1A
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  scrollContentWithKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 12,
    paddingBottom: 48,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerCompact: {
    marginBottom: 14,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  logoImageCompact: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  titleCompact: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceElevated, // #1A243B
    borderRadius: radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    gap: 4,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  stepDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginRight: 8,
  },
  atPrefix: {
    color: colors.primaryLight,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: colors.primary, // #2563EB
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  secondaryBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  // User Found Header Banner
  userFoundBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  userFoundName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  userFoundUsername: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  changeUserBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  changeUserText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  // User Not Found styles
  notFoundIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  notFoundInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.md,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notFoundInfoText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  textActionBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  textActionBtnText: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Stepper styles
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepperBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  stepperBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  stepperProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.inputBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  stepperProgressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stepperUsername: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
