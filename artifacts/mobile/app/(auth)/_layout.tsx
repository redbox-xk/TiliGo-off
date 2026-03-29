import { Stack } from "expo-router";
import { Colors } from "@/constants/colors";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="shop-login" />
      <Stack.Screen name="shop-register" />
      <Stack.Screen name="delivery-login" />
      <Stack.Screen name="delivery-register" />
    </Stack>
  );
}
