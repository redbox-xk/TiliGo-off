import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { Colors } from '@/constants/colors';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { items, shopName, shopId, totalAmount, totalItems, removeItem, updateQuantity } = useCart();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <Text style={styles.title}>Shporta</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Shporta juaj është bosh</Text>
          <Text style={styles.emptySubtitle}>Shtoni produkte nga dyqanet tuaja</Text>
          <Pressable
            style={styles.browseBtn}
            onPress={() => router.push('/')}
          >
            <Text style={styles.browseBtnText}>Shfleto dyqanet</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Shporta</Text>
        <Text style={styles.shopName}>{shopName}</Text>
      </View>

      <ScrollView
        style={styles.itemsList}
        contentContainerStyle={styles.itemsContent}
        showsVerticalScrollIndicator={false}
      >
        {items.map(item => (
          <View key={item.productId} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.productName}</Text>
              {item.suggestions && item.suggestions.length > 0 && (
                <Text style={styles.itemSuggestions} numberOfLines={1}>
                  +{item.suggestions.join(', ')}
                </Text>
              )}
              <Text style={styles.itemPrice}>€{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
            <View style={styles.qtyRow}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.productId, item.quantity - 1)}
              >
                <Ionicons name="remove" size={16} color={Colors.primary} />
              </Pressable>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.productId, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color={Colors.primary} />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + (Platform.OS === 'web' ? 34 : 0), 16) + 80 }]}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Nëntotali ({totalItems} artikuj)</Text>
          <Text style={styles.summaryValue}>€{totalAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Dorëzimi</Text>
          <Text style={styles.summaryValue}>€1.50</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Totali</Text>
          <Text style={styles.totalValue}>€{(totalAmount + 1.5).toFixed(2)}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.checkoutBtn, pressed && { opacity: 0.88 }]}
          onPress={() => router.push('/cart')}
        >
          <Text style={styles.checkoutBtnText}>Vazhdo me porosinë</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.text,
  },
  shopName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#fff',
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  itemSuggestions: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.primary,
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
    minWidth: 20,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text,
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  totalValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.primary,
  },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  checkoutBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#fff',
  },
});
