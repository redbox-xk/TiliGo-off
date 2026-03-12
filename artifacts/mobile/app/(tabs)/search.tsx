import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

const SHOP_IMAGES: Record<string, string> = {
  restorant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
  'fast-food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80',
  pica: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  kafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80',
  sushi: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
};

async function fetchAllShops() {
  const res = await fetch(`https://${BASE_URL}/api/shops`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const { data: allShops = [], isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: fetchAllShops,
  });

  const filtered = query.trim()
    ? allShops.filter((s: Record<string, unknown>) =>
        String(s.name ?? '').toLowerCase().includes(query.toLowerCase()) ||
        String(s.category ?? '').toLowerCase().includes(query.toLowerCase()) ||
        String(s.address ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : allShops;

  const handlePress = (shop: Record<string, unknown>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/shop/[id]', params: { id: String(shop.id) } });
  };

  const renderItem = useCallback(({ item }: { item: Record<string, unknown> }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
      onPress={() => handlePress(item)}
    >
      <Image
        source={{ uri: String(item.imageUrl ?? SHOP_IMAGES[String(item.category)] ?? SHOP_IMAGES.default) }}
        style={styles.cardImage}
        contentFit="cover"
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{String(item.name)}</Text>
        <Text style={styles.cardCategory} numberOfLines={1}>{String(item.category ?? '')}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="star" size={11} color={Colors.secondary} />
          <Text style={styles.cardMetaText}>{Number(item.rating ?? 4.5).toFixed(1)}</Text>
          <Text style={styles.cardMetaDot}>·</Text>
          <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
          <Text style={styles.cardMetaText}>{String(item.deliveryTime ?? '25 min')}</Text>
        </View>
      </View>
      <View style={[styles.statusDot, { backgroundColor: item.isOpen ? Colors.success : Colors.error }]} />
    </Pressable>
  ), []);

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Kërko</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="Restorante, ushqime, qytete..."
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={52} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>
                {query ? 'Asnjë rezultat' : 'Kërkoni dyqane'}
              </Text>
              <Text style={styles.emptySub}>
                {query ? 'Provo fjalë të tjera' : 'Shkruani emrin e dyqanit ose kategorinë'}
              </Text>
            </View>
          }
          scrollEnabled={filtered.length > 0}
        />
      )}
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
    gap: 14,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.text,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.text,
  },
  loader: {
    marginTop: 60,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  cardImage: {
    width: 80,
    height: 80,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    gap: 3,
  },
  cardName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.text,
  },
  cardCategory: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  cardMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardMetaDot: {
    color: Colors.textTertiary,
    marginHorizontal: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 14,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.text,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
