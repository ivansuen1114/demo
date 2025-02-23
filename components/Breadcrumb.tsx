import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from './Themed';
import { useRouter } from 'expo-router';

interface BreadcrumbProps {
  items: {
    label: string;
    route?: string;
  }[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.homeLink}
        onPress={() => router.push('/')}
      >
        <MaterialCommunityIcons name="home" size={16} color="#666" />
      </TouchableOpacity>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#666" />
          {item.route ? (
            <TouchableOpacity
              style={styles.link}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.linkText}>{item.label}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.currentText}>{item.label}</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  homeLink: {
    padding: 5,
  },
  link: {
    padding: 5,
  },
  linkText: {
    color: '#1976D2',
    fontSize: 14,
  },
  currentText: {
    color: '#666',
    fontSize: 14,
    padding: 5,
  },
}); 