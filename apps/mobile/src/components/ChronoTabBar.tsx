import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { chronoTheme } from '../theme/colors';
import { useChatStore } from '../store/useChatStore';

const { colors } = chronoTheme;

interface TabConfig {
  name: string;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
  badge?: number | string;
  isProfile?: boolean;
}

export interface ChronoTabBarProps {
  state: {
    routes: Array<{ key: string; name: string }>;
    index: number;
  };
  descriptors: Record<string, any>;
  navigation: {
    emit: (event: any) => any;
    navigate: (name: string) => void;
  };
  insets?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const ChronoTabBar: React.FC<ChronoTabBarProps> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const currentUser = useChatStore((s) => s.currentUser);
  const rooms = useChatStore((s) => s.rooms);

  // Gerçek okunmamış mesaj sayısına göre rozet hesaplama
  const totalUnread = rooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0);
  const unreadBadge = totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined;

  const tabs: TabConfig[] = [
    {
      name: 'index',
      label: 'Sohbetler',
      iconActive: 'chatbubble-ellipses',
      iconInactive: 'chatbubble-ellipses-outline',
      badge: unreadBadge,
    },
    {
      name: 'contacts',
      label: 'Kişiler',
      iconActive: 'people',
      iconInactive: 'people-outline',
    },
    {
      name: 'settings',
      label: 'Ayarlar',
      iconActive: 'settings',
      iconInactive: 'settings-outline',
    },
    {
      name: 'profile',
      label: 'Profil',
      iconActive: 'person-circle',
      iconInactive: 'person-circle-outline',
      isProfile: true,
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, 12),
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = tabs.find((t) => t.name === route.name) || {
            name: route.name,
            label: route.name,
            iconActive: 'ellipse' as const,
            iconInactive: 'ellipse-outline' as const,
          };

          const onPress = () => {
            if (isFocused) {
              return;
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              {/* Sabit kavisli Chrono hap kapsülü (Asla köşeli hale gelmez) */}
              <View style={styles.iconCapsule}>
                {isFocused && <View style={styles.activePillBackground} />}

                {config.isProfile ? (
                  currentUser?.avatarUrl ? (
                    <Image
                      source={{ uri: currentUser.avatarUrl }}
                      style={[
                        styles.avatarThumb,
                        isFocused && styles.avatarThumbActive,
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarFallback,
                        isFocused && styles.avatarFallbackActive,
                      ]}
                    >
                      <Text style={styles.avatarFallbackText}>
                        {(currentUser?.displayName || currentUser?.username || 'U')
                          .slice(0, 1)
                          .toUpperCase()}
                      </Text>
                    </View>
                  )
                ) : (
                  <Ionicons
                    name={isFocused ? config.iconActive : config.iconInactive}
                    size={22}
                    color={isFocused ? colors.primaryLight : colors.textSecondary}
                  />
                )}

                {/* Okunmamış bildirim hap rozeti */}
                {config.badge && !isFocused && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{config.badge}</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    height: 64,
    backgroundColor: '#151E2B',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconCapsule: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activePillBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: '#1E3B5C', // Chrono aktif koyu mavi hap rengi
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: colors.textSecondary,
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: 4,
    backgroundColor: colors.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#151E2B',
    overflow: 'hidden',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  avatarThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarThumbActive: {
    borderColor: colors.primaryLight,
  },
  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceActive,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarFallbackActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryLight,
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
