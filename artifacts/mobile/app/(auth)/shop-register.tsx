import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';
const CATEGORIES = ['Restorant', 'Fast Food', 'Pica', 'Kafe', 'Sushi', 'Burger', 'Sallatë', 'Tjera'];

export default function ShopRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', city: 'Prishtinë', category: 'Restorant', deliveryFee: '1.5', deliveryTime: '25-35 min', minOrder: '3' });
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { name, email, password, phone, address } = form;
    if (!name || !email || !password || !phone || !address) { Alert.alert('Gabim', 'Plotësoni të gjitha fushat e detyrueshme'); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://${BASE_URL}/api/shops/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, deliveryFee: parseFloat(form.deliveryFee) || 1.5, minOrder: parseFloat(form.minOrder) || 3 }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Gabim', data.error ?? 'Regjistrimi dështoi'); return; }
      login({ id: String(data.id), name: data.name, email: data.email, phone: data.phone, type: 'shop', shopData: { category: data.category } });
      router.dismiss(); router.push('/shop-dashboard');
    } catch { Alert.alert('Gabim', 'Lidhja dështoi'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Regjistro dyqanin</Text>
        </View>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Field icon="storefront-outline" placeholder="Emri i dyqanit *" value={form.name} onChange={set('name')} />
          <Field icon="mail-outline" placeholder="Email *" value={form.email} onChange={set('email')} keyboardType="email-address" />
          <Field icon="lock-closed-outline" placeholder="Fjalëkalimi *" value={form.password} onChange={set('password')} secureTextEntry />
          <Field icon="call-outline" placeholder="Telefoni *" value={form.phone} onChange={set('phone')} keyboardType="phone-pad" />
          <Field icon="location-outline" placeholder="Adresa *" value={form.address} onChange={set('address')} />
          <Field icon="business-outline" placeholder="Qyteti" value={form.city} onChange={set('city')} />
          <Text style={styles.fieldLabel}>Kategoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map(c => (
              <Pressable key={c} style={[styles.catChip, form.category === c && styles.catChipActive]} onPress={() => set('category')(c)}>
                <Text style={[styles.catChipTxt, form.category === c && styles.catChipTxtActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.row3}>
            <Field icon="bicycle-outline" placeholder="Tarifa €" value={form.deliveryFee} onChange={set('deliveryFee')} keyboardType="decimal-pad" small />
            <Field icon="time-outline" placeholder="Koha" value={form.deliveryTime} onChange={set('deliveryTime')} small />
            <Field icon="receipt-outline" placeholder="Min €" value={form.minOrder} onChange={set('minOrder')} keyboardType="decimal-pad" small />
          </View>
          <Pressable style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTxt}>Krijo llogarinë e dyqanit</Text>}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ icon, placeholder, value, onChange, keyboardType, secureTextEntry, small }: any) {
  return (
    <View style={[styles.field, small && styles.fieldSmall]}>
      <Ionicons name={icon} size={16} color={Colors.textSecondary} />
      <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={Colors.textTertiary} value={value} onChangeText={onChange} keyboardType={keyboardType ?? 'default'} secureTextEntry={secureTextEntry} autoCapitalize="none" />
    </View>
  );
}

const S = StyleSheet;
const styles = S.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text },
  form: { paddingHorizontal: 20, gap: 10, paddingBottom: 40 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13, gap: 8, borderWidth: 1, borderColor: Colors.border, flex: 1 },
  fieldSmall: { minWidth: 0 },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text },
  catRow: { gap: 8, paddingVertical: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  catChipTxt: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  catChipTxtActive: { fontFamily: 'Inter_600SemiBold', color: '#fff' },
  row3: { flexDirection: 'row', gap: 8 },
  submitBtn: { backgroundColor: Colors.secondary, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 8, shadowColor: Colors.secondary, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  submitTxt: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
});
