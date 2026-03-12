import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

const PRODUCT_CATEGORIES = [
  'Pjata kryesore', 'Aperitiv', 'Supa', 'Sallatë', 'Pica', 'Burger',
  'Sandwich', 'Pasta', 'Sushi', 'Dëshira', 'Pije', 'Kafe', 'Tjera',
];

const COMMON_SUGGESTIONS = [
  'Ketchup', 'Mustard', 'Majonez', 'Djathë shtesë', 'Salcë pikante',
  'Pa qepë', 'Pa hudër', 'Pak kripë', 'Extra pikant', 'Pa zarzavate',
  'Bukë shtesë', 'Oliva', 'Kampionjon shtesë',
];

export default function AddProductScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Pjata kryesore',
    imageUrl: '',
    isAvailable: true,
  });
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [customSuggestion, setCustomSuggestion] = useState('');

  const update = (field: string, value: string | boolean) => setForm(p => ({ ...p, [field]: value }));

  const toggleSuggestion = (sugg: string) => {
    setSelectedSuggestions(prev =>
      prev.includes(sugg) ? prev.filter(s => s !== sugg) : [...prev, sugg]
    );
    Haptics.selectionAsync();
  };

  const addCustomSuggestion = () => {
    if (customSuggestion.trim() && !selectedSuggestions.includes(customSuggestion.trim())) {
      setSelectedSuggestions(prev => [...prev, customSuggestion.trim()]);
      setCustomSuggestion('');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      Alert.alert('Gabim', 'Emri dhe çmimi janë të detyrueshëm');
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Gabim', 'Çmimi duhet të jetë një numër pozitiv');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://${BASE_URL}/api/shops/${user?.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          price,
          category: form.category,
          imageUrl: form.imageUrl || undefined,
          isAvailable: form.isAvailable,
          suggestions: selectedSuggestions,
        }),
      });
      if (!res.ok) throw new Error('Gabim');
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await queryClient.invalidateQueries({ queryKey: ['shopProducts'] });
      router.dismiss();
    } catch {
      Alert.alert('Gabim', 'Nuk mund të shtohet produkti');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Produkt i Ri</Text>
          <Pressable style={styles.closeBtn} onPress={() => router.dismiss()}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacionet bazë</Text>
            <InputField icon="fast-food-outline" label="Emri i produktit *" placeholder="Pz. Pizza Margherita">
              <TextInput
                style={styles.input}
                placeholder="Pz. Pizza Margherita"
                placeholderTextColor={Colors.textTertiary}
                value={form.name}
                onChangeText={v => update('name', v)}
              />
            </InputField>
            <InputField icon="document-text-outline" label="Përshkrimi">
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Përshkrim i shkurtër i produktit..."
                placeholderTextColor={Colors.textTertiary}
                value={form.description}
                onChangeText={v => update('description', v)}
                multiline
                numberOfLines={3}
              />
            </InputField>
            <InputField icon="pricetag-outline" label="Çmimi (€) *">
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.textTertiary}
                value={form.price}
                onChangeText={v => update('price', v)}
                keyboardType="decimal-pad"
              />
            </InputField>
            <InputField icon="image-outline" label="URL e fotos (opcionale)">
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={Colors.textTertiary}
                value={form.imageUrl}
                onChangeText={v => update('imageUrl', v)}
                autoCapitalize="none"
              />
            </InputField>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kategoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.catRow}>
                {PRODUCT_CATEGORIES.map(cat => (
                  <Pressable
                    key={cat}
                    style={[styles.catChip, form.category === cat && styles.catChipActive]}
                    onPress={() => update('category', cat)}
                  >
                    <Text style={[styles.catText, form.category === cat && styles.catTextActive]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sugjerimet</Text>
            <Text style={styles.sectionSub}>Klientët mund të zgjedhin sugjerimet kur porosisin</Text>
            <View style={styles.suggestionsGrid}>
              {COMMON_SUGGESTIONS.map(sugg => {
                const selected = selectedSuggestions.includes(sugg);
                return (
                  <Pressable
                    key={sugg}
                    style={[styles.suggChip, selected && styles.suggChipActive]}
                    onPress={() => toggleSuggestion(sugg)}
                  >
                    {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
                    <Text style={[styles.suggText, selected && styles.suggTextActive]}>{sugg}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.customSuggRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Sugjerim i personalizuar"
                  placeholderTextColor={Colors.textTertiary}
                  value={customSuggestion}
                  onChangeText={setCustomSuggestion}
                  onSubmitEditing={addCustomSuggestion}
                />
              </View>
              <Pressable style={styles.addSuggBtn} onPress={addCustomSuggestion}>
                <Ionicons name="add" size={20} color="#fff" />
              </Pressable>
            </View>

            {selectedSuggestions.filter(s => !COMMON_SUGGESTIONS.includes(s)).map(sugg => (
              <Pressable
                key={sugg}
                style={[styles.suggChip, styles.suggChipActive]}
                onPress={() => toggleSuggestion(sugg)}
              >
                <Ionicons name="checkmark" size={12} color="#fff" />
                <Text style={styles.suggTextActive}>{sugg}</Text>
                <Ionicons name="close" size={12} color="rgba(255,255,255,0.7)" />
              </Pressable>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.availableRow}>
              <View>
                <Text style={styles.availableLabel}>I disponueshëm</Text>
                <Text style={styles.availableSub}>Klientët mund ta porosisin</Text>
              </View>
              <Switch
                value={form.isAvailable}
                onValueChange={v => update('isAvailable', v)}
                trackColor={{ false: Colors.border, true: Colors.success }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 16 }]}>
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.88 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Shto Produktin</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function InputField({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={Colors.textSecondary} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22, color: Colors.text },
  closeBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: 20, gap: 24, paddingBottom: 20 },
  section: { gap: 14 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: Colors.text },
  sectionSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary, marginTop: -8 },
  inputGroup: { gap: 8 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text },
  multilineInput: { minHeight: 70 },
  catRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  catChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  catText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  catTextActive: { color: '#fff' },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  suggChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  suggText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  suggTextActive: { color: '#fff' },
  customSuggRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addSuggBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  availableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 16 },
  availableLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  availableSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  footer: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  saveBtn: {
    backgroundColor: Colors.secondary, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
});
