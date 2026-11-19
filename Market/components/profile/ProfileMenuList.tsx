import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import MenuSectionCard, { MenuItemConfig } from './MenuSectionCard';

interface ProfileMenuListProps {
  isAdmin?: boolean;
}

export default function ProfileMenuList({ isAdmin = false }: ProfileMenuListProps) {
  const router = useRouter();

  const marketplaceItems: MenuItemConfig[] = [
    {
      id: 'my-ads',
      title: 'My Ads & Products',
      subtitle: 'Manage your listed items & availability',
      icon: 'bag-handle-outline',
      iconColor: '#059669',
      iconBg: '#ECFDF5',
      onPress: () => router.push('/(profile)/my-ads' as any),
    },
    {
      id: 'my-service',
      title: 'My Service Profile',
      subtitle: 'Update trade rates, portfolio & availability',
      icon: 'construct-outline',
      iconColor: '#7C3AED',
      iconBg: '#F5F3FF',
      onPress: () => router.push('/(profile)/my-service' as any),
    },
    {
      id: 'my-jobs',
      title: 'My Jobs & Applications',
      subtitle: 'Track job vacancies & submitted applications',
      icon: 'briefcase-outline',
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      onPress: () => router.push('/(profile)/my-jobs' as any),
    },
    {
      id: 'my-jobseeker',
      title: 'My Job Seeker Profile',
      subtitle: 'Edit CV, work experience & job visibility',
      icon: 'document-text-outline',
      iconColor: '#D97706',
      iconBg: '#FFFBEB',
      onPress: () => router.push('/(profile)/my-job-seeker' as any),
    },
    {
      id: 'wishlist',
      title: 'Saved & Wishlist',
      subtitle: 'View bookmarked products, services & jobs',
      icon: 'heart-outline',
      iconColor: '#DC2626',
      iconBg: '#FEF2F2',
      onPress: () => router.push('/(profile)/wishlist' as any),
    },
    {
      id: 'my-reports',
      title: 'My Reports',
      subtitle: 'Check moderation status of submitted reports',
      icon: 'flag-outline',
      iconColor: '#4B5563',
      iconBg: '#F3F4F6',
      onPress: () => router.push('/(profile)/my-reports' as any),
    },
  ];

  const adminItems: MenuItemConfig[] = isAdmin
    ? [
        {
          id: 'admin-console',
          title: 'Admin Console',
          subtitle: 'Moderate reports, feedback, listings & users',
          icon: 'shield-checkmark-outline',
          iconColor: '#2563EB',
          iconBg: '#EFF6FF',
          badgeText: 'Admin',
          onPress: () => router.push('/admin' as any),
        },
        {
          id: 'regional-stats',
          title: 'Regional & District Insights',
          subtitle: 'View marketplace metrics across Ghana',
          icon: 'bar-chart-outline',
          iconColor: '#059669',
          iconBg: '#ECFDF5',
          onPress: () => router.push('/admin/regional-stats' as any),
        },
      ]
    : [];

  const supportItems: MenuItemConfig[] = [
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Account details, password, privacy & security',
      icon: 'settings-outline',
      iconColor: '#374151',
      iconBg: '#F3F4F6',
      onPress: () => router.push('/(profile)/settings' as any),
    },
    {
      id: 'faq',
      title: 'FAQ & Help Center',
      subtitle: 'Answers about buying, selling, services & safety',
      icon: 'help-circle-outline',
      iconColor: '#2563EB',
      iconBg: '#EFF6FF',
      onPress: () => router.push('/(profile)/faq' as any),
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Rate the app, report a bug or suggest a feature',
      icon: 'chatbubble-ellipses-outline',
      iconColor: '#D97706',
      iconBg: '#FFFBEB',
      onPress: () => router.push('/(profile)/feedback' as any),
    },
  ];

  return (
    <View>
      <MenuSectionCard sectionTitle="My Marketplace" items={marketplaceItems} />
      {isAdmin && (
        <MenuSectionCard sectionTitle="Administration" items={adminItems} />
      )}
      <MenuSectionCard sectionTitle="Support & Preferences" items={supportItems} />
    </View>
  );
}
