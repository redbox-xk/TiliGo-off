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

export default function ShopLoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Gabim', 'Plotësoni të gjitha fushat');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://${BASE_URL}/api/shops/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Gabim', data.error ?? 'Hyrja dështoi');
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
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.closeBtn} onPress={() => router.dismissAll()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>

        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <Ionicons name="storefront" size={40} color={Colors.secondary} />
          </View>
        </View>

        <Text style={styles.title}>Hyrja e Dyqanit</Text>
        <Text style={styles.subtitle}>Hyrni me emailin dhe fjalëkalimin tuaj</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="email@dyqani.com"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fjalëkalimi</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Fjalëkalimi juaj"
                placeholderTextColor={Colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <Pressable onPress={() => setShowPass(!showPass)}>
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.88 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Hyr</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Nuk keni llogari?</Text>
          <Pressable onPress={() => router.replace('/(auth)/shop-register')}>
            <Text style={styles.footerLink}>Regjistro dyqanin</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
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
  loginBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
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
