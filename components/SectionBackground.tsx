import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SectionBackgroundProps {
  type: 'sea' | 'air' | 'delivery' | 'road';
}

export default function SectionBackground({ type }: SectionBackgroundProps) {
  const getIconName = () => {
    switch (type) {
      case 'sea':
        return 'ship-wheel';
      case 'air':
        return 'airplane';
      case 'delivery':
        return 'package-variant';
      case 'road':
        return 'truck';
      default:
        return 'ship-wheel';
    }
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name={getIconName()} 
        size={120} 
        color="#dae8fa" 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    opacity: 0.5,
    zIndex: 0,
  },
}); 