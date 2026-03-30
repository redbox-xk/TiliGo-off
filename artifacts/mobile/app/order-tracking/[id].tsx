import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
  Platform, Animated, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import Logo from '@/components/Logo';
import TrackingMap from '@/components/TrackingMap';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

const STATUSES = [
  { key: 'pending', label: 'Porosia u dërgua', icon: 'checkmark-circle', color: Colors.info },
  { key: 'accepted', label: 'Pranuar nga dyqani', icon: 'storefront', color: Colors.warning },
  { key: 'preparing', label: 'Po përgatitet', icon: 'restaurant', color: Colors.secondary },
  { key: 'ready', label: 'Gati për dërgim', icon: 'bag-check', color: Colors.primary },
  { key: 'delivering', label: 'Po dërgohet', icon: 'bicycle', color: Colors.blue },
  { key: 'delivered', label: 'Dorëzuar!', icon: 'checkmark-done-circle', color: Colors.success },
];

function statusIndex(s: string) { return STATUSES.findIndex(st => st.key === s); }

async function fetchOrder(id: string) {
  const res = await fetch(`https://${BASE_URL}/api/orders/${id}`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

async function generateCouponPDF(order: Record<string, unknown>) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
  .c{background:linear-gradient(135deg,#00A651,#0066CC);color:#fff;border-radius:20px;padding:36px;max-width:400px;margin:0 auto}
  .logo{font-size:32px;font-weight:900;letter-spacing:3px;margin-bottom:4px}
  .tag{font-size:12px;opacity:.8;margin-bottom:28px}
  .code-box{background:rgba(255,255,255,.2);border:2px dashed rgba(255,255,255,.6);border-radius:14px;padding:20px;text-align:center;margin-bottom:24px}
  .code-lbl{font-size:11px;opacity:.8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
  .code{font-size:34px;font-weight:900;letter-spacing:6px}
  h2{margin:0 0 18px;font-size:20px}
  .row{display:flex;justify-content:space-between;margin-bottom:10px;font-size:14px}
  .lbl{opacity:.8}.val{font-weight:bold}
  .total{background:rgba(0,0,0,.2);border-radius:8px;padding:12px 16px;margin-top:12px}
  .footer{text-align:center;margin-top:28px;opacity:.65;font-size:11px}
</style></head>
<body><div class="c">
  <div class="logo">TiliGo</div>
  <div class="tag">Dërgesa shpejt, kudo në Kosovë</div>
  <div class="code-box">
    <div class="code-lbl">Kodi i kuponit</div>
    <div class="code">${order.couponCode ?? 'TLG-000000'}</div>
  </div>
  <h2>Porosia #${order.id}</h2>
  <div class="row"><span class="lbl">Klienti:</span><span class="val">${order.customerName}</span></div>
  <div class="row"><span class="lbl">Telefoni:</span><span class="val">${order.customerPhone}</span></div>
  <div class="row"><span class="lbl">Adresa:</span><span class="val">${order.customerAddress}</span></div>
  <div class="row total"><span class="lbl">Totali:</span><span class="val">€${Number(order.totalAmount ?? 0).toFixed(2)}</span></div>
  <div class="footer">TiliGo — Shërbim dërgese Kosovë • tiligo.app</div>
</div></body></html>`;
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.22, duration: 950, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 950, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const poll = useCallback(async () => {
    if (!id) return;
    try { setOrder(await fetchOrder(id)); } catch {}
  }, [id]);

  useEffect(() => {
    poll().finally(() => setLoading(false));
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [poll]);

  const handlePDF = async () => {
    if (!order) return;
    if (Platform.OS === 'web') { Alert.alert('PDF', 'Shkarkimi i PDF disponueshëm në aplikacion mobil'); return; }
    setGeneratingPDF(true);
    try {
      const uri = await generateCouponPDF(order);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Kuponi i TiliGo' });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert('Gabim', 'Kuponi nuk u krijua'); }
    finally { setGeneratingPDF(false); }
  };

  if (loading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderTxt}>Po ngarkohet porosia...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={52} color={Colors.error} />
        <Text style={styles.loaderTxt}>Porosia nuk u gjet</Text>
        <Pressable style={styles.backBtn2} onPress={() => router.push('/')}>
          <Text style={styles.backBtn2Txt}>Kthehu</Text>
        </Pressable>
      </View>
    );
  }

  const curStatus = String(order.status ?? 'pending');
  const curIdx = statusIndex(curStatus);
  const isDelivering = curStatus === 'delivering';
  const isDelivered = curStatus === 'delivered';
  const showMap = isDelivering || isDelivered;

  const delivLat = Number(order.deliveryLat ?? 42.6629);
  const delivLng = Number(order.deliveryLng ?? 21.1655);
  const custLat = Number(order.customerLat ?? 42.66);
  const custLng = Number(order.customerLng ?? 21.17);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backIconBtn} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Gjurmimi i porosisë</Text>
          <Text style={styles.headerSub}>#{String(order.id).padStart(6, '0')}</Text>
        </View>
        <Logo size="xs" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map or placeholder */}
        <View style={[styles.mapContainer, !showMap && styles.mapPlaceholderContainer]}>
          {showMap ? (
            <>
              <TrackingMap delivLat={delivLat} delivLng={delivLng} custLat={custLat} custLng={custLng} />
              <View style={styles.mapBadge}>
                <Ionicons name="bicycle" size={14} color={Colors.primary} />
                <Text style={styles.mapBadgeTxt}>Dërguesi në lëvizje</Text>
              </View>
            </>
          ) : (
            <LinearGradient colors={[Colors.primary, Colors.blue]} style={StyleSheet.absoluteFill} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={styles.mapPlaceholderContent}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <View style={styles.mapIconCircle}>
                    <Ionicons
                      name={isDelivered ? 'checkmark-done-circle' : 'time'}
                      size={38}
                      color={Colors.primary}
                    />
                  </View>
                </Animated.View>
                <Text style={styles.mapPlaceholderTxt}>
                  {isDelivered ? '✅ Porosia u dorëzua!' : '⏳ Po përgatitet porosia...'}
                </Text>
              </View>
            </LinearGradient>
          )}
        </View>

        {order.estimatedTime && (
          <View style={styles.etaCard}>
            <Ionicons name="time-outline" size={18} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.etaLabel}>Koha e parashikuar e dorëzimit</Text>
              <Text style={styles.etaVal}>{String(order.estimatedTime)}</Text>
            </View>
          </View>
        )}

        {/* Status timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rrjedha e porosisë</Text>
          {STATUSES.map((st, idx) => {
            const done = idx < curIdx;
            const active = idx === curIdx;
            return (
              <View key={st.key} style={styles.timelineRow}>
                <View style={styles.timelineIconCol}>
                  <View style={[styles.timelineDot, done && styles.timelineDotDone, active && { backgroundColor: st.color }]}>
                    <Ionicons name={st.icon as any} size={14} color={done || active ? '#fff' : Colors.textTertiary} />
                  </View>
                  {idx < STATUSES.length - 1 && (
                    <View style={[styles.timelineLine, (done || active) && styles.timelineLineDone]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, (done || active) && { color: Colors.text, fontFamily: 'Inter_600SemiBold' }]}>{st.label}</Text>
                  {active && <Text style={[styles.timelineSub, { color: st.color }]}>Tani</Text>}
                  {done && <Text style={styles.timelineSub}>Kompletuar</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detajet e porosisë</Text>
          <View style={styles.detailCard}>
            {[
              { icon: 'person-outline', label: 'Klienti', val: String(order.customerName ?? '') },
              { icon: 'call-outline', label: 'Telefoni', val: String(order.customerPhone ?? '') },
              { icon: 'location-outline', label: 'Adresa', val: String(order.customerAddress ?? '') },
              { icon: 'cash-outline', label: 'Totali', val: `€${Number(order.totalAmount ?? 0).toFixed(2)}` },
            ].map((row, i, arr) => (
              <View key={row.label}>
                <View style={styles.detailRow}>
                  <Ionicons name={row.icon as any} size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailVal} numberOfLines={1}>{row.val}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.detailDiv} />}
              </View>
            ))}
          </View>
        </View>

        {/* Coupon */}
        {order.couponCode && (
          <View style={styles.couponCard}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.couponTitle}>🎫 Kuponi juaj</Text>
              <Text style={styles.couponCode}>{String(order.couponCode)}</Text>
              <Text style={styles.couponSub}>Ruajeni për herën tjetër</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.pdfBtn, pressed && { opacity: 0.85 }]} onPress={handlePDF} disabled={generatingPDF}>
              {generatingPDF ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="document-outline" size={18} color="#fff" />
                  <Text style={styles.pdfBtnTxt}>PDF</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: Colors.background },
  loaderTxt: { fontFamily: 'Inter_500Medium', fontSize: 16, color: Colors.textSecondary },
  backBtn2: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtn2Txt: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 14 },
  backIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.text },
  headerSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  mapContainer: { marginHorizontal: 20, borderRadius: 18, overflow: 'hidden', marginBottom: 14, height: 220 },
  mapPlaceholderContainer: {},
  mapPlaceholderContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  mapIconCircle: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  mapPlaceholderTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' },
  mapBadge: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  mapBadgeTxt: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.text },
  etaCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.primaryGhost, marginHorizontal: 20, borderRadius: 14, padding: 14, marginBottom: 14 },
  etaLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  etaVal: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.primary },
  section: { paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.text },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineIconCol: { alignItems: 'center', width: 30 },
  timelineDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.surfaceTertiary, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  timelineDotDone: { backgroundColor: Colors.success },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.surfaceTertiary, marginVertical: 4 },
  timelineLineDone: { backgroundColor: Colors.success },
  timelineContent: { flex: 1, paddingVertical: 6, paddingBottom: 16 },
  timelineLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textTertiary },
  timelineSub: { fontFamily: 'Inter_500Medium', fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  detailCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  detailLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, width: 68 },
  detailVal: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.text, flex: 1 },
  detailDiv: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 42 },
  couponCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: Colors.surface, borderRadius: 16, padding: 18, borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', gap: 14 },
  couponTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.textSecondary },
  couponCode: { fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.primary, letterSpacing: 3 },
  couponSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textSecondary },
  pdfBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', gap: 6 },
  pdfBtnTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' },
});
