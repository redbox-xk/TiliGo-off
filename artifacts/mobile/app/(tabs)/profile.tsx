import React from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <Text style={styles.title}>Profili</Text>
        <View style={styles.guestContainer}>
          <Ionicons name="person-circle-outline" size={80} color={Colors.textTertiary} />
          <Text style={styles.guestTitle}>Mirë se vini!</Text>
          <Text style={styles.guestSub}>Hyni si dyqan ose person dërgese</Text>
          <Pressable
            style={styles.shopLoginBtn}
            onPress={() => router.push('/(auth)/shop-login')}
          >
            <Ionicons name="storefront-outline" size={20} color="#fff" />
            <Text style={styles.loginBtnText}>Dyqani im</Text>
          </Pressable>
          <Pressable
            style={styles.deliveryLoginBtn}
            onPress={() => router.push('/(auth)/delivery-login')}
          >
            <Ionicons name="bicycle-outline" size={20} color={Colors.primary} />
            <Text style={styles.deliveryBtnText}>Dërgues</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isShop = user.type === 'shop';
  const isDelivery = user.type === 'delivery';

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <Text style={styles.title}>Profili</Text>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarCard}>
          <View style={[styles.avatar, { backgroundColor: isShop ? Colors.secondary : Colors.primary }]}>
            <Ionicons
              name={isShop ? 'storefront' : 'bicycle'}
              size={36}
              color="#fff"
            />
          </View>
          <View style={styles.avatarInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={[styles.typeBadge, { backgroundColor: isShop ? Colors.secondary + '22' : Colors.primary + '22' }]}>
              <Text style={[styles.typeLabel, { color: isShop ? Colors.secondary : Colors.primary }]}>
                {isShop ? 'Dyqan' : 'Person Dërgese'}
              </Text>
            </View>
          </View>
        </View>

        {isShop && (
          <Pressable
            style={({ pressed }) => [styles.dashboardBtn, pressed && { opacity: 0.88 }]}
            onPress={() => router.push('/shop-dashboard')}
          >
            <Ionicons name="grid-outline" size={22} color={Colors.secondary} />
            <Text style={[styles.dashboardBtnText, { color: Colors.secondary }]}>Paneli i Dyqanit</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.secondary} />
          </Pressable>
        )}

        {isDelivery && (
          <Pressable
            style={({ pressed }) => [styles.dashboardBtn, styles.dashboardBtnDelivery, pressed && { opacity: 0.88 }]}
            onPress={() => router.push('/delivery-dashboard')}
          >
            <Ionicons name="bicycle-outline" size={22} color={Colors.primary} />
            <Text style={[styles.dashboardBtnText, { color: Colors.primary }]}>Paneli i Dërgimit</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Llogaria</Text>
          <View style={styles.sectionCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Emri</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{user.email}</Text>
            </View>
            {user.phone && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={18} color={Colors.textSecondary} />
                  <Text style={styles.infoLabel}>Telefon</Text>
                  <Text style={styles.infoValue}>{user.phone}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Dil nga llogaria</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.text,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingBottom: 80,
  },
  guestTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: Colors.text,
  },
  guestSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  shopLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: 260,
    justifyContent: 'center',
  },
  deliveryLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    width: 260,
    justifyContent: 'center',
  },
  loginBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  deliveryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  avatarCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.text,
  },
  userEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },
  typeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.secondary + '15',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  dashboardBtnDelivery: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary + '30',
  },
  dashboardBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    flex: 1,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    width: 60,
  },
  infoValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 46,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.error + '12',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error + '25',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.error,
  },
});
