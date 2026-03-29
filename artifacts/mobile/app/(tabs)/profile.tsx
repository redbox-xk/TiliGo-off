import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import Logo from '@/components/Logo';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Text style={styles.title}>Profili</Text>
        <View style={styles.guestWrap}>
          <LinearGradient colors={[Colors.primary, Colors.blue]} style={styles.guestCard} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Logo size="md" />
            <Text style={styles.guestTitle}>Mirë se vini në TiliGo!</Text>
            <Text style={styles.guestSub}>Hyrni si dyqan ose person dërgese për të menaxhuar porositë tuaja</Text>
          </LinearGradient>
          <Pressable style={styles.shopBtn} onPress={() => router.push('/(auth)/shop-login')}>
            <Ionicons name="storefront-outline" size={22} color="#fff" />
            <View>
              <Text style={styles.btnTitle}>Dyqani im</Text>
              <Text style={styles.btnSub}>Menaxho porosite dhe menunë</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
          <Pressable style={styles.deliveryBtn} onPress={() => router.push('/(auth)/delivery-login')}>
            <Ionicons name="bicycle-outline" size={22} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.btnTitle, { color: Colors.text }]}>Person Dërgese</Text>
              <Text style={styles.btnSub}>Prano dhe dorëzo porosi</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </Pressable>
          <Text style={styles.customerNote}>
            👤 Klientët nuk kanë nevojë për llogari — mund të porosisin direkt!
          </Text>
        </View>
      </View>
    );
  }

  const isShop = user.type === 'shop';

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Text style={styles.title}>Profili</Text>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {/* Avatar card */}
        <LinearGradient
          colors={isShop ? [Colors.secondary, '#FF8C42'] : [Colors.primary, Colors.blue]}
          style={styles.avatarCard}
          start={{x:0,y:0}} end={{x:1,y:1}}
        >
          <View style={styles.avatarCircle}>
            <Ionicons name={isShop ? 'storefront' : 'bicycle'} size={32} color={isShop ? Colors.secondary : Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.avatarName}>{user.name}</Text>
            <Text style={styles.avatarEmail}>{user.email}</Text>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeTxt}>{isShop ? '🏪 Dyqan' : '🚴 Dërgues'}</Text>
            </View>
          </View>
          <Logo size="xs" style={{ opacity: 0.9 }} />
        </LinearGradient>

        {/* Dashboard button */}
        <Pressable
          style={({ pressed }) => [styles.dashBtn, { backgroundColor: isShop ? Colors.secondary : Colors.primary }, pressed && { opacity: 0.88 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(isShop ? '/shop-dashboard' : '/delivery-dashboard');
          }}
        >
          <Ionicons name={isShop ? 'grid-outline' : 'speedometer-outline'} size={22} color="#fff" />
          <Text style={styles.dashBtnTxt}>{isShop ? 'Paneli i Dyqanit' : 'Paneli i Dërgimit'}</Text>
          <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.8)" />
        </Pressable>

        {/* Info */}
        <View style={styles.infoCard}>
          {[
            { icon: 'person-outline', label: 'Emri', value: user.name },
            { icon: 'mail-outline', label: 'Email', value: user.email },
            ...(user.phone ? [{ icon: 'call-outline', label: 'Telefon', value: user.phone }] : []),
          ].map((row, i, arr) => (
            <View key={row.label}>
              <View style={styles.infoRow}>
                <Ionicons name={row.icon as any} size={18} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoVal} numberOfLines={1}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.infoDiv} />}
            </View>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); logout(); }}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutTxt}>Dil nga llogaria</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, color: Colors.text, paddingHorizontal: 20, paddingBottom: 16 },
  guestWrap: { paddingHorizontal: 20, gap: 14 },
  guestCard: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 10, overflow: 'hidden' },
  guestTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#fff', textAlign: 'center' },
  guestSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  shopBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.secondary, borderRadius: 16, padding: 18, shadowColor: Colors.secondary, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  deliveryBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderRadius: 16, padding: 18, borderWidth: 2, borderColor: Colors.primary },
  btnTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
  btnSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  customerNote: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, textAlign: 'center', backgroundColor: Colors.surfaceSecondary, borderRadius: 12, padding: 14 },
  content: { paddingHorizontal: 20, gap: 14 },
  avatarCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarName: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#fff' },
  avatarEmail: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  avatarBadge: { marginTop: 6, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  avatarBadgeTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' },
  dashBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 18, shadowColor: Colors.primary, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  dashBtnTxt: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff', flex: 1 },
  infoCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, width: 60 },
  infoVal: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text, flex: 1, textAlign: 'right' },
  infoDiv: { height: 1, backgroundColor: Colors.border, marginLeft: 46 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFF0F0', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#FFD5D5' },
  logoutTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.error },
});
