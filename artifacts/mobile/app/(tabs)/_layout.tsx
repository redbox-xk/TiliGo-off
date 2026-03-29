import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useCart } from "@/context/CartContext";
import { Colors } from "@/constants/colors";

export default function TabLayout() {
  const { totalItems } = useCart();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: Platform.OS === "android" ? 1 : 0,
          borderTopColor: Colors.border,
          backgroundColor: Platform.OS === "ios" ? "transparent" : Colors.surface,
          elevation: 0,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView intensity={98} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
          ),
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 11, marginTop: -4 },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: "Kryefaqja",
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
        ),
      }} />
      <Tabs.Screen name="search" options={{
        title: "Kërko",
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "search" : "search-outline"} size={22} color={color} />
        ),
      }} />
      <Tabs.Screen name="orders" options={{
        title: "Shporta",
        tabBarBadge: totalItems > 0 ? totalItems : undefined,
        tabBarBadgeStyle: { backgroundColor: Colors.secondary, color: "#fff", fontFamily: "Inter_700Bold" },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "bag" : "bag-outline"} size={22} color={color} />
        ),
      }} />
      <Tabs.Screen name="profile" options={{
        title: "Profili",
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
        ),
      }} />
    </Tabs>
  );
}
