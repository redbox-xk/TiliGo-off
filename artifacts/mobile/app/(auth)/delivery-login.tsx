import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import Logo from '@/components/Logo';

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN ?? '';

export default function DeliveryLoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Gabim', 'Plotësoni të dhënat'); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://${BASE_URL}/api/delivery/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Gabim', data.error ?? 'Hyrja dështoi'); return; }
      login({ id: String(data.id), name: data.name, email: data.email, phone: data.phone, type: 'delivery' });
      router.dismiss(); router.push('/delivery-dashboard');
    } catch { Alert.alert('Gabim', 'Lidhja dështoi'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable style={styles.closeBtn} onPress={() => router.dismiss()}>
            <Ionicons name="close" size={22} color={Colors.text} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={[Colors.primary, Colors.blue]} style={styles.hero} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Logo size="md" />
            <Text style={styles.heroTitle}>Dërgues TiliGo</Text>
            <Text style={styles.heroSub}>Fitoni duke dorëzuar porosi çdo ditë në Kosovë</Text>
          </LinearGradient>
          <View style={styles.form}>
            <Text style={styles.formTitle}>Hyrja për dërguesit</Text>
            <View style={styles.field}>
              <Ionicons name="mail-outline" size={17} color={Colors.textSecondary} />
              <TextInput style={styles.input} placeholder="Email-i" placeholderTextColor={Colors.textTertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.field}>
              <Ionicons name="lock-closed-outline" size={17} color={Colors.textSecondary} />
              <TextInput style={styles.input} placeholder="Fjalëkalimi" placeholderTextColor={Colors.textTertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
              <Pressable onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={17} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Pressable style={({ pressed }) => [styles.loginBtn, pressed && { opacity: 0.9 }]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnTxt}>Hyr</Text>}
            </Pressable>
            <Pressable style={styles.registerLink} onPress={() => router.push('/(auth)/delivery-register')}>
              <Text style={styles.registerLinkTxt}>Nuk jeni regjistruar? <Text style={{ color: Colors.primary, fontFamily: 'Inter_600SemiBold' }}>Bashkohuni si dërgues</Text></Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 8, alignItems: 'flex-start' },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 40 },
  hero: { marginHorizontal: 20, borderRadius: 20, padding: 28, alignItems: 'center', gap: 10, marginBottom: 24 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#fff' },
  heroSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  form: { paddingHorizontal: 20, gap: 14 },
  formTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text, marginBottom: 4 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, gap: 10, borderWidth: 1, borderColor: Colors.border },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.text },
  loginBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 17, alignItems: 'center', shadowColor: Colors.primary, shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  loginBtnTxt: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#fff' },
  registerLink: { alignItems: 'center', paddingVertical: 4 },
  registerLinkTxt: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
});
