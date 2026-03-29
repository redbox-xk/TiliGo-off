import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ActivityIndicator, RefreshControl, Platform, Animated, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import Logo from '@/components/Logo';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';
const W = Dimensions.get('window').width;

const CATEGORIES = [
  { id: 'all', label: 'Të gjitha', icon: 'grid', color: Colors.primary },
  { id: 'restorant', label: 'Restorante', icon: 'restaurant', color: '#E74C3C' },
  { id: 'fast-food', label: 'Fast Food', icon: 'fast-food', color: Colors.secondary },
  { id: 'pica', label: 'Pica', icon: 'pizza', color: '#9B59B6' },
  { id: 'kafe', label: 'Kafe', icon: 'cafe', color: '#795548' },
  { id: 'sushi', label: 'Sushi', icon: 'fish', color: '#1ABC9C' },
  { id: 'burger', label: 'Burger', icon: 'aperture', color: '#F39C12' },
  { id: 'sallatë', label: 'Sallatë', icon: 'leaf', color: '#27AE60' },
];

const SHOP_IMAGES: Record<string, string> = {
  restorant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'fast-food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80',
  pica: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
  kafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
  sushi: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=800&q=80',
  sallatë: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
};

async function fetchShops(category?: string) {
  const url = category && category !== 'all'
    ? `https://${BASE_URL}/api/shops?category=${encodeURIComponent(category)}`
    : `https://${BASE_URL}/api/shops`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

function ShopCard({ shop, onPress }: { shop: Record<string, unknown>; onPress: () => void }) {
  const imgUrl = String(shop.imageUrl ?? SHOP_IMAGES[String(shop.category)] ?? SHOP_IMAGES.default);
  return (
    <Pressable
      style={({ pressed }) => [styles.shopCard, pressed && { transform: [{ scale: 0.97 }], opacity: 0.95 }]}
      onPress={onPress}
    >
      <View style={styles.shopImageContainer}>
        <Image source={{ uri: imgUrl }} style={styles.shopImage} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.shopImageGrad} />
        <View style={styles.shopBadgeRow}>
          <View style={[styles.openBadge, { backgroundColor: shop.isOpen ? Colors.success : Colors.error }]}>
            <View style={[styles.openDot, { backgroundColor: '#fff' }]} />
            <Text style={styles.openBadgeText}>{shop.isOpen ? 'Hapur' : 'Mbyllur'}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#FFD700" />
          <Text style={styles.ratingText}>{Number(shop.rating ?? 4.5).toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.shopInfo}>
        <Text style={styles.shopName} numberOfLines={1}>{String(shop.name)}</Text>
        <Text style={styles.shopCategory}>{String(shop.category ?? '')} • {shop.city ?? 'Prishtinë'}</Text>
        <View style={styles.shopMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.metaChipText}>{String(shop.deliveryTime ?? '25 min')}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="bicycle-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.metaChipText}>
              {Number(shop.deliveryFee ?? 1.5) === 0 ? 'Falas' : `€${Number(shop.deliveryFee).toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="receipt-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.metaChipText}>Min €{Number(shop.minOrder ?? 3).toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCat, setSelectedCat] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: shops = [], isLoading, refetch } = useQuery({
    queryKey: ['shops', selectedCat],
    queryFn: () => fetchShops(selectedCat),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCat = (id: string) => {
    Haptics.selectionAsync();
    setSelectedCat(id);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Logo size="sm" />
          <Pressable style={styles.locationBtn}>
            <Ionicons name="location" size={14} color={Colors.primary} />
            <Text style={styles.locationText}>Prishtinë, Kosovë</Text>
            <Ionicons name="chevron-down" size={12} color={Colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
          </Pressable>
        </View>
        <Text style={styles.heroTitle}>Çfarë do të porosisni?</Text>
      </View>

      {/* Search */}
      <Pressable style={styles.searchBar} onPress={() => router.push('/search')}>
        <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
        <Text style={styles.searchText}>Restorante, produkte, kuzhina...</Text>
        <View style={styles.searchFilter}>
          <Ionicons name="options-outline" size={16} color={Colors.primary} />
        </View>
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.id}
              style={[styles.catItem, selectedCat === cat.id && { borderColor: cat.color, borderWidth: 2 }]}
              onPress={() => handleCat(cat.id)}
            >
              <View style={[styles.catIcon, { backgroundColor: selectedCat === cat.id ? cat.color : Colors.surfaceSecondary }]}>
                <Ionicons
                  name={cat.icon as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color={selectedCat === cat.id ? '#fff' : cat.color}
                />
              </View>
              <Text style={[styles.catLabel, selectedCat === cat.id && { color: cat.color, fontFamily: 'Inter_600SemiBold' }]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Promo banner */}
        <Pressable style={styles.promoBanner}>
          <LinearGradient colors={[Colors.primary, Colors.blue]} style={styles.promoBannerGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>🎉 Porosia e parë falas!</Text>
              <Text style={styles.promoSub}>Përdorni kodin TILIGO25 dhe merrni dërgim falas</Text>
              <View style={styles.promoCode}>
                <Text style={styles.promoCodeText}>TILIGO25</Text>
              </View>
            </View>
            <Ionicons name="gift-outline" size={64} color="rgba(255,255,255,0.2)" />
          </LinearGradient>
        </Pressable>

        {/* Shops */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCat === 'all' ? 'Të gjithë dyqanet' : CATEGORIES.find(c => c.id === selectedCat)?.label}
            </Text>
            <Text style={styles.sectionCount}>{shops.length} dyqane</Text>
          </View>

          {isLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : shops.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={56} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Asnjë dyqan nuk u gjet</Text>
              <Text style={styles.emptySub}>Provo një kategori tjetër</Text>
            </View>
          ) : (
            <View style={styles.shopList}>
              {shops.map((shop: Record<string, unknown>) => (
                <ShopCard
                  key={String(shop.id)}
                  shop={shop}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/shop/[id]', params: { id: String(shop.id) } });
                  }}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  locationBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' },
  locationText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  notifBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 26, color: Colors.text, lineHeight: 32 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    marginHorizontal: 20, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    gap: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  searchText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.textTertiary },
  searchFilter: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primaryGhost, alignItems: 'center', justifyContent: 'center' },
  catList: { paddingHorizontal: 20, gap: 12, paddingBottom: 16, paddingTop: 4 },
  catItem: { alignItems: 'center', gap: 6, width: 64, borderRadius: 12, padding: 6, borderWidth: 0, borderColor: 'transparent' },
  catIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  promoBanner: { marginHorizontal: 20, borderRadius: 18, overflow: 'hidden', marginBottom: 20, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  promoBannerGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, overflow: 'hidden' },
  promoContent: { flex: 1, gap: 6 },
  promoTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#fff' },
  promoSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  promoCode: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 4 },
  promoCodeText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff', letterSpacing: 1 },
  section: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, color: Colors.text },
  sectionCount: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  loader: { alignItems: 'center', paddingVertical: 40 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: Colors.text },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  shopList: { gap: 16 },
  shopCard: {
    backgroundColor: Colors.surface, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    overflow: 'hidden',
  },
  shopImageContainer: { width: '100%', height: 170, position: 'relative' },
  shopImage: { width: '100%', height: '100%' },
  shopImageGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  shopBadgeRow: { position: 'absolute', top: 12, left: 12 },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#fff' },
  ratingBadge: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  ratingText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#fff' },
  shopInfo: { padding: 14 },
  shopName: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.text, marginBottom: 3 },
  shopCategory: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, marginBottom: 10, textTransform: 'capitalize' },
  shopMeta: { flexDirection: 'row', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  metaChipText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textSecondary },
});
