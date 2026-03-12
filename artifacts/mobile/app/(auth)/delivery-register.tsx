import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';
const VEHICLES = ['Motor', 'Biçikletë', 'Makinë', 'Këmbë'];

export default function DeliveryRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', vehicle: 'Motor',
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone) {
      Alert.alert('Gabim', 'Plotësoni të gjitha fushat e kërkuara');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://${BASE_URL}/api/delivery/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Gabim', data.error ?? 'Regjistrimi dështoi');
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      login({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        type: 'delivery',
      });
      router.dismissAll();
      router.push('/delivery-dashboard');
    } catch (e) {
      Alert.alert('Gabim', 'Lidhja dështoi. Provo përsëri.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Pressable onPress={() => router.dismissAll()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </Pressable>
        </View>

        <Text style={styles.title}>Regjistrohu si Dërgues</Text>
        <Text style={styles.subtitle}>Filloni të fitoni duke dërguar porosi</Text>

        <View style={styles.form}>
          {[
            { label: 'Emri dhe Mbiemri *', icon: 'person-outline', field: 'name', placeholder: 'Agim Berisha' },
            { label: 'Telefoni *', icon: 'call-outline', field: 'phone', placeholder: '+383 44 000 000', keyboard: 'phone-pad' },
            { label: 'Email *', icon: 'mail-outline', field: 'email', placeholder: 'email@example.com', keyboard: 'email-address', autoCapitalize: 'none' },
          ].map(({ label, icon, field, placeholder, keyboard, autoCapitalize }) => (
            <View key={field} style={styles.inputGroup}>
              <Text style={styles.label}>{label}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.textTertiary}
                  value={form[field as keyof typeof form]}
                  onChangeText={v => update(field, v)}
                  keyboardType={keyboard as 'default' | 'email-address' | 'phone-pad'}
                  autoCapitalize={autoCapitalize as 'none' | 'sentences'}
                />
              </View>
            </View>
          ))}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fjalëkalimi *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 karaktere"
                placeholderTextColor={Colors.textTertiary}
                value={form.password}
                onChangeText={v => update('password', v)}
                secureTextEntry={!showPass}
              />
              <Pressable onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mjeti i transportit</Text>
            <View style={styles.vehicleRow}>
              {VEHICLES.map(v => (
                <Pressable
                  key={v}
                  style={[styles.vehicleChip, form.vehicle === v && styles.vehicleChipActive]}
                  onPress={() => update('vehicle', v)}
                >
                  <Ionicons
                    name={v === 'Motor' ? 'bicycle' : v === 'Makinë' ? 'car' : v === 'Biçikletë' ? 'bicycle-outline' : 'walk'}
                    size={16}
                    color={form.vehicle === v ? '#fff' : Colors.textSecondary}
                  />
                  <Text style={[styles.vehicleText, form.vehicle === v && styles.vehicleTextActive]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.88 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Regjistrohu</Text>}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Keni llogari?</Text>
          <Pressable onPress={() => router.replace('/(auth)/delivery-login')}>
            <Text style={styles.footerLink}>Hyr këtu</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, paddingHorizontal: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { padding: 4 },
  closeBtn: { padding: 4 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26, color: Colors.text, marginTop: 24 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.textSecondary, marginTop: 6, marginBottom: 28 },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.text },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text },
  vehicleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  vehicleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  vehicleChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  vehicleText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.textSecondary },
  vehicleTextActive: { color: '#fff' },
  registerBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  registerBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 28 },
  footerText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  footerLink: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.primary },
});
