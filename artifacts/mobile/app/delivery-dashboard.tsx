import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, RefreshControl,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Në pritje',
  accepted: 'E konfirmuar',
  preparing: 'Duke u përgatitur',
  picked_up: 'U mor',
  delivered: 'U dorëzua',
  cancelled: 'Anuluar',
};

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.warning,
  accepted: Colors.info,
  preparing: Colors.secondary,
  picked_up: Colors.primary,
  delivered: Colors.success,
  cancelled: Colors.error,
};

const NEXT_STATUS: Record<string, string> = {
  pending: 'accepted',
  accepted: 'picked_up',
  picked_up: 'delivered',
};

const NEXT_ACTION: Record<string, string> = {
  pending: 'Prano porosinë',
  accepted: 'Merre nga dyqani',
  picked_up: 'U dorëzua!',
};

async function fetchOrders() {
  const res = await fetch(`https://${BASE_URL}/api/orders?status=pending`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

async function fetchMyOrders(deliveryPersonId: string) {
  const res = await fetch(`https://${BASE_URL}/api/orders?deliveryPersonId=${deliveryPersonId}`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

async function updateOrderStatus(orderId: string, status: string, deliveryPersonId?: string, deliveryPersonName?: string) {
  const res = await fetch(`https://${BASE_URL}/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      ...(deliveryPersonId ? { deliveryPersonId } : {}),
      ...(deliveryPersonName ? { deliveryPersonName } : {}),
      estimatedDeliveryTime: '20-30 min',
    }),
  });
  if (!res.ok) throw new Error('Gabim në përditësim');
  return res.json();
}

export default function DeliveryDashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const { data: available = [], isLoading: loadingAvailable, refetch: refetchAvailable } = useQuery({
    queryKey: ['deliveryAvailable'],
    queryFn: fetchOrders,
    refetchInterval: 30000,
  });

  const { data: myOrders = [], isLoading: loadingMine, refetch: refetchMine } = useQuery({
    queryKey: ['myDeliveryOrders', user?.id],
    queryFn: () => fetchMyOrders(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAvailable(), refetchMine()]);
    setRefreshing(false);
  }, []);

  const handleAction = async (order: Record<string, unknown>, action: string) => {
    const orderId = String(order.id);
    const nextStatus = action === 'accept' ? 'accepted' : NEXT_STATUS[String(order.status)];
    
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(
        orderId,
        nextStatus,
        action === 'accept' ? user?.id : undefined,
        action === 'accept' ? user?.name : undefined,
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Promise.all([refetchAvailable(), refetchMine()]);
    } catch {
      Alert.alert('Gabim', 'Nuk mund të përditësohet statusi');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeOrders = myOrders.filter((o: Record<string, unknown>) =>
    ['accepted', 'preparing', 'picked_up'].includes(String(o.status))
  );
  const completedOrders = myOrders.filter((o: Record<string, unknown>) =>
    String(o.status) === 'delivered'
  );

  const currentTab = activeTab === 'available' ? available : myOrders;
  const isLoading = activeTab === 'available' ? loadingAvailable : loadingMine;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Mirë se erdhe!</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Aktive</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: Colors.success + '20' }]}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{completedOrders.length}</Text>
            <Text style={styles.statLabel}>Kryera</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'available' && styles.tabActive]}
          onPress={() => setActiveTab('available')}
        >
          <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
            Të disponueshme ({available.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
          onPress={() => setActiveTab('mine')}
        >
          <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>
            Porositë mia ({myOrders.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
        ) : currentTab.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bicycle-outline" size={56} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'available' ? 'Asnjë porosi e disponueshme' : 'Nuk keni porosi'}
            </Text>
            <Text style={styles.emptySub}>Tërhiqni për të rifreskuar</Text>
          </View>
        ) : (
          currentTab.map((order: Record<string, unknown>) => {
            const status = String(order.status);
            const canAct = activeTab === 'available' && status === 'pending';
            const hasNext = NEXT_STATUS[status] !== undefined && activeTab === 'mine';
            
            return (
              <View key={String(order.id)} style={styles.orderCard}>
                <View style={styles.orderTop}>
                  <View>
                    <Text style={styles.orderNum}>#{String(order.id).padStart(5, '0')}</Text>
                    <Text style={styles.orderShop}>{String(order.shopName)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[status] ?? Colors.textTertiary) + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[status] ?? Colors.textTertiary }]}>
                      {STATUS_LABELS[status] ?? status}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderInfoRow}>
                  <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.orderInfoText}>{String(order.customerName)} • {String(order.customerPhone)}</Text>
                </View>
                <View style={styles.orderInfoRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.orderInfoText} numberOfLines={1}>{String(order.customerAddress)}</Text>
                </View>

                <View style={styles.orderItems}>
                  {(order.items as Array<Record<string, unknown>>)?.slice(0, 2).map((item, i) => (
                    <Text key={i} style={styles.orderItem}>
                      {String(item.quantity)}x {String(item.productName)}
                    </Text>
                  ))}
                  {(order.items as Array<unknown>)?.length > 2 && (
                    <Text style={styles.orderItemMore}>+{(order.items as Array<unknown>).length - 2} tjera</Text>
                  )}
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>
                    €{(Number(order.totalAmount) + Number(order.deliveryFee ?? 1.5)).toFixed(2)}
                  </Text>
                  {(canAct || hasNext) && status !== 'delivered' && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        pressed && { opacity: 0.85 },
                        updatingId === String(order.id) && styles.actionBtnDisabled,
                      ]}
                      onPress={() => handleAction(order, canAct ? 'accept' : 'next')}
                      disabled={updatingId === String(order.id)}
                    >
                      {updatingId === String(order.id) ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.actionBtnText}>
                          {canAct ? 'Prano' : NEXT_ACTION[status] ?? 'Vazhdo'}
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>

                {order.notes ? (
                  <View style={styles.notesRow}>
                    <Ionicons name="chatbubble-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.notesText}>{String(order.notes)}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  name: { fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.text },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBadge: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, backgroundColor: Colors.primary + '15',
  },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.primary },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, color: Colors.textSecondary },
  tabs: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, gap: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: Colors.text },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  orderCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNum: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  orderShop: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  orderInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderInfoText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, flex: 1 },
  orderItems: { backgroundColor: Colors.surfaceSecondary, borderRadius: 8, padding: 10, gap: 4 },
  orderItem: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.text },
  orderItemMore: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  orderTotal: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.primary },
  actionBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 9,
    minWidth: 80, alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  notesRow: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: Colors.info + '10', borderRadius: 8, padding: 8 },
  notesText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, flex: 1 },
});
