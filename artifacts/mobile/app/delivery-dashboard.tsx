import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, Alert, Platform, AppState,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import Logo from '@/components/Logo';
import * as Location from 'expo-location';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.info, accepted: Colors.warning, preparing: Colors.secondary,
  ready: Colors.primary, delivering: Colors.blue, delivered: Colors.success,
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pritje', accepted: 'Pranuar', preparing: 'Përgatitje',
  ready: 'Gati', delivering: 'Duke dërguar', delivered: 'Dorëzuar',
};

async function fetchAvailableOrders() {
  const res = await fetch(`https://${BASE_URL}/api/orders?status=ready`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}
async function fetchMyOrders(deliveryId: string) {
  const res = await fetch(`https://${BASE_URL}/api/orders?deliveryId=${deliveryId}`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

export default function DeliveryDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'available' | 'mine' | 'stats'>('available');
  const [refreshing, setRefreshing] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: available = [], isLoading: availLoad } = useQuery({
    queryKey: ['availableOrders'],
    queryFn: fetchAvailableOrders,
    refetchInterval: 20000,
    enabled: tab === 'available',
  });
  const { data: myOrders = [], isLoading: myLoad } = useQuery({
    queryKey: ['myOrders', user?.id],
    queryFn: () => fetchMyOrders(user!.id),
    enabled: !!user?.id && tab === 'mine',
    refetchInterval: 15000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['availableOrders'] });
    await qc.invalidateQueries({ queryKey: ['myOrders', user?.id] });
    setRefreshing(false);
  }, [qc, user?.id]);

  const startGPSTracking = useCallback(async (orderId: string) => {
    if (Platform.OS === 'web') { Alert.alert('GPS', 'GPS tracking disponueshëm vetëm në celular'); return; }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Leje refuzuar', 'Duhet lejen e vendndodhjes për GPS tracking'); return; }
    setTracking(true);
    setCurrentOrderId(orderId);
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 8000, distanceInterval: 20 },
      async (loc) => {
        try {
          await fetch(`https://${BASE_URL}/api/delivery/${user!.id}/location`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: loc.coords.latitude, lng: loc.coords.longitude, orderId }),
          });
        } catch {}
      }
    );
  }, [user]);

  const stopGPSTracking = useCallback(() => {
    locationSub.current?.remove();
    locationSub.current = null;
    setTracking(false);
    setCurrentOrderId(null);
  }, []);

  useEffect(() => {
    return () => { locationSub.current?.remove(); };
  }, []);

  const acceptOrder = async (orderId: string) => {
    try {
      const res = await fetch(`https://${BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivering', deliveryPersonId: user!.id }),
      });
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ['availableOrders'] });
        qc.invalidateQueries({ queryKey: ['myOrders', user?.id] });
        await startGPSTracking(orderId);
        Alert.alert('✅ Pranuar!', 'Ke pranuar porosinë. GPS tracking aktivizuar.');
        setTab('mine');
      }
    } catch { Alert.alert('Gabim', 'Pranimi dështoi'); }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`https://${BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (newStatus === 'delivered') stopGPSTracking();
      qc.invalidateQueries({ queryKey: ['myOrders', user?.id] });
    } catch { Alert.alert('Gabim', 'Ndryshimi dështoi'); }
  };

  if (!user) { router.replace('/'); return null; }

  const delivered = myOrders.filter((o: Record<string, unknown>) => o.status === 'delivered').length;
  const earnings = myOrders.filter((o: Record<string, unknown>) => o.status === 'delivered').reduce((s: number, o: Record<string, unknown>) => s + Number(o.totalAmount ?? 0) * 0.15, 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.blue]} style={styles.header} start={{x:0,y:0}} end={{x:1,y:0}}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{user.name}</Text>
          <Text style={styles.headerSub}>Dërgues TiliGo</Text>
        </View>
        {tracking && (
          <View style={styles.gpsActive}>
            <View style={styles.gpsDot} />
            <Text style={styles.gpsTxt}>GPS aktiv</Text>
          </View>
        )}
        <Logo size="xs" style={{ opacity: 0.9 }} />
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="bicycle-outline" value={String(myOrders.length)} label="Totali" color={Colors.primary} />
        <StatCard icon="checkmark-circle-outline" value={String(delivered)} label="Dorëzuar" color={Colors.success} />
        <StatCard icon="cash-outline" value={`€${earnings.toFixed(1)}`} label="Fitimи (15%)" color={Colors.secondary} />
        <StatCard icon="layers-outline" value={String(available.length)} label="Gati" color={Colors.blue} />
      </View>

      {/* GPS Tracking banner */}
      {tracking && (
        <Pressable style={styles.gpsBanner} onPress={stopGPSTracking}>
          <View style={styles.gpsAnimDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.gpsBannerTitle}>📡 GPS Tracking aktiv</Text>
            <Text style={styles.gpsBannerSub}>Porosi #{currentOrderId} • Shtypni për të ndalur</Text>
          </View>
          <Ionicons name="close-circle" size={22} color={Colors.error} />
        </Pressable>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['available', 'mine', 'stats'] as const).map(t => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
              {t === 'available' ? `Disponueshme${available.length > 0 ? ` (${available.length})` : ''}` : t === 'mine' ? 'Porositë e mia' : 'Statistika'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {tab === 'available' && (
          availLoad ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} /> :
          available.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="bicycle-outline" size={52} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Nuk ka porosi gati</Text>
              <Text style={styles.emptySub}>Provo rifreskon për të parë porosi të reja</Text>
            </View>
          ) : (
            available.map((order: Record<string, unknown>) => (
              <View key={String(order.id)} style={styles.orderCard}>
                <View style={styles.orderHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>Porosi #{String(order.id).padStart(4, '0')}</Text>
                    <Text style={styles.orderAddr} numberOfLines={1}>📍 {String(order.customerAddress)}</Text>
                  </View>
                  <Text style={styles.orderTotal}>€{Number(order.totalAmount ?? 0).toFixed(2)}</Text>
                </View>
                <View style={styles.orderEarn}>
                  <Ionicons name="cash-outline" size={14} color={Colors.success} />
                  <Text style={styles.orderEarnTxt}>Fitimi juaj: ~€{(Number(order.totalAmount ?? 0) * 0.15).toFixed(2)}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.88 }]}
                  onPress={() => acceptOrder(String(order.id))}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.acceptBtnTxt}>Prano dhe nisë</Text>
                </Pressable>
              </View>
            ))
          )
        )}

        {tab === 'mine' && (
          myLoad ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} /> :
          myOrders.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={52} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Nuk keni porosi akoma</Text>
            </View>
          ) : (
            myOrders.map((order: Record<string, unknown>) => {
              const st = String(order.status ?? 'delivering');
              return (
                <View key={String(order.id)} style={styles.myOrderCard}>
                  <View style={styles.myOrderHead}>
                    <Text style={styles.orderId}>#{String(order.id).padStart(4, '0')}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[st] ?? Colors.primary) + '20', borderColor: STATUS_COLORS[st] ?? Colors.primary }]}>
                      <Text style={[styles.statusTxt, { color: STATUS_COLORS[st] ?? Colors.primary }]}>{STATUS_LABELS[st] ?? st}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderAddr}>📍 {String(order.customerAddress)}</Text>
                  <Text style={styles.orderCustomer}>👤 {String(order.customerName)} • {String(order.customerPhone)}</Text>
                  <View style={styles.myOrderFooter}>
                    <Text style={styles.orderTotal}>€{Number(order.totalAmount ?? 0).toFixed(2)}</Text>
                    {st === 'delivering' && (
                      <Pressable
                        style={({ pressed }) => [styles.deliveredBtn, pressed && { opacity: 0.85 }]}
                        onPress={() => updateStatus(String(order.id), 'delivered')}
                      >
                        <Ionicons name="checkmark-done" size={15} color="#fff" />
                        <Text style={styles.deliveredBtnTxt}>Konfirmo dorëzimin</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )
        )}

        {tab === 'stats' && (
          <View style={styles.statsSection}>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Statistikat e sotme</Text>
              {[
                { label: 'Porosi të pranuara', val: String(myOrders.length) },
                { label: 'Dorëzime të suksesshme', val: String(delivered) },
                { label: 'Fitim (15% komision)', val: `€${earnings.toFixed(2)}` },
                { label: 'GPS Tracking', val: tracking ? '✅ Aktiv' : '○ Joaktiv' },
              ].map((r, i, arr) => (
                <View key={r.label}>
                  <View style={styles.statsRow2}>
                    <Text style={styles.statsLabel}>{r.label}</Text>
                    <Text style={styles.statsVal}>{r.val}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.statsDiv} />}
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconCircle, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  gpsActive: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CFF82' },
  gpsTxt: { fontFamily: 'Inter_500Medium', fontSize: 11, color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, color: Colors.textSecondary, textAlign: 'center' },
  gpsBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8FFF1', borderBottomWidth: 1, borderBottomColor: Colors.primary + '40', paddingHorizontal: 20, paddingVertical: 12 },
  gpsAnimDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  gpsBannerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.primary },
  gpsBannerSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabTxt: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.textSecondary },
  tabTxtActive: { fontFamily: 'Inter_700Bold', fontSize: 12, color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: Colors.text },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  orderCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10, borderWidth: 2, borderColor: Colors.primary + '40', shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  orderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.text },
  orderAddr: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  orderCustomer: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  orderTotal: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  orderEarn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryGhost, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  orderEarnTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.success },
  acceptBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: Colors.primary, shadowOffset: {width:0,height:3}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  acceptBtnTxt: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' },
  myOrderCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: Colors.border },
  myOrderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  myOrderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  deliveredBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  deliveredBtnTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' },
  statsSection: { gap: 14 },
  statsCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: Colors.border },
  statsTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  statsRow2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  statsVal: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.text },
  statsDiv: { height: 1, backgroundColor: Colors.borderLight },
});
