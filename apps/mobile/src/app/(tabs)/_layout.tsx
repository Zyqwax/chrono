import React from 'react';
import { Tabs } from 'expo-router';
import { ChronoTabBar } from '../../components/ChronoTabBar';
import { chronoTheme } from '../../theme/colors';

const { colors } = chronoTheme;

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ChronoTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
        },
        animation: "shift",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sohbetler',
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Kişiler',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
        }}
      />
    </Tabs>
  );
}
