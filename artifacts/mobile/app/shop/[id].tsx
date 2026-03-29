import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform,
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
import Logo from '@/components/Logo';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';
const DELIVERY_MARKUP = 1.20;

const SHOP_IMGS: Record<string, string> = {
  restorant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'fast-food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80',
  pica: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  kafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
};
const PROD_IMGS: Record<string, string> = {
  pica: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80',
  kafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80',
  default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80',
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
  const { addItem, items, shopId: cartShopId, totalItems, deliveryTotal } = useCart();
  const [selectedCat, setSelectedCat] = useState('all');

  const { data: shop, isLoading: shopLoad } = useQuery({ queryKey: ['shop', id], queryFn: () => fetchShop(id!), enabled: !!id });
  const { data: products = [], isLoading: prodLoad } = useQuery({ queryKey: ['products', id], queryFn: () => fetchProducts(id!), enabled: !!id });

  const categories = ['all', ...new Set(products.map((p: Record<string, unknown>) => String(p.category || 'Tjera')))];
  const filtered = selectedCat === 'all' ? products : products.filter((p: Record<string, unknown>) => (p.category || 'Tjera') === selectedCat);

  const getQty = (pid: string) => items.find(i => i.productId === pid)?.quantity ?? 0;

  const handleAdd = useCallback((product: Record<string, unknown>) => {
    const basePrice = Number(product.price);
    const deliveryPrice = Math.round(basePrice * DELIVERY_MARKUP * 100) / 100;
    
    const doAdd = () => {
      addItem({
        productId: String(product.id),
        productName: String(product.name),
        basePrice,
        deliveryPrice,
        quantity: 1,
        imageUrl: String(product.imageUrl ?? ''),
      }, String(id), String(shop?.name ?? ''));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    if (cartShopId && cartShopId !== String(id)) {
      Alert.alert(
        'Ndrysho dyqanin?',
        'Keni artikuj nga dyqan tjetër. Dëshironi të filloni me këtë dyqan?',
        [{ text: 'Anulo', style: 'cancel' }, { text: 'Po, ndryshoje', onPress: doAdd }]
      );
    } else {
      doAdd();
    }
  }, [cartShopId, id, shop, addItem]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (shopLoad) {
    return <View style={[styles.loader, { paddingTop: topPad }]}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  if (!shop) return null;

  const cartIsThisShop = cartShopId === String(id);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={{ uri: String(shop.imageUrl ?? SHOP_IMGS[String(shop.category)] ?? SHOP_IMGS.default) }}
            style={styles.heroImg}
            contentFit="cover"
          />
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent']} start={{x:0,y:0}} end={{x:0,y:1}} style={styles.heroTopGrad} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.heroBottomGrad} />
          
          <View style={[styles.heroNav, { top: topPad + 8 }]}>
            <Pressable style={styles.navBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            <Logo size="xs" style={{ opacity: 0.95 }} />
            <Pressable style={styles.navBtn}>
              <Ionicons name="heart-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.heroBottom}>
            <Text style={styles.heroName}>{shop.name}</Text>
            <View style={styles.heroMeta}>
              <View style={[styles.heroBadge, { backgroundColor: shop.isOpen ? Colors.success : Colors.error }]}>
                <Text style={styles.heroBadgeTxt}>{shop.isOpen ? '● Hapur' : '● Mbyllur'}</Text>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="star" size={11} color="#FFD700" />
                <Text style={styles.heroBadgeTxt}>{Number(shop.rating ?? 4.5).toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Shop Info */}
        <View style={styles.shopInfoCard}>
          <Text style={styles.shopCategory}>{shop.category} • {shop.city}</Text>
          <View style={styles.shopStats}>
            <StatItem icon="time-outline" value={shop.deliveryTime ?? '25 min'} label="Kohëzgjatja" />
            <View style={styles.statDivider} />
            <StatItem icon="bicycle-outline" value={Number(shop.deliveryFee ?? 1.5) === 0 ? 'Falas' : `€${Number(shop.deliveryFee).toFixed(2)}`} label="Dërgimi" />
            <View style={styles.statDivider} />
            <StatItem icon="card-outline" value={`€${Number(shop.minOrder ?? 3).toFixed(2)}`} label="Min. porosi" />
            <View style={styles.statDivider} />
            <StatItem icon="star-outline" value={String(shop.rating ?? '4.5')} label="Vlerësimi" />
          </View>
          {shop.address && (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.addressTxt}>{shop.address}, {shop.city}</Text>
            </View>
          )}
          <View style={styles.markupNote}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.info} />
            <Text style={styles.markupTxt}>Çmimet e dërgimit: +20% markup mbi çmimin bazë</Text>
          </View>
        </View>

        {/* Category tabs */}
        {categories.length > 2 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catTabs}>
            {categories.map(cat => (
              <Pressable
                key={cat}
                style={[styles.catTab, selectedCat === cat && styles.catTabActive]}
                onPress={() => setSelectedCat(cat)}
              >
                <Text style={[styles.catTabTxt, selectedCat === cat && styles.catTabTxtActive]}>
                  {cat === 'all' ? 'Të gjitha' : cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Products */}
        {prodLoad ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.productList}>
            {filtered.map((product: Record<string, unknown>) => {
              const basePrice = Number(product.price);
              const deliveryPrice = Math.round(basePrice * DELIVERY_MARKUP * 100) / 100;
              const qty = getQty(String(product.id));
              const isAvail = product.isAvailable !== false;

              return (
                <Pressable
                  key={String(product.id)}
                  style={({ pressed }) => [styles.prodCard, !isAvail && styles.prodCardUnavail, pressed && { opacity: 0.9 }]}
                  onPress={() => isAvail && handleAdd(product)}
                  disabled={!isAvail}
                >
                  <View style={styles.prodImageWrap}>
                    <Image
                      source={{ uri: String(product.imageUrl ?? PROD_IMGS[String(product.category)] ?? PROD_IMGS.default) }}
                      style={styles.prodImage}
                      contentFit="cover"
                    />
                    {!isAvail && (
                      <View style={styles.unavailOverlay}>
                        <Text style={styles.unavailTxt}>Jo disponueshëm</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.prodInfo}>
                    <Text style={styles.prodName}>{String(product.name)}</Text>
                    {product.description && <Text style={styles.prodDesc} numberOfLines={2}>{String(product.description)}</Text>}
                    {Array.isArray(product.suggestions) && product.suggestions.length > 0 && (
                      <Text style={styles.prodSugg} numberOfLines={1}>+ {(product.suggestions as string[]).join(', ')}</Text>
                    )}
                    <View style={styles.prodPriceRow}>
                      <View>
                        <Text style={styles.prodDeliveryPrice}>€{deliveryPrice.toFixed(2)}</Text>
                        <Text style={styles.prodBasePrice}>Bazë: €{basePrice.toFixed(2)}</Text>
                      </View>
                      {isAvail && (
                        qty > 0 ? (
                          <View style={styles.qtyBadge}>
                            <Text style={styles.qtyBadgeTxt}>{qty} shtuar</Text>
                          </View>
                        ) : (
                          <View style={styles.addCircle}>
                            <Ionicons name="add" size={20} color={Colors.primary} />
                          </View>
                        )
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        <View style={{ height: totalItems > 0 && cartIsThisShop ? 110 : 40 }} />
      </ScrollView>

      {/* Floating cart bar */}
      {totalItems > 0 && cartIsThisShop && (
        <View style={[styles.cartBar, { bottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 90 }]}>
          <Pressable
            style={({ pressed }) => [styles.cartBtn, pressed && { opacity: 0.92 }]}
            onPress={() => router.push('/cart')}
          >
            <View style={styles.cartBadge}><Text style={styles.cartBadgeTxt}>{totalItems}</Text></View>
            <Text style={styles.cartBtnTxt}>Shiko shportën</Text>
            <Text style={styles.cartBtnTotal}>€{deliveryTotal.toFixed(2)}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function StatItem({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Ionicons name={icon as any} size={16} color={Colors.primary} />
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: Colors.text, marginTop: 4 }}>{value}</Text>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: Colors.textSecondary, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  hero: { height: 260, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroTopGrad: { position: 'absolute', top: 0, left: 0, right: 0, height: 100 },
  heroBottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
  heroNav: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { position: 'absolute', bottom: 16, left: 20, right: 20 },
  heroName: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#fff', marginBottom: 8, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: {width:0,height:1}, textShadowRadius: 4 },
  heroMeta: { flexDirection: 'row', gap: 8 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  heroBadgeTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' },
  shopInfoCard: { backgroundColor: Colors.surface, padding: 20, gap: 12 },
  shopCategory: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary, textTransform: 'capitalize' },
  shopStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceSecondary, borderRadius: 14, padding: 14 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addressTxt: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, flex: 1 },
  markupNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.blueGhost, padding: 10, borderRadius: 10 },
  markupTxt: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.info, flex: 1 },
  catTabs: { paddingHorizontal: 20, gap: 8, paddingVertical: 14 },
  catTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  catTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catTabTxt: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  catTabTxtActive: { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  productList: { paddingHorizontal: 20, gap: 12 },
  prodCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  prodCardUnavail: { opacity: 0.55 },
  prodImageWrap: { width: 100, height: 100, position: 'relative' },
  prodImage: { width: '100%', height: '100%' },
  unavailOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  unavailTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#fff', textAlign: 'center', paddingHorizontal: 4 },
  prodInfo: { flex: 1, padding: 12, gap: 3 },
  prodName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  prodDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  prodSugg: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.primary, fontStyle: 'italic' },
  prodPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  prodDeliveryPrice: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.primary },
  prodBasePrice: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textTertiary },
  addCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyBadge: { backgroundColor: Colors.primaryGhost, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  qtyBadgeTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.primary },
  cartBar: { position: 'absolute', left: 20, right: 20 },
  cartBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: Colors.primary, shadowOffset: {width:0,height:4}, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  cartBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  cartBadgeTxt: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' },
  cartBtnTxt: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#fff', flex: 1 },
  cartBtnTotal: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
});
