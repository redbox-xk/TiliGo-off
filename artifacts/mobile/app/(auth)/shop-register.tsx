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

const CATEGORIES = [
  'restorant', 'fast-food', 'pica', 'kafe', 'sushi', 'sallatë', 'burger', 'ëmbëlsirë', 'pije',
];

export default function ShopRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '', category: 'restorant', address: '', city: 'Prishtinë',
    phone: '', email: '', password: '',
    deliveryTime: '25-35 min', deliveryFee: '1.5', minOrder: '3',
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.address) {
      Alert.alert('Gabim', 'Plotësoni të gjitha fushat e kërkuara');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://${BASE_URL}/api/shops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          deliveryFee: parseFloat(form.deliveryFee),
          minOrder: parseFloat(form.minOrder),
        }),
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
        type: 'shop',
        shopData: {
          category: data.category,
          address: data.address,
          city: data.city,
          deliveryFee: data.deliveryFee,
          deliveryTime: data.deliveryTime,
          isOpen: data.isOpen,
        },
      });
      router.dismissAll();
      router.push('/shop-dashboard');
    } catch (e) {
      Alert.alert('Gabim', 'Lidhja dështoi. Provo përsëri.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 },
        ]}
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

        <Text style={styles.title}>Regjistro Dyqanin</Text>
        <Text style={styles.subtitle}>Krijoni llogarinë tuaj dhe filloni të shitni</Text>

        <View style={styles.form}>
          <Field label="Emri i Dyqanit *" icon="storefront-outline">
            <TextInput
              style={styles.input}
              placeholder="Pz. Restorant Kosova"
              placeholderTextColor={Colors.textTertiary}
              value={form.name}
              onChangeText={v => update('name', v)}
            />
          </Field>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategoria *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map(cat => (
                  <Pressable
                    key={cat}
                    style={[styles.catChip, form.category === cat && styles.catChipActive]}
                    onPress={() => update('category', cat)}
                  >
                    <Text style={[styles.catText, form.category === cat && styles.catTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <Field label="Adresa *" icon="location-outline">
            <TextInput
              style={styles.input}
              placeholder="Rruga Nënë Tereza 15"
              placeholderTextColor={Colors.textTertiary}
              value={form.address}
              onChangeText={v => update('address', v)}
            />
          </Field>

          <Field label="Qyteti" icon="map-outline">
            <TextInput
              style={styles.input}
              placeholder="Prishtinë"
              placeholderTextColor={Colors.textTertiary}
              value={form.city}
              onChangeText={v => update('city', v)}
            />
          </Field>

          <Field label="Numri i Telefonit *" icon="call-outline">
            <TextInput
              style={styles.input}
              placeholder="+383 44 000 000"
              placeholderTextColor={Colors.textTertiary}
              value={form.phone}
              onChangeText={v => update('phone', v)}
              keyboardType="phone-pad"
            />
          </Field>

          <Field label="Email *" icon="mail-outline">
            <TextInput
              style={styles.input}
              placeholder="email@dyqani.com"
              placeholderTextColor={Colors.textTertiary}
              value={form.email}
              onChangeText={v => update('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          <Field label="Fjalëkalimi *" icon="lock-closed-outline">
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
          </Field>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Kohëzgjatja e dërgimit</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={form.deliveryTime}
                  onChangeText={v => update('deliveryTime', v)}
                  placeholder="25-35 min"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Tarifa (€)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={form.deliveryFee}
                  onChangeText={v => update('deliveryFee', v)}
                  keyboardType="decimal-pad"
                  placeholder="1.5"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.registerBtn, pressed && { opacity: 0.88 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerBtnText}>Regjistro Dyqanin</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Keni llogari?</Text>
          <Pressable onPress={() => router.replace('/(auth)/shop-login')}>
            <Text style={styles.footerLink}>Hyr këtu</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
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
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: { padding: 4 },
  closeBtn: { padding: 4 },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: Colors.text,
    marginTop: 24,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 28,
  },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
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
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  catText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  catTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  registerBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  registerBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.secondary,
  },
});
