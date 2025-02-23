import React from 'react';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from './Themed';

interface StatCardProps {
  title: string;
  count: number;
  type: string;
  icon: string;
  color: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  onPress?: () => void;
}

export default function StatCard({ 
  title, 
  count, 
  type, 
  icon, 
  color,
  trend,
  onPress 
}: StatCardProps) {
  const cardScale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View 
        style={[
          styles.card, 
          { 
            borderLeftColor: color, 
            borderLeftWidth: 4,
            transform: [{ scale: cardScale }]
          }
        ]}
      >
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardCount}>{count}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardType}>{type}</Text>
              {trend && (
                <View style={[
                  styles.trendContainer,
                  { backgroundColor: trend.direction === 'up' ? '#E8F5E9' : '#FFEBEE' }
                ]}>
                  <MaterialCommunityIcons 
                    name={trend.direction === 'up' ? 'trending-up' : 'trending-down'} 
                    size={14} 
                    color={trend.direction === 'up' ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={[
                    styles.trendText,
                    { color: trend.direction === 'up' ? '#4CAF50' : '#F44336' }
                  ]}>
                    {trend.percentage}%
                  </Text>
                </View>
              )}
            </View>
          </View>
          <MaterialCommunityIcons 
            name={icon as any} 
            size={40} 
            color={color} 
            style={styles.cardIcon} 
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cardCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardType: {
    fontSize: 12,
    color: '#999',
  },
  cardIcon: {
    opacity: 0.8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 4,
    gap: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
}); 