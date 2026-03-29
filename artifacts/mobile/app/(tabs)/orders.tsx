import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCart } from '@/context/CartContext';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { items, shopName, shopId, deliveryTotal, totalItems, updateQuantity } = useCart();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : 0;

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Text style={styles.title}>Shporta</Text>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIllustration}>
            <Ionicons name="bag-outline" size={56} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Shporta juaj është bosh</Text>
          <Text style={styles.emptySub}>Shtoni produkte nga dyqanet dhe filloni porosinë</Text>
          <Pressable style={styles.browseBtn} onPress={() => router.push('/')}>
            <Ionicons name="storefront-outline" size={18} color="#fff" />
            <Text style={styles.browseBtnTxt}>Shfleto dyqanet</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const deliveryFee = 1.50;
  const subtotal = deliveryTotal;
  const total = subtotal + deliveryFee;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Shporta</Text>
        {shopName && (
          <View style={styles.shopTag}>
            <Ionicons name="storefront-outline" size={13} color={Colors.primary} />
            <Text style={styles.shopTagTxt}>{shopName}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Artikujt ({totalItems})</Text>
          {items.map(item => (
            <View key={item.productId} style={styles.itemCard}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemName}>{item.productName}</Text>
                {item.suggestions && item.suggestions.length > 0 && (
                  <Text style={styles.itemSugg} numberOfLines={1}>+ {item.suggestions.join(', ')}</Text>
                )}
                <View style={styles.priceRow}>
                  <Text style={styles.itemDeliveryPrice}>€{(item.deliveryPrice * item.quantity).toFixed(2)}</Text>
                  {item.basePrice !== item.deliveryPrice && (
                    <Text style={styles.itemBasePrice}>€{(item.basePrice * item.quantity).toFixed(2)}</Text>
                  )}
                </View>
              </View>
              <View style={styles.qtyControl}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => { Haptics.selectionAsync(); updateQuantity(item.productId, item.quantity - 1); }}
                >
                  <Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={15} color={item.quantity === 1 ? Colors.error : Colors.primary} />
                </Pressable>
                <Text style={styles.qtyNum}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => { Haptics.selectionAsync(); updateQuantity(item.productId, item.quantity + 1); }}
                >
                  <Ionicons name="add" size={15} color={Colors.primary} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Përmbledhja</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nëntotali</Text>
            <Text style={styles.summaryVal}>€{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tarifa e dërgimit</Text>
            <Text style={styles.summaryVal}>€{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Totali</Text>
            <Text style={styles.totalVal}>€{total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={15} color={Colors.info} />
          <Text style={styles.noteText}>Çmimet përfshijnë 20% markup për dërgim. Pagesa me para në dorë.</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + bottomPad + 80 }]}>
        <Pressable
          style={({ pressed }) => [styles.checkoutBtn, pressed && { opacity: 0.9 }]}
          onPress={() => router.push('/cart')}
        >
          <View style={styles.checkoutBadge}><Text style={styles.checkoutBadgeTxt}>{totalItems}</Text></View>
          <Text style={styles.checkoutTxt}>Vazhdo me porosinë</Text>
          <Text style={styles.checkoutTotal}>€{total.toFixed(2)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, color: Colors.text },
  shopTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, backgroundColor: Colors.primaryGhost, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  shopTagTxt: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.primary },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80, gap: 14, paddingHorizontal: 40 },
  emptyIllustration: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.text, textAlign: 'center' },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  browseBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8 },
  browseBtnTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 16 },
  section: { gap: 10 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text, marginBottom: 4 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 1,
  },
  itemLeft: { flex: 1, gap: 3 },
  itemName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  itemSugg: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  itemDeliveryPrice: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.primary },
  itemBasePrice: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textTertiary, textDecorationLine: 'line-through' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text, minWidth: 20, textAlign: 'center' },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  summaryVal: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  totalLabel: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.text },
  totalVal: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.primary },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.blueGhost, borderRadius: 12, padding: 12 },
  noteText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.info, flex: 1, lineHeight: 18 },
  footer: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  checkoutBtn: {
    backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  checkoutBadge: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  checkoutBadgeTxt: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' },
  checkoutTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff', flex: 1 },
  checkoutTotal: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
});
