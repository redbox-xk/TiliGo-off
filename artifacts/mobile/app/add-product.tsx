import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { useQueryClient } from '@tanstack/react-query';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';
const CATEGORIES = ['Pica', 'Burger', 'Ushqim kryesor', 'Sallatë', 'Supë', 'Dessert', 'Pije', 'Tjera'];
const MARKUP = 1.20;

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: 'Ushqim kryesor',
    isAvailable: true, suggestions: '',
  });
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const pickImage = async () => {
    if (Platform.OS === 'web') { Alert.alert('Imazhi', 'Ngarkimi i imazheve disponueshëm vetëm në celular'); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Leje refuzuar', 'Duhet qasja në galeri'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.75, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') { await pickImage(); return; }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Leje refuzuar', 'Duhet qasja në kamerë'); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [4, 3], quality: 0.75, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) { Alert.alert('Gabim', 'Emri dhe çmimi janë të detyrueshëm'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { Alert.alert('Gabim', 'Çmimi duhet të jetë numër pozitiv'); return; }
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        shopId: user!.id,
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        category: form.category,
        isAvailable: form.isAvailable,
        suggestions: form.suggestions.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (imageBase64) body.imageBase64 = imageBase64;
      const res = await fetch(`https://${BASE_URL}/api/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Gabim', data.error ?? 'Shtimi dështoi'); return; }
      qc.invalidateQueries({ queryKey: ['products', user?.id] });
      Alert.alert('✅ Sukses!', `Produkti "${form.name}" u shtua!`, [{ text: 'OK', onPress: () => router.dismiss() }]);
    } catch { Alert.alert('Gabim', 'Lidhja dështoi'); }
    finally { setLoading(false); }
  };

  const deliveryPrice = parseFloat(form.price) > 0 ? (parseFloat(form.price) * MARKUP).toFixed(2) : '0.00';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={() => router.dismiss()}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Produkt i ri</Text>
          <Text style={styles.shopTag}>{user?.name}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Image picker */}
          <View style={styles.imageSection}>
            <Pressable style={styles.imagePicker} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={36} color={Colors.textTertiary} />
                  <Text style={styles.imagePlaceholderTxt}>Zgjidh imazh</Text>
                </View>
              )}
            </Pressable>
            <View style={styles.imageActions}>
              <Pressable style={styles.imageBtn} onPress={pickImage}>
                <Ionicons name="images-outline" size={16} color={Colors.primary} />
                <Text style={styles.imageBtnTxt}>Galeria</Text>
              </Pressable>
              <Pressable style={styles.imageBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={16} color={Colors.primary} />
                <Text style={styles.imageBtnTxt}>Kamera</Text>
              </Pressable>
            </View>
          </View>

          {/* Fields */}
          <Field icon="fast-food-outline" placeholder="Emri i produktit *" value={form.name} onChange={set('name')} />
          <View style={styles.field}>
            <Ionicons name="document-text-outline" size={16} color={Colors.textSecondary} />
            <TextInput style={[styles.input, { minHeight: 60 }]} placeholder="Përshkrimi (opsional)" placeholderTextColor={Colors.textTertiary} value={form.description} onChangeText={set('description') as (v: string) => void} multiline />
          </View>

          {/* Price with preview */}
          <View style={styles.priceGroup}>
            <View style={[styles.field, { flex: 1 }]}>
              <Ionicons name="cash-outline" size={16} color={Colors.textSecondary} />
              <TextInput style={styles.input} placeholder="Çmimi bazë (€) *" placeholderTextColor={Colors.textTertiary} value={form.price} onChangeText={set('price') as (v: string) => void} keyboardType="decimal-pad" />
            </View>
            <View style={styles.deliveryPriceCard}>
              <Text style={styles.deliveryPriceLabel}>+20% dërgim</Text>
              <Text style={styles.deliveryPriceVal}>€{deliveryPrice}</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Kategoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map(c => (
              <Pressable key={c} style={[styles.catChip, form.category === c && styles.catChipActive]} onPress={() => set('category')(c)}>
                <Text style={[styles.catChipTxt, form.category === c && styles.catChipTxtActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Field icon="add-circle-outline" placeholder="Sugjerimet (ndan me presje, p.sh. sallatë,çaj)" value={form.suggestions} onChange={set('suggestions')} />

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Disponueshëm tani</Text>
              <Text style={styles.toggleSub}>Klientët mund ta porosisin</Text>
            </View>
            <Switch value={form.isAvailable} onValueChange={set('isAvailable')} trackColor={{ true: Colors.primary }} thumbColor="#fff" />
          </View>

          <Pressable style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="add-circle" size={22} color="#fff" />
                <Text style={styles.submitTxt}>Shto produktin</Text>
              </>
            )}
          </Pressable>
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, placeholder, value, onChange }: any) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={16} color={Colors.textSecondary} />
      <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={Colors.textTertiary} value={value} onChangeText={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 16 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text, flex: 1 },
  shopTag: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary },
  form: { paddingHorizontal: 20, gap: 12, paddingBottom: 40 },
  imageSection: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  imagePicker: { width: 110, height: 90, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' },
  previewImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.surfaceSecondary },
  imagePlaceholderTxt: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.textTertiary },
  imageActions: { flex: 1, gap: 8 },
  imageBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primaryGhost, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  imageBtnTxt: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.primary },
  field: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, gap: 8, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text },
  priceGroup: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  deliveryPriceCard: { backgroundColor: Colors.primaryGhost, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center', minWidth: 80 },
  deliveryPriceLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, color: Colors.primary },
  deliveryPriceVal: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.primary },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  catRow: { gap: 8, paddingVertical: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  catChipTxt: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  catChipTxtActive: { fontFamily: 'Inter_600SemiBold', color: '#fff' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  toggleLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text },
  toggleSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: Colors.primary, shadowOffset: {width:0,height:4}, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  submitTxt: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
});
