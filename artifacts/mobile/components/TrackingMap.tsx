import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Props {
  delivLat: number;
  delivLng: number;
  custLat: number;
  custLng: number;
}

export default function TrackingMap({ delivLat, delivLng, custLat, custLng }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={28} color="rgba(255,255,255,0.7)" />
      <Text style={styles.txt}>Harta disponueshme në aplikacion mobil</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  txt: { fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', paddingHorizontal: 20 },
});
