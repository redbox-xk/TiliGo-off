import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

const IMG: Record<string, string> = {
  restorant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
  'fast-food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80',
  pica: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  kafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
};

const TRENDING = ['Pizza', 'Burger', 'Sushi', 'Sallatë', 'Kafe', 'Restorant'];

async function fetchAllShops() {
  const res = await fetch(`https://${BASE_URL}/api/shops`);
  if (!res.ok) throw new Error('Gabim');
  return res.json();
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: all = [], isLoading } = useQuery({ queryKey: ['shops'], queryFn: fetchAllShops });

  const results = q.trim()
    ? all.filter((s: Record<string, unknown>) =>
        [s.name, s.category, s.address, s.city].some(v =>
          String(v ?? '').toLowerCase().includes(q.toLowerCase())
        )
      )
    : [];

  const renderItem = useCallback(({ item }: { item: Record<string, unknown> }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: '/shop/[id]', params: { id: String(item.id) } });
      }}
    >
      <Image
        source={{ uri: String(item.imageUrl ?? IMG[String(item.category)] ?? IMG.default) }}
        style={styles.cardImg}
        contentFit="cover"
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{String(item.name)}</Text>
        <Text style={styles.cardCat} numberOfLines={1}>{String(item.category ?? '')} • {String(item.city ?? '')}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="star" size={11} color="#FFD700" />
          <Text style={styles.cardMetaTxt}>{Number(item.rating ?? 4.5).toFixed(1)}</Text>
          <Text style={styles.dot}>·</Text>
          <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
          <Text style={styles.cardMetaTxt}>{String(item.deliveryTime ?? '25 min')}</Text>
          <Text style={styles.dot}>·</Text>
          <Ionicons name="bicycle-outline" size={11} color={Colors.textSecondary} />
          <Text style={styles.cardMetaTxt}>€{Number(item.deliveryFee ?? 1.5).toFixed(2)}</Text>
        </View>
      </View>
      <View style={[styles.statusDot, { backgroundColor: item.isOpen ? Colors.success : Colors.error }]} />
    </Pressable>
  ), []);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Kërko</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="Restorante, produkte, kuzhina..."
            placeholderTextColor={Colors.textTertiary}
            value={q}
            onChangeText={setQ}
            autoCorrect={false}
            clearButtonMode="while-editing"
            autoFocus={false}
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      {!q.trim() ? (
        <View style={styles.trending}>
          <Text style={styles.trendLabel}>🔥 Në trend tani</Text>
          <View style={styles.trendChips}>
            {TRENDING.map(t => (
              <Pressable key={t} style={styles.trendChip} onPress={() => setQ(t)}>
                <Text style={styles.trendChipTxt}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.trendLabel2}>Të gjithë dyqanet ({all.length})</Text>
          {isLoading ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} /> : (
            <FlatList
              data={all}
              keyExtractor={i => String(i.id)}
              renderItem={renderItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={52} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>Asnjë rezultat për "{q}"</Text>
              <Text style={styles.emptySub}>Provo fjalë të tjera</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, color: Colors.text },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text },
  trending: { paddingHorizontal: 20, flex: 1 },
  trendLabel: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text, marginBottom: 12 },
  trendLabel2: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text, marginBottom: 12, marginTop: 20 },
  trendChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  trendChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.primaryGhost, borderRadius: 20 },
  trendChipTxt: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.primary },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 14,
    overflow: 'hidden', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardImg: { width: 86, height: 86 },
  cardBody: { flex: 1, padding: 12, gap: 3 },
  cardName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  cardCat: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  cardMetaTxt: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  dot: { color: Colors.textTertiary, marginHorizontal: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, color: Colors.text, textAlign: 'center' },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
});
