import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';
const VEHICLES = ['Biçikletë', 'Motoçikletë', 'Veturë', 'Biçikletë elektrike'];

export default function DeliveryRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', vehicle: 'Motoçikletë' });
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    const { name, email, password, phone } = form;
    if (!name || !email || !password || !phone) { Alert.alert('Gabim', 'Plotësoni të gjitha fushat'); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://${BASE_URL}/api/delivery/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Gabim', data.error ?? 'Regjistrimi dështoi'); return; }
      login({ id: String(data.id), name: data.name, email: data.email, phone: data.phone, type: 'delivery' });
      router.dismiss(); router.push('/delivery-dashboard');
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
          <Text style={styles.title}>Bëhu dërgues</Text>
        </View>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          {[
            { icon: 'person-outline', placeholder: 'Emri i plotë *', key: 'name' },
            { icon: 'mail-outline', placeholder: 'Email *', key: 'email', type: 'email-address' },
            { icon: 'lock-closed-outline', placeholder: 'Fjalëkalimi *', key: 'password', secure: true },
            { icon: 'call-outline', placeholder: 'Nr. Telefonit *', key: 'phone', type: 'phone-pad' },
          ].map(f => (
            <View key={f.key} style={styles.field}>
              <Ionicons name={f.icon as any} size={16} color={Colors.textSecondary} />
              <TextInput style={styles.input} placeholder={f.placeholder} placeholderTextColor={Colors.textTertiary} value={form[f.key as keyof typeof form]} onChangeText={set(f.key)} keyboardType={(f.type as any) ?? 'default'} secureTextEntry={f.secure} autoCapitalize="none" />
            </View>
          ))}
          <Text style={styles.fieldLabel}>Mjeti i transportit</Text>
          <View style={styles.vehicleRow}>
            {VEHICLES.map(v => (
              <Pressable key={v} style={[styles.vChip, form.vehicle === v && styles.vChipActive]} onPress={() => set('vehicle')(v)}>
                <Text style={[styles.vChipTxt, form.vehicle === v && styles.vChipTxtActive]}>{v}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTxt}>Regjistrohu si dërgues</Text>}
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text },
  form: { paddingHorizontal: 20, gap: 10, paddingBottom: 40 },
  fieldLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13, gap: 8, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.text },
  vehicleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  vChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  vChipTxt: { fontFamily: 'Inter_400Regular', fontSize: 13, color: Colors.textSecondary },
  vChipTxtActive: { fontFamily: 'Inter_600SemiBold', color: '#fff' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 8, shadowColor: Colors.primary, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  submitTxt: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
});
