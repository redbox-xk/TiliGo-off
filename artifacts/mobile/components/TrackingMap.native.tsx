import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  delivLat: number;
  delivLng: number;
  custLat: number;
  custLng: number;
}

export default function TrackingMap({ delivLat, delivLng, custLat, custLng }: Props) {
  return (
    <MapView
      style={styles.map}
      initialRegion={{ latitude: delivLat, longitude: delivLng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      showsUserLocation
      showsMyLocationButton={false}
    >
      <Marker coordinate={{ latitude: delivLat, longitude: delivLng }} title="Dërguesi">
        <View style={styles.delivMarker}>
          <Ionicons name="bicycle" size={18} color="#fff" />
        </View>
      </Marker>
      <Marker coordinate={{ latitude: custLat, longitude: custLng }} title="Ju">
        <View style={styles.custMarker}>
          <Ionicons name="home" size={14} color="#fff" />
        </View>
      </Marker>
      <Circle
        center={{ latitude: custLat, longitude: custLng }}
        radius={80}
        fillColor="rgba(0,166,81,0.12)"
        strokeColor="rgba(0,166,81,0.4)"
        strokeWidth={2}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  delivMarker: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  custMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
});
