import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from './Themed';
import { useRouter } from 'expo-router';

interface SubMenuItem {
  label: string;
  route: string;
}

interface MenuItem {
  icon: string;
  label: string;
  route?: string;
  subItems?: SubMenuItem[];
}

interface SubMenuProps {
  item: MenuItem | null;
}

export default function SubMenu({ item }: SubMenuProps) {
  const router = useRouter();

  if (!item || !item.subItems) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.label}</Text>
      <View style={styles.menuList}>
        {item.subItems.map((subItem, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(subItem.route as any)}
          >
            <Text style={styles.menuText}>{subItem.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    backgroundColor: '#2b2b2b',
    height: '100%',
    borderLeftWidth: 1,
    borderLeftColor: '#1f2023',
    position: 'absolute',
    left: 60,
    top: 0,
    zIndex: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2023',
  },
  menuList: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    padding: 15,
  },
  menuText: {
    color: '#FFF',
    fontSize: 14,
  },
}); 