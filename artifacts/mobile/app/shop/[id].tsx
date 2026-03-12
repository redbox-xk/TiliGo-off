import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useCart } from '@/context/CartContext';
import { Colors } from '@/constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

const PRODUCT_IMAGES: Record<string, string> = {
  pica: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80',
  sushi: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=300&q=80',
  kafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80',
  sallatë: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
};

const SHOP_IMAGES: Record<string, string> = {
  restorant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
  'fast-food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&q=80',
  pica: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
};

async function fetchShop(id: string) {
  const res = await fetch(`https://${BASE_URL}/api/shops/${id}`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

async function fetchProducts(shopId: string) {
  const res = await fetch(`https://${BASE_URL}/api/shops/${shopId}/products`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

export default function ShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { addItem, items, shopId: cartShopId } = useCart();

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ['shop', id],
    queryFn: () => fetchShop(id!),
    enabled: !!id,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => fetchProducts(id!),
    enabled: !!id,
  });

  const categories = [...new Set(products.map((p: Record<string, unknown>) => String(p.category || 'Tjera')))];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((p: Record<string, unknown>) => (p.category || 'Tjera') === selectedCategory);

  const getCartQty = (productId: string) => {
    return items.find(i => i.productId === productId)?.quantity ?? 0;
  };

  const handleAdd = (product: Record<string, unknown>) => {
    if (cartShopId && cartShopId !== String(id)) {
      Alert.alert(
        'Shporta ndryshohet',
        'Keni artikuj nga dyqan tjetër. Dëshironi të filloni me këtë dyqan?',
        [
          { text: 'Anulo', style: 'cancel' },
          {
            text: 'Po, ndryshoje',
            onPress: () => {
              addItem({
                productId: String(product.id),
                productName: String(product.name),
                price: Number(product.price),
                quantity: 1,
                imageUrl: String(product.imageUrl ?? ''),
              }, String(id), String(shop?.name ?? ''));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
        ]
      );
      return;
    }
    addItem({
      productId: String(product.id),
      productName: String(product.name),
      price: Number(product.price),
      quantity: 1,
      imageUrl: String(product.imageUrl ?? ''),
    }, String(id), String(shop?.name ?? ''));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (shopLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: topInset }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!shop) return null;

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: String(shop.imageUrl ?? SHOP_IMAGES[String(shop.category)] ?? SHOP_IMAGES.default) }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          <View style={[styles.heroActions, { top: topInset + 8 }]}>
            <Pressable style={styles.heroBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.shopInfo}>
          <View style={styles.shopNameRow}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <View style={[styles.openBadge, { backgroundColor: shop.isOpen ? Colors.success : Colors.error }]}>
              <Text style={styles.openText}>{shop.isOpen ? 'Hapur' : 'Mbyllur'}</Text>
            </View>
          </View>
          <Text style={styles.shopCategory}>{shop.category}</Text>

          <View style={styles.metaRow}>
            <MetaItem icon="star" value={`${Number(shop.rating ?? 4.5).toFixed(1)} (${shop.reviewCount ?? 0})`} color={Colors.secondary} />
            <MetaItem icon="time-outline" value={shop.deliveryTime ?? '25-35 min'} />
            <MetaItem icon="bicycle-outline" value={Number(shop.deliveryFee ?? 1.5) === 0 ? 'Falas' : `€${Number(shop.deliveryFee ?? 1.5).toFixed(2)}`} />
            <MetaItem icon="card-outline" value={`Min. €${Number(shop.minOrder ?? 3).toFixed(2)}`} />
          </View>

          {shop.address && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.addressText}>{shop.address}, {shop.city}</Text>
            </View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catContent}
        >
          <Pressable
            style={[styles.catChip, selectedCategory === 'all' && styles.catChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.catText, selectedCategory === 'all' && styles.catTextActive]}>Të gjitha</Text>
          </Pressable>
          {categories.map(cat => (
            <Pressable
              key={cat}
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {productsLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        ) : filteredProducts.length === 0 ? (
          <View style={styles.noProducts}>
            <Ionicons name="fast-food-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.noProductsText}>Asnjë produkt nuk u gjet</Text>
          </View>
        ) : (
          <View style={styles.productsList}>
            {filteredProducts.map((product: Record<string, unknown>) => {
              const qty = getCartQty(String(product.id));
              return (
                <Pressable
                  key={String(product.id)}
                  style={({ pressed }) => [styles.productCard, pressed && { opacity: 0.92 }]}
                  onPress={() => handleAdd(product)}
                >
                  <Image
                    source={{ uri: String(product.imageUrl ?? PRODUCT_IMAGES[String(product.category)] ?? PRODUCT_IMAGES.default) }}
                    style={styles.productImage}
                    contentFit="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{String(product.name)}</Text>
                    {product.description ? (
                      <Text style={styles.productDesc} numberOfLines={2}>{String(product.description)}</Text>
                    ) : null}
                    {Array.isArray(product.suggestions) && product.suggestions.length > 0 && (
                      <Text style={styles.suggestionsText} numberOfLines={1}>
                        +{(product.suggestions as string[]).join(', ')}
                      </Text>
                    )}
                    <Text style={styles.productPrice}>€{Number(product.price).toFixed(2)}</Text>
                  </View>
                  <View style={styles.productActions}>
                    {qty > 0 ? (
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyBadgeText}>{qty}</Text>
                      </View>
                    ) : (
                      <View style={styles.addBtn}>
                        <Ionicons name="add" size={20} color={Colors.primary} />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: cartCount > 0 ? 100 : 40 }} />
      </ScrollView>

      {cartCount > 0 && cartShopId === String(id) && (
        <View style={[styles.cartBar, { bottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 90 }]}>
          <Pressable
            style={({ pressed }) => [styles.cartBtn, pressed && { opacity: 0.9 }]}
            onPress={() => router.push('/cart')}
          >
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBtnText}>Shiko shportën</Text>
            <Text style={styles.cartBtnTotal}>€{cartTotal.toFixed(2)}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function MetaItem({ icon, value, color }: { icon: string; value: string; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={13} color={color ?? Colors.textSecondary} />
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: color ?? Colors.textSecondary }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  heroContainer: { width: '100%', height: 240, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  heroActions: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  heroBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  shopInfo: { padding: 20, gap: 6, backgroundColor: Colors.surface },
  shopNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shopName: { fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.text, flex: 1 },
  openBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  openText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#fff' },
  shopCategory: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, textTransform: 'capitalize' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  addressText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, flex: 1 },
  catScroll: { marginTop: 8 },
  catContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 12 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  catTextActive: { color: '#fff' },
  noProducts: { alignItems: 'center', paddingTop: 60, gap: 12 },
  noProductsText: { fontFamily: 'Inter_400Regular', fontSize: 16, color: Colors.textSecondary },
  productsList: { paddingHorizontal: 20, gap: 12 },
  productCard: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 14,
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1, alignItems: 'center',
  },
  productImage: { width: 90, height: 90 },
  productInfo: { flex: 1, padding: 12, gap: 3 },
  productName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  productDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  suggestionsText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.primary, fontStyle: 'italic' },
  productPrice: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.primary, marginTop: 4 },
  productActions: { paddingRight: 14 },
  addBtn: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1.5,
    borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  qtyBadge: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  qtyBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' },
  cartBar: { position: 'absolute', left: 20, right: 20 },
  cartBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  cartBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' },
  cartBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff', flex: 1 },
  cartBtnTotal: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#fff' },
});
