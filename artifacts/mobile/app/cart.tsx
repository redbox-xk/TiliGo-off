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

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { items, shopId, shopName, totalAmount, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const deliveryFee = 1.5;
  const total = totalAmount + deliveryFee;

  const handleOrder = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Gabim', 'Plotësoni emrin, telefonin dhe adresën');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Shporta bosh', 'Shtoni produkte para se të porosisni');
      return;
    }
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
            price: i.price,
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
    } catch (e) {
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
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Finalizo Porosinë</Text>
          <Text style={styles.shopName}>{shopName}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artikujt e porosisë</Text>
            {items.map(item => (
              <View key={item.productId} style={styles.orderItem}>
                <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemName}>{item.productName}</Text>
                  {item.suggestions && item.suggestions.length > 0 && (
                    <Text style={styles.orderItemSugg}>+{item.suggestions.join(', ')}</Text>
                  )}
                </View>
                <Text style={styles.orderItemPrice}>€{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacionet e dorëzimit</Text>
            <View style={styles.inputGroup}>
              <InputField
                icon="person-outline"
                placeholder="Emri dhe Mbiemri"
                value={name}
                onChangeText={setName}
              />
              <InputField
                icon="call-outline"
                placeholder="Numri i telefonit"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <InputField
                icon="location-outline"
                placeholder="Adresa e plotë"
                value={address}
                onChangeText={setAddress}
              />
              <View style={styles.inputWrapper}>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Shënime shtesë (opcionale)"
                  placeholderTextColor={Colors.textTertiary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Përmbledhja</Text>
            <View style={styles.summaryCard}>
              <SummaryRow label="Nëntotali" value={`€${totalAmount.toFixed(2)}`} />
              <SummaryRow label="Tarifa e dorëzimit" value={`€${deliveryFee.toFixed(2)}`} />
              <View style={styles.divider} />
              <SummaryRow label="Totali" value={`€${total.toFixed(2)}`} bold />
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 16 }]}>
          <Pressable
            style={({ pressed }) => [styles.orderBtn, pressed && { opacity: 0.88 }]}
            onPress={handleOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.orderBtnText}>Porosit tani</Text>
                <Text style={styles.orderBtnTotal}>€{total.toFixed(2)}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function InputField({ icon, placeholder, value, onChangeText, keyboardType }: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
}) {
  return (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={Colors.textSecondary} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
      />
    </View>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryLabelBold]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, color: Colors.text },
  shopName: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 20 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.text },
  orderItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  orderItemQty: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.primary, width: 28 },
  orderItemInfo: { flex: 1 },
  orderItemName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text },
  orderItemSugg: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic' },
  orderItemPrice: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.text },
  inputGroup: { gap: 10 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text },
  notesInput: { minHeight: 48 },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  summaryLabelBold: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  summaryValue: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text },
  summaryValueBold: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border },
  footer: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  orderBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  orderBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff', flex: 1, textAlign: 'center' },
  orderBtnTotal: { fontFamily: 'Inter_700Bold', fontSize: 16, color: 'rgba(255,255,255,0.85)' },
});
