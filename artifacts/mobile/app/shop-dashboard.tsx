import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, RefreshControl,
  ActivityIndicator, Alert, Switch, Platform,
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
  picked_up: 'U mor nga dërgësi',
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

async function fetchShopOrders(shopId: string) {
  const res = await fetch(`https://${BASE_URL}/api/orders?shopId=${shopId}`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

async function fetchShopProducts(shopId: string) {
  const res = await fetch(`https://${BASE_URL}/api/shops/${shopId}/products`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

async function updateOrder(orderId: string, status: string) {
  const res = await fetch(`https://${BASE_URL}/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

async function toggleProduct(shopId: string, productId: string, isAvailable: boolean) {
  const res = await fetch(`https://${BASE_URL}/api/shops/${shopId}/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isAvailable }),
  });
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

async function deleteProduct(shopId: string, productId: string) {
  const res = await fetch(`https://${BASE_URL}/api/shops/${shopId}/products/${productId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Gabim');
}

export default function ShopDashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [orderFilter, setOrderFilter] = useState<'active' | 'all'>('active');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['shopOrders', user?.id],
    queryFn: () => fetchShopOrders(user!.id),
    enabled: !!user?.id,
    refetchInterval: 20000,
  });

  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['shopProducts', user?.id],
    queryFn: () => fetchShopProducts(user!.id),
    enabled: !!user?.id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchOrders(), refetchProducts()]);
    setRefreshing(false);
  }, []);

  const activeOrders = orders.filter((o: Record<string, unknown>) =>
    ['pending', 'accepted', 'preparing'].includes(String(o.status))
  );
  const allOrders = orders;
  const displayedOrders = orderFilter === 'active' ? activeOrders : allOrders;

  const handleOrderAction = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrder(orderId, status);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await refetchOrders();
    } catch {
      Alert.alert('Gabim', 'Nuk mund të përditësohet statusi');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleProduct = async (product: Record<string, unknown>) => {
    try {
      await toggleProduct(user!.id, String(product.id), !product.isAvailable);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refetchProducts();
    } catch {
      Alert.alert('Gabim', 'Nuk mund të ndryshohet gjendja');
    }
  };

  const handleDeleteProduct = (product: Record<string, unknown>) => {
    Alert.alert(
      'Fshi produktin',
      `Jeni i sigurtë që dëshironi të fshini "${String(product.name)}"?`,
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Fshi',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(user!.id, String(product.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await refetchProducts();
            } catch {
              Alert.alert('Gabim', 'Nuk mund të fshihet produkti');
            }
          },
        },
      ]
    );
  };

  const todayRevenue = orders
    .filter((o: Record<string, unknown>) => {
      const created = new Date(String(o.createdAt));
      const today = new Date();
      return created.toDateString() === today.toDateString() && o.status !== 'cancelled';
    })
    .reduce((sum: number, o: Record<string, unknown>) => sum + Number(o.totalAmount), 0);

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.shopName}>{user?.name}</Text>
          <Text style={styles.headerSub}>Paneli i Dyqanit</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push('/add-product')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { flex: 1 }]}>
          <Text style={styles.statValue}>{activeOrders.length}</Text>
          <Text style={styles.statLabel}>Porosi aktive</Text>
        </View>
        <View style={[styles.statCard, { flex: 1, backgroundColor: Colors.success + '15' }]}>
          <Text style={[styles.statValue, { color: Colors.success }]}>€{todayRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Sot</Text>
        </View>
        <View style={[styles.statCard, { flex: 1, backgroundColor: Colors.info + '15' }]}>
          <Text style={[styles.statValue, { color: Colors.info }]}>{products.length}</Text>
          <Text style={styles.statLabel}>Produkte</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Porositë
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            Menuja
          </Text>
        </Pressable>
      </View>

      {activeTab === 'orders' && (
        <View style={styles.filterRow}>
          <Pressable
            style={[styles.filterChip, orderFilter === 'active' && styles.filterChipActive]}
            onPress={() => setOrderFilter('active')}
          >
            <Text style={[styles.filterText, orderFilter === 'active' && styles.filterTextActive]}>
              Aktive ({activeOrders.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, orderFilter === 'all' && styles.filterChipActive]}
            onPress={() => setOrderFilter('all')}
          >
            <Text style={[styles.filterText, orderFilter === 'all' && styles.filterTextActive]}>
              Të gjitha ({allOrders.length})
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {activeTab === 'orders' ? (
          ordersLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
          ) : displayedOrders.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={56} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Asnjë porosi</Text>
              <Text style={styles.emptySub}>Porositë e reja do të shfaqen këtu</Text>
            </View>
          ) : (
            displayedOrders.map((order: Record<string, unknown>) => {
              const status = String(order.status);
              return (
                <View key={String(order.id)} style={styles.orderCard}>
                  <View style={styles.orderTop}>
                    <View>
                      <Text style={styles.orderNum}>#{String(order.id).padStart(5, '0')}</Text>
                      <Text style={styles.orderCustomer}>{String(order.customerName)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[status] ?? Colors.textTertiary) + '20' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[status] ?? Colors.textTertiary }]}>
                        {STATUS_LABELS[status] ?? status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderInfoRow}>
                    <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.orderInfo}>{String(order.customerPhone)}</Text>
                    <Text style={styles.orderInfoDot}>·</Text>
                    <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.orderInfo} numberOfLines={1}>{String(order.customerAddress)}</Text>
                  </View>

                  <View style={styles.orderItems}>
                    {(order.items as Array<Record<string, unknown>>)?.map((item, i) => (
                      <Text key={i} style={styles.orderItemText}>
                        {String(item.quantity)}x {String(item.productName)} — €{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.orderFooter}>
                    <Text style={styles.orderTotal}>
                      Totali: €{(Number(order.totalAmount) + Number(order.deliveryFee ?? 1.5)).toFixed(2)}
                    </Text>
                    <View style={styles.orderActions}>
                      {status === 'pending' && (
                        <>
                          <Pressable
                            style={[styles.actionBtnSmall, { backgroundColor: Colors.error + '15' }]}
                            onPress={() => handleOrderAction(String(order.id), 'cancelled')}
                          >
                            <Ionicons name="close" size={16} color={Colors.error} />
                          </Pressable>
                          <Pressable
                            style={[styles.actionBtnSmall, { backgroundColor: Colors.success }]}
                            onPress={() => handleOrderAction(String(order.id), 'accepted')}
                          >
                            {updatingId === String(order.id) ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Ionicons name="checkmark" size={16} color="#fff" />
                            )}
                          </Pressable>
                        </>
                      )}
                      {status === 'accepted' && (
                        <Pressable
                          style={[styles.actionBtnSmall, { backgroundColor: Colors.secondary }]}
                          onPress={() => handleOrderAction(String(order.id), 'preparing')}
                        >
                          {updatingId === String(order.id) ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Ionicons name="restaurant" size={16} color="#fff" />
                          )}
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {order.notes ? (
                    <View style={styles.notesRow}>
                      <Ionicons name="chatbubble-ellipses-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.notesText}>{String(order.notes)}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })
          )
        ) : (
          productsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
          ) : (
            <>
              {products.length === 0 && (
                <View style={styles.empty}>
                  <Ionicons name="fast-food-outline" size={56} color={Colors.textTertiary} />
                  <Text style={styles.emptyTitle}>Asnjë produkt</Text>
                  <Text style={styles.emptySub}>Shtoni produktin tuaj të parë</Text>
                  <Pressable style={styles.addProductEmptyBtn} onPress={() => router.push('/add-product')}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addProductEmptyText}>Shto produkt</Text>
                  </Pressable>
                </View>
              )}
              {products.map((product: Record<string, unknown>) => (
                <View key={String(product.id)} style={styles.productCard}>
                  <View style={styles.productTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{String(product.name)}</Text>
                      {product.description ? (
                        <Text style={styles.productDesc} numberOfLines={1}>{String(product.description)}</Text>
                      ) : null}
                      {Array.isArray(product.suggestions) && product.suggestions.length > 0 && (
                        <Text style={styles.productSugg} numberOfLines={1}>
                          Sugjerimet: {(product.suggestions as string[]).join(', ')}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.productPrice}>€{Number(product.price).toFixed(2)}</Text>
                  </View>
                  <View style={styles.productFooter}>
                    <View style={styles.availableRow}>
                      <Text style={styles.availableLabel}>
                        {product.isAvailable ? 'I disponueshëm' : 'Jo disponueshëm'}
                      </Text>
                      <Switch
                        value={!!product.isAvailable}
                        onValueChange={() => handleToggleProduct(product)}
                        trackColor={{ false: Colors.border, true: Colors.success }}
                        thumbColor="#fff"
                      />
                    </View>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteProduct(product)}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </Pressable>
                  </View>
                  {product.category && (
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{String(product.category)}</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )
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
  shopName: { fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.text },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: {
    backgroundColor: Colors.primary + '15', borderRadius: 12,
    padding: 12, alignItems: 'center', gap: 4,
  },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.primary },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  tabText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  filterTextActive: { color: '#fff' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, gap: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: Colors.text },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  addProductEmptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.secondary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8,
  },
  addProductEmptyText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  orderCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNum: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  orderCustomer: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  orderInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  orderInfo: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, flex: 1 },
  orderInfoDot: { color: Colors.textTertiary, marginHorizontal: 2 },
  orderItems: { backgroundColor: Colors.surfaceSecondary, borderRadius: 8, padding: 10, gap: 4 },
  orderItemText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.text },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.primary },
  orderActions: { flexDirection: 'row', gap: 8 },
  actionBtnSmall: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  notesRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.info + '10', borderRadius: 8, padding: 8,
  },
  notesText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, flex: 1 },
  productCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  productTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  productName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  productDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  productSugg: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.primary, fontStyle: 'italic', marginTop: 2 },
  productPrice: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.primary },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availableRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  availableLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.error + '12' },
  categoryTag: { alignSelf: 'flex-start', backgroundColor: Colors.secondary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryTagText: { fontFamily: 'Inter_500Medium', fontSize: 11, color: Colors.secondary },
});
