import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import Logo from '@/components/Logo';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, shopId, shopName, deliveryTotal, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const deliveryFee = 1.50;
  const total = deliveryTotal + deliveryFee;

  const handleOrder = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Të dhëna të mangëta', 'Plotësoni emrin, telefonin dhe adresën tuaj');
      return;
    }
    if (items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`https://${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          customerName: name,
          customerPhone: phone,
          customerAddress: address,
          items: items.map(i => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            price: i.deliveryPrice,
            suggestions: i.suggestions ?? [],
          })),
          notes,
        }),
      });
      const order = await res.json();
      if (!res.ok) {
        Alert.alert('Gabim', order.error ?? 'Porosia dështoi');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearCart();
      router.dismissAll();
      router.push({ pathname: '/order-tracking/[id]', params: { id: String(order.id) } });
    } catch {
      Alert.alert('Gabim', 'Lidhja dështoi. Provo përsëri.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.dismiss()} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Porosia finale</Text>
          <Logo size="xs" />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Shop */}
          <View style={styles.shopRow}>
            <View style={styles.shopIcon}><Ionicons name="storefront" size={18} color={Colors.primary} /></View>
            <Text style={styles.shopName}>{shopName}</Text>
          </View>

          {/* Items */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Artikujt</Text>
            {items.map(item => (
              <View key={item.productId} style={styles.orderItem}>
                <Text style={styles.orderItemQty}>{item.quantity}×</Text>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName}>{item.productName}</Text>
                  {item.suggestions && item.suggestions.length > 0 && (
                    <Text style={styles.orderItemSugg}>+ {item.suggestions.join(', ')}</Text>
                  )}
                </View>
                <Text style={styles.orderItemPrice}>€{(item.deliveryPrice * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Delivery info */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Informacionet e dorëzimit</Text>
            <View style={styles.formGroup}>
              <Field icon="person-outline" placeholder="Emri dhe Mbiemri *" value={name} onChangeText={setName} />
              <Field icon="call-outline" placeholder="Nr. Telefonit *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Field icon="location-outline" placeholder="Adresa e plotë e dorëzimit *" value={address} onChangeText={setAddress} />
              <View style={styles.notesField}>
                <Ionicons name="chatbubble-outline" size={17} color={Colors.textSecondary} style={{ marginTop: 2 }} />
                <TextInput
                  style={[styles.input, { minHeight: 60 }]}
                  placeholder="Shënime shtesë (kat, derë, etj.)"
                  placeholderTextColor={Colors.textTertiary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>
            </View>
          </View>

          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Totali i porosisë</Text>
            <View style={styles.summaryBox}>
              <SumRow label="Nëntotali" value={`€${deliveryTotal.toFixed(2)}`} />
              <SumRow label="Tarifa e dërgimit" value={`€${deliveryFee.toFixed(2)}`} />
              <View style={styles.sumDivider} />
              <SumRow label="TOTALI" value={`€${total.toFixed(2)}`} bold />
            </View>
          </View>

          <View style={styles.paymentNote}>
            <Ionicons name="cash-outline" size={16} color={Colors.primary} />
            <Text style={styles.paymentNoteTxt}>Pagesa me para në dorë gjatë dorëzimit</Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 16 }]}>
          <Pressable
            style={({ pressed }) => [styles.orderBtn, pressed && { opacity: 0.9 }]}
            onPress={handleOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.orderBtnTxt}>Porosit tani</Text>
                <Text style={styles.orderBtnTotal}>€{total.toFixed(2)}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, placeholder, value, onChangeText, keyboardType }: {
  icon: string; placeholder: string; value: string; onChangeText: (t: string) => void; keyboardType?: 'default' | 'phone-pad';
}) {
  return (
    <View style={styles.notesField}>
      <Ionicons name={icon as any} size={17} color={Colors.textSecondary} />
      <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={Colors.textTertiary} value={value} onChangeText={onChangeText} keyboardType={keyboardType ?? 'default'} />
    </View>
  );
}

function SumRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.sumRow}>
      <Text style={[styles.sumLabel, bold && styles.sumLabelBold]}>{label}</Text>
      <Text style={[styles.sumVal, bold && styles.sumValBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text, flex: 1 },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.primaryGhost, borderRadius: 12, padding: 12 },
  shopIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  shopName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text, flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 20 },
  section: { gap: 12 },
  sectionLabel: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  orderItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  orderItemQty: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.primary, width: 26 },
  orderItemInfo: { flex: 1 },
  orderItemName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text },
  orderItemSugg: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
  orderItemPrice: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  formGroup: { gap: 10 },
  notesField: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text },
  summaryBox: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: Colors.border },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  sumLabelBold: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  sumVal: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text },
  sumValBold: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.primary },
  sumDivider: { height: 1, backgroundColor: Colors.border },
  paymentNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryGhost, borderRadius: 12, padding: 14 },
  paymentNoteTxt: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.primary, flex: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  orderBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: Colors.primary, shadowOffset: {width:0,height:4}, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  orderBtnTxt: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#fff', flex: 1, textAlign: 'center' },
  orderBtnTotal: { fontFamily: 'Inter_700Bold', fontSize: 16, color: 'rgba(255,255,255,0.9)' },
});
