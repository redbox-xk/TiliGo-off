import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

const STATUS_STEPS = [
  { key: 'pending', label: 'Porosia u pranua', icon: 'checkmark-circle-outline', desc: 'Porosia juaj është dërguar te dyqani' },
  { key: 'accepted', label: 'E konfirmuar', icon: 'thumbs-up-outline', desc: 'Dyqani konfirmoi porosinë' },
  { key: 'preparing', label: 'Duke u përgatitur', icon: 'restaurant-outline', desc: 'Ushqimi juaj po përgatitet' },
  { key: 'picked_up', label: 'U mor nga dërgësi', icon: 'bicycle-outline', desc: 'Dërgësi është në rrugë' },
  { key: 'delivered', label: 'U dorëzua', icon: 'home-outline', desc: 'Gëzohuni me ushqimin!' },
];

async function fetchOrder(id: string) {
  const res = await fetch(`https://${BASE_URL}/api/orders/${id}`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id!),
    refetchInterval: 15000,
    enabled: !!id,
  });

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order?.status) ?? 0;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) return null;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/')} style={styles.backBtn}>
          <Ionicons name="home" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Gjurmimi i Porosisë</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.orderCard}>
          <Text style={styles.orderNum}>Porosi #{String(order.id).padStart(5, '0')}</Text>
          <Text style={styles.shopName}>{order.shopName}</Text>
          <Text style={styles.orderTime}>
            {new Date(order.createdAt).toLocaleString('sq-AL', {
              hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short',
            })}
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          {STATUS_STEPS.map((step, index) => {
            const completed = index <= currentStepIndex;
            const isActive = index === currentStepIndex;
            const isCancelled = order.status === 'cancelled';
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[
                    styles.stepCircle,
                    completed && !isCancelled && styles.stepCircleCompleted,
                    isActive && !isCancelled && styles.stepCircleActive,
                    isCancelled && styles.stepCircleCancelled,
                  ]}>
                    <Ionicons
                      name={isCancelled ? 'close' : completed ? 'checkmark' : (step.icon as keyof typeof Ionicons.glyphMap)}
                      size={16}
                      color={completed ? '#fff' : Colors.textTertiary}
                    />
                  </View>
                  {index < STATUS_STEPS.length - 1 && (
                    <View style={[styles.stepLine, completed && index < currentStepIndex && styles.stepLineCompleted]} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLabel, completed && !isCancelled && styles.stepLabelActive]}>{step.label}</Text>
                  {isActive && !isCancelled && (
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  )}
                </View>
              </View>
            );
          })}
          {order.status === 'cancelled' && (
            <View style={styles.cancelledBanner}>
              <Ionicons name="close-circle" size={20} color={Colors.error} />
              <Text style={styles.cancelledText}>Porosia u anulua</Text>
            </View>
          )}
        </View>

        {order.deliveryPersonName && (
          <View style={styles.deliveryPersonCard}>
            <View style={styles.deliveryAvatar}>
              <Ionicons name="person" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryLabel}>Dërgësi juaj</Text>
              <Text style={styles.deliveryName}>{order.deliveryPersonName}</Text>
            </View>
            <Ionicons name="bicycle" size={22} color={Colors.primary} />
          </View>
        )}

        {order.estimatedDeliveryTime && (
          <View style={styles.etaCard}>
            <Ionicons name="time-outline" size={20} color={Colors.secondary} />
            <Text style={styles.etaText}>Koha e pritjes: <Text style={styles.etaValue}>{order.estimatedDeliveryTime}</Text></Text>
          </View>
        )}

        <View style={styles.orderDetails}>
          <Text style={styles.detailsTitle}>Detajet e porosisë</Text>
          {order.items?.map((item: Record<string, unknown>, i: number) => (
            <View key={i} style={styles.detailItem}>
              <Text style={styles.detailQty}>{String(item.quantity)}x</Text>
              <Text style={styles.detailName}>{String(item.productName)}</Text>
              <Text style={styles.detailPrice}>€{(Number(item.price) * Number(item.quantity)).toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <Text style={styles.detailTotal}>Totali</Text>
            <Text style={styles.detailTotalValue}>
              €{(Number(order.totalAmount) + Number(order.deliveryFee ?? 1.5)).toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.addressCard}>
          <Ionicons name="location" size={18} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>Adresa e dorëzimit</Text>
            <Text style={styles.addressValue}>{order.customerAddress}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { padding: 4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.text },
  content: { paddingHorizontal: 20, gap: 16 },
  orderCard: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  orderNum: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#fff' },
  shopName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  orderTime: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  stepsContainer: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, gap: 0 },
  stepRow: { flexDirection: 'row', gap: 14 },
  stepLeft: { alignItems: 'center', width: 36 },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  stepCircleCompleted: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepCircleActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepCircleCancelled: { backgroundColor: Colors.error, borderColor: Colors.error },
  stepLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  stepLineCompleted: { backgroundColor: Colors.success },
  stepContent: { flex: 1, paddingVertical: 8, paddingBottom: 20 },
  stepLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.textTertiary },
  stepLabelActive: { fontFamily: 'Inter_600SemiBold', color: Colors.text },
  stepDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  cancelledBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.error + '15', borderRadius: 10, padding: 12, marginTop: 8 },
  cancelledText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.error },
  deliveryPersonCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  deliveryAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center',
  },
  deliveryLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  deliveryName: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.text },
  etaCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.secondary + '15', borderRadius: 12, padding: 14 },
  etaText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text },
  etaValue: { fontFamily: 'Inter_600SemiBold', color: Colors.secondary },
  orderDetails: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 10 },
  detailsTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text, marginBottom: 4 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailQty: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.primary, width: 28 },
  detailName: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text, flex: 1 },
  detailPrice: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.text },
  detailDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  detailTotal: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.text, flex: 1 },
  detailTotalValue: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.primary },
  addressCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 14 },
  addressLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  addressValue: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text, marginTop: 2 },
});
