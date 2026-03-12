import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

const CATEGORIES = [
  { id: 'all', label: 'Të gjitha', icon: 'grid' },
  { id: 'restorant', label: 'Restorante', icon: 'restaurant' },
  { id: 'fast-food', label: 'Fast Food', icon: 'fast-food' },
  { id: 'pica', label: 'Pica', icon: 'pizza' },
  { id: 'kafe', label: 'Kafe', icon: 'cafe' },
  { id: 'sushi', label: 'Sushi', icon: 'fish' },
  { id: 'sallatë', label: 'Sallatë', icon: 'leaf' },
  { id: 'burger', label: 'Burger', icon: 'aperture' },
];

const SHOP_IMAGES: Record<string, string> = {
  restorant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
  'fast-food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80',
  pica: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  kafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80',
  sushi: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&q=80',
  sallatë: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
};

async function fetchShops(category?: string) {
  const url = category && category !== 'all'
    ? `https://${BASE_URL}/api/shops?category=${encodeURIComponent(category)}`
    : `https://${BASE_URL}/api/shops`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gabim në ngarkimin e dyqaneve');
  return res.json();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const { data: shops = [], isLoading, refetch } = useQuery({
    queryKey: ['shops', selectedCategory],
    queryFn: () => fetchShops(selectedCategory),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleShopPress = (shop: Record<string, unknown>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/shop/[id]', params: { id: String(shop.id) } });
  };

  const handleCategoryPress = (cat: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(cat);
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={Colors.primary} />
          <Text style={styles.locationText}>Prishtinë, Kosovë</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </View>
        <Text style={styles.greeting}>
          {user ? `Mirë se erdhe, ${user.name.split(' ')[0]}!` : 'Mirë se erdhe!'}
        </Text>
        <Text style={styles.subtitle}>Çfarë do të porosisni sot?</Text>
      </View>

      <Pressable
        style={styles.searchBar}
        onPress={() => router.push('/search')}
      >
        <Ionicons name="search" size={18} color={Colors.textTertiary} />
        <Text style={styles.searchPlaceholder}>Kërko restorante, ushqime...</Text>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive,
            ]}
            onPress={() => handleCategoryPress(cat.id)}
          >
            <Ionicons
              name={cat.icon as keyof typeof Ionicons.glyphMap}
              size={14}
              color={selectedCategory === cat.id ? Colors.textOnPrimary : Colors.textSecondary}
            />
            <Text style={[
              styles.categoryLabel,
              selectedCategory === cat.id && styles.categoryLabelActive,
            ]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.shopList}
        contentContainerStyle={styles.shopListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : shops.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={56} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Asnjë dyqan nuk u gjet</Text>
            <Text style={styles.emptySubtitle}>Provo një kategori tjetër</Text>
          </View>
        ) : (
          shops.map((shop: Record<string, unknown>) => (
            <Pressable
              key={String(shop.id)}
              style={({ pressed }) => [styles.shopCard, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
              onPress={() => handleShopPress(shop)}
            >
              <Image
                source={{ uri: String(shop.imageUrl ?? SHOP_IMAGES[String(shop.category)] ?? SHOP_IMAGES.default) }}
                style={styles.shopImage}
                contentFit="cover"
              />
              <View style={styles.shopBadge}>
                <View style={[
                  styles.openBadge,
                  { backgroundColor: shop.isOpen ? Colors.success : Colors.error }
                ]}>
                  <Text style={styles.openBadgeText}>
                    {shop.isOpen ? 'Hapur' : 'Mbyllur'}
                  </Text>
                </View>
              </View>
              <View style={styles.shopInfo}>
                <View style={styles.shopNameRow}>
                  <Text style={styles.shopName}>{String(shop.name)}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={Colors.secondary} />
                    <Text style={styles.rating}>{Number(shop.rating ?? 4.5).toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.shopCategory}>{String(shop.category ?? '')}</Text>
                <View style={styles.shopMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>{String(shop.deliveryTime ?? '25-35 min')}</Text>
                  </View>
                  <View style={styles.metaDot} />
                  <View style={styles.metaItem}>
                    <Ionicons name="bicycle-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>
                      {Number(shop.deliveryFee ?? 1.5) === 0 ? 'Falas' : `€${Number(shop.deliveryFee ?? 1.5).toFixed(2)}`}
                    </Text>
                  </View>
                  <View style={styles.metaDot} />
                  <View style={styles.metaItem}>
                    <Ionicons name="card-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.metaText}>Min. €{Number(shop.minOrder ?? 3).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  greeting: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: Colors.text,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textTertiary,
    flex: 1,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryLabelActive: {
    color: Colors.textOnPrimary,
  },
  shopList: {
    flex: 1,
  },
  shopListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  shopCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  shopImage: {
    width: '100%',
    height: 160,
  },
  shopBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  openBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  openBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },
  shopInfo: {
    padding: 14,
    gap: 4,
  },
  shopNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.text,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  rating: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.text,
  },
  shopCategory: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textTertiary,
  },
});
