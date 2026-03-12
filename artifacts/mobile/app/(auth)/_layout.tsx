import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="shop-login" />
      <Stack.Screen name="shop-register" />
      <Stack.Screen name="delivery-login" />
      <Stack.Screen name="delivery-register" />
    </Stack>
  );
}
