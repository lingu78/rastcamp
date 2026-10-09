import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { TabIcon } from '@/components/TabIcon';
import { useTheme } from '@/theme/useTheme';

export default function TabLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabInactive,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.map'),
          headerShown: false,
          tabBarAccessibilityLabel: t('tabs.map'),
          tabBarIcon: ({ color }) => <TabIcon name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: t('tabs.nearby'),
          headerTitle: t('nearby.title'),
          tabBarAccessibilityLabel: t('tabs.nearby'),
          tabBarIcon: ({ color }) => <TabIcon name="nearby" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('tabs.favorites'),
          tabBarAccessibilityLabel: t('tabs.favorites'),
          tabBarIcon: ({ color }) => <TabIcon name="favorites" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('tabs.more'),
          tabBarAccessibilityLabel: t('tabs.more'),
          tabBarIcon: ({ color }) => <TabIcon name="more" color={color} />,
        }}
      />
    </Tabs>
  );
}
