import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const logo = require('../assets/images/tiligo-logo.jpeg');

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: object;
}

const SIZES = {
  xs: { width: 40, height: 24 },
  sm: { width: 60, height: 36 },
  md: { width: 90, height: 54 },
  lg: { width: 130, height: 78 },
  xl: { width: 180, height: 108 },
};

export default function Logo({ size = 'md', style }: LogoProps) {
  const dimensions = SIZES[size];
  return (
    <Image
      source={logo}
      style={[dimensions, styles.image, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: 4,
  },
});
