import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, Alert, Platform, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import Logo from '@/components/Logo';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.info, accepted: Colors.warning, preparing: Colors.secondary,
  ready: Colors.primary, delivering: Colors.blue, delivered: Colors.success, cancelled: Colors.error,
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pritje', accepted: 'Pranuar', preparing: 'Përgatitje',
  ready: 'Gati', delivering: 'Dërgim', delivered: 'Dorëzuar', cancelled: 'Anuluar',
};
const NEXT_STATUS: Record<string, string> = {
  pending: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'delivering', delivering: 'delivered',
};
const NEXT_LABELS: Record<string, string> = {
  pending: 'Prano', accepted: 'Fillo përgatitjen', preparing: 'Gati për dërgim', ready: 'Dërgo', delivering: 'Konfirmo dorëzimin',
};

async function fetchShopOrders(shopId: string) {
  const res = await fetch(`https://${BASE_URL}/api/orders?shopId=${shopId}`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}
async function fetchProducts(shopId: string) {
  const res = await fetch(`https://${BASE_URL}/api/shops/${shopId}/products`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

export default function ShopDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, login } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'orders' | 'menu' | 'stats'>('orders');
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(user?.shopData?.isOpen ?? true);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: orders = [], isLoading: ordLoading } = useQuery({
    queryKey: ['shopOrders', user?.id],
    queryFn: () => fetchShopOrders(user!.id),
    enabled: !!user?.id,
    refetchInterval: 15000,
  });
  const { data: products = [], isLoading: prodLoading } = useQuery({
    queryKey: ['products', user?.id],
    queryFn: () => fetchProducts(user!.id),
    enabled: !!user?.id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['shopOrders', user?.id] });
    setRefreshing(false);
  }, [qc, user?.id]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`https://${BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) qc.invalidateQueries({ queryKey: ['shopOrders', user?.id] });
    } catch { Alert.alert('Gabim', 'Ndryshimi dështoi'); }
  };

  const toggleOpen = async () => {
    const newVal = !isOpen;
    setIsOpen(newVal);
    try {
      await fetch(`https://${BASE_URL}/api/shops/${user?.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newVal }),
      });
    } catch {}
  };

  const deleteProduct = async (pid: string) => {
    Alert.alert('Fshi produktin', 'Jeni i sigurt?', [
      { text: 'Anulo', style: 'cancel' },
      { text: 'Fshi', style: 'destructive', onPress: async () => {
        try {
          await fetch(`https://${BASE_URL}/api/products/${pid}`, { method: 'DELETE' });
          qc.invalidateQueries({ queryKey: ['products', user?.id] });
        } catch {}
      }},
    ]);
  };

  if (!user) { router.replace('/'); return null; }

  const pending = orders.filter((o: Record<string, unknown>) => o.status === 'pending').length;
  const todayRev = orders.filter((o: Record<string, unknown>) => o.status === 'delivered').reduce((s: number, o: Record<string, unknown>) => s + Number(o.totalAmount ?? 0), 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{user.name}</Text>
          <Text style={styles.headerSub}>Paneli i dyqanit</Text>
        </View>
        <View style={styles.openToggle}>
          <Text style={styles.openLabel}>{isOpen ? 'Hapur' : 'Mbyllur'}</Text>
          <Switch value={isOpen} onValueChange={toggleOpen} trackColor={{ true: '#fff', false: 'rgba(255,255,255,0.4)' }} thumbColor={isOpen ? Colors.secondary : '#ccc'} />
        </View>
        <Logo size="xs" style={{ opacity: 0.9 }} />
      </View>

      {/* Stats row */}
      <LinearGradient colors={[Colors.secondary, '#FF8C42']} style={styles.statsRow} start={{x:0,y:0}} end={{x:1,y:0}}>
        <StatCard label="Porosi sot" value={String(orders.length)} icon="receipt-outline" />
        <View style={styles.statDiv} />
        <StatCard label="Në pritje" value={String(pending)} icon="time-outline" warn={pending > 0} />
        <View style={styles.statDiv} />
        <StatCard label="Të ardhura" value={`€${todayRev.toFixed(0)}`} icon="cash-outline" />
        <View style={styles.statDiv} />
        <StatCard label="Produkte" value={String(products.length)} icon="grid-outline" />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['orders', 'menu', 'stats'] as const).map(t => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
              {t === 'orders' ? `Porosi${pending > 0 ? ` (${pending})` : ''}` : t === 'menu' ? 'Menuja' : 'Statistika'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondary} />}
      >
        {tab === 'orders' && (
          ordLoading ? <ActivityIndicator color={Colors.secondary} style={{ marginTop: 40 }} /> :
          orders.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={52} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Nuk ka porosi ende</Text>
            </View>
          ) : (
            [...orders].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
              const priority: Record<string, number> = { pending: 0, accepted: 1, preparing: 2, ready: 3, delivering: 4, delivered: 5, cancelled: 6 };
              return (priority[String(a.status)] ?? 9) - (priority[String(b.status)] ?? 9);
            }).map((order: Record<string, unknown>) => {
              const st = String(order.status ?? 'pending');
              const nextSt = NEXT_STATUS[st];
              return (
                <View key={String(order.id)} style={[styles.orderCard, st === 'pending' && styles.orderCardUrgent]}>
                  <View style={styles.orderHead}>
                    <View>
                      <Text style={styles.orderId}>Porosi #{String(order.id).padStart(4, '0')}</Text>
                      <Text style={styles.orderCustomer}>{String(order.customerName)} • {String(order.customerPhone)}</Text>
                      <Text style={styles.orderAddress} numberOfLines={1}>{String(order.customerAddress)}</Text>
                    </View>
                    <View>
                      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[st] + '20', borderColor: STATUS_COLORS[st] }]}>
                        <Text style={[styles.statusTxt, { color: STATUS_COLORS[st] }]}>{STATUS_LABELS[st] ?? st}</Text>
                      </View>
                      <Text style={styles.orderTotal}>€{Number(order.totalAmount ?? 0).toFixed(2)}</Text>
                    </View>
                  </View>
                  {Array.isArray(order.items) && order.items.length > 0 && (
                    <View style={styles.itemsList}>
                      {(order.items as Record<string, unknown>[]).map((item, i) => (
                        <Text key={i} style={styles.itemTxt}>• {Number(item.quantity)}× {String(item.productName)}</Text>
                      ))}
                    </View>
                  )}
                  {order.notes && <Text style={styles.orderNotes}>📝 {String(order.notes)}</Text>}
                  <View style={styles.orderActions}>
                    {nextSt && (
                      <Pressable
                        style={({ pressed }) => [styles.actionBtn, { backgroundColor: STATUS_COLORS[nextSt] }, pressed && { opacity: 0.85 }]}
                        onPress={() => updateStatus(String(order.id), nextSt)}
                      >
                        <Text style={styles.actionBtnTxt}>{NEXT_LABELS[st] ?? nextSt}</Text>
                      </Pressable>
                    )}
                    {st === 'pending' && (
                      <Pressable
                        style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.85 }]}
                        onPress={() => updateStatus(String(order.id), 'cancelled')}
                      >
                        <Ionicons name="close" size={14} color={Colors.error} />
                        <Text style={styles.cancelBtnTxt}>Anulo</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          )
        )}

        {tab === 'menu' && (
          <View style={styles.menuSection}>
            <Pressable style={styles.addProductBtn} onPress={() => router.push('/add-product')}>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <Text style={styles.addProductBtnTxt}>Shto produkt të ri</Text>
            </Pressable>
            {prodLoading ? <ActivityIndicator color={Colors.secondary} /> :
              products.map((p: Record<string, unknown>) => (
                <View key={String(p.id)} style={styles.productCard}>
                  <View style={styles.prodInfo}>
                    <Text style={styles.prodName}>{String(p.name)}</Text>
                    <Text style={styles.prodCat}>{String(p.category ?? '')}</Text>
                    <Text style={styles.prodPrice}>€{Number(p.price).toFixed(2)} bazë → €{(Number(p.price) * 1.2).toFixed(2)} dërgim</Text>
                  </View>
                  <View style={styles.prodActions}>
                    <View style={[styles.availBadge, { backgroundColor: p.isAvailable ? Colors.primaryGhost : '#FFF0F0' }]}>
                      <Text style={[styles.availTxt, { color: p.isAvailable ? Colors.primary : Colors.error }]}>
                        {p.isAvailable ? '✓ Disponueshëm' : '✗ Jo disponueshëm'}
                      </Text>
                    </View>
                    <Pressable onPress={() => deleteProduct(String(p.id))}>
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </Pressable>
                  </View>
                </View>
              ))
            }
          </View>
        )}

        {tab === 'stats' && (
          <View style={styles.statsSection}>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Performanca e sotme</Text>
              {[
                { label: 'Porosi totale', val: String(orders.length) },
                { label: 'Porosi të dorëzuara', val: String(orders.filter((o: Record<string, unknown>) => o.status === 'delivered').length) },
                { label: 'Porosi aktive', val: String(orders.filter((o: Record<string, unknown>) => !['delivered', 'cancelled'].includes(String(o.status))).length) },
                { label: 'Të ardhura totale', val: `€${todayRev.toFixed(2)}` },
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

function StatCard({ label, value, icon, warn }: { label: string; value: string; icon: string; warn?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon as any} size={15} color={warn ? '#FFD700' : 'rgba(255,255,255,0.8)'} />
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#fff' }}>{value}</Text>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.secondary, paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  openToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  openLabel: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#fff' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 18, gap: 4 },
  statDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.secondary },
  tabTxt: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  tabTxtActive: { fontFamily: 'Inter_700Bold', fontSize: 13, color: Colors.secondary },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: Colors.text },
  orderCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  orderCardUrgent: { borderColor: Colors.info, borderWidth: 2 },
  orderHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  orderId: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.text },
  orderCustomer: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  orderAddress: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-end' },
  statusTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  orderTotal: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text, textAlign: 'right', marginTop: 4 },
  itemsList: { backgroundColor: Colors.surfaceSecondary, borderRadius: 10, padding: 10, gap: 4 },
  itemTxt: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.text },
  orderNotes: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, fontStyle: 'italic' },
  orderActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionBtnTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.error },
  cancelBtnTxt: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.error },
  menuSection: { gap: 12 },
  addProductBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.secondary, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 20, shadowColor: Colors.secondary, shadowOffset: {width:0,height:3}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  addProductBtnTxt: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#fff', flex: 1 },
  productCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  prodInfo: { gap: 3, marginBottom: 10 },
  prodName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  prodCat: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  prodPrice: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.primary, marginTop: 2 },
  prodActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  availTxt: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  statsSection: { gap: 14 },
  statsCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: Colors.border },
  statsTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  statsRow2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  statsVal: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  statsDiv: { height: 1, backgroundColor: Colors.borderLight },
});
