import React from 'react';
import { StyleSheet, View, ScrollView, Dimensions, Platform } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '@/components/MainLayout';
import SectionBackground from '@/components/SectionBackground';

interface StatusCardProps {
  icon: string;
  label: string;
  count: number;
  bgColor?: string;
  countStyle?: any;
  containerStyle?: any;
}

const StatusCard = ({ icon, label, count, bgColor = '#FFB020', countStyle, containerStyle }: StatusCardProps) => (
  <View style={[styles.statusCard, containerStyle]}>
    <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
      <MaterialCommunityIcons name={icon as any} size={20} color="#FFF" />
    </View>
    <View style={styles.statusContent}>
      <Text style={[styles.statusCount, countStyle]}>{count}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  </View>
);

const POControlSection = () => {
  const poStats = [
    { icon: 'file-plus', label: 'NEW PO', count: 0, bgColor: '#FFB020' },
    { icon: 'file-clock', label: 'PRODUCTION DELAY', count: 0, bgColor: '#D14343' },
    { icon: 'file-alert', label: 'CHANGE OF QTY', count: 0, bgColor: '#D14343' },
    { icon: 'file-document', label: 'PENDING PO APPROVAL', count: 0, bgColor: '#FFB020' },
    { icon: 'file-check', label: 'ACCEPTED PO', count: 0, bgColor: '#14B8A6' },
    { icon: 'file-cancel', label: 'OVERDUE PO', count: 0, bgColor: '#D14343' },
    { icon: 'file-document-alert', label: 'OVERBOOKED PO', count: 0, bgColor: '#D14343' },
    { icon: 'file-refresh', label: 'CHANGE OF CRD', count: 0, bgColor: '#D14343' },
  ];

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>PO Control</Text>
      </View>
      <View style={styles.cardGrid}>
        {poStats.map((stat, index) => (
          <StatusCard key={index} {...stat} containerStyle={styles.poCard} />
        ))}
      </View>
    </View>
  );
};

const ActiveShipmentSection = () => {
  const shipmentStats = [
    { icon: 'ship-wheel', label: 'SEA', count: 0, bgColor: '#FFB020' },
    { icon: 'airplane', label: 'AIR', count: 3, bgColor: '#00BCD4' },
    { icon: 'truck', label: 'ROAD', count: 0, bgColor: '#4CAF50' },
  ];

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Shipment</Text>
      </View>
      <View style={styles.cardGrid}>
        {shipmentStats.map((stat, index) => (
          <StatusCard key={index} {...stat} containerStyle={styles.shipmentCard} />
        ))}
      </View>
    </View>
  );
};

const ShipmentControlSection = () => {
  const sections = [
    {
      title: 'Sea Departure Control',
      type: 'sea' as const,
      stats: [
        { icon: 'clock', label: 'PENDING APPROVAL', count: 0, bgColor: '#FFB020' },
        { icon: 'ship', label: 'NOT YET DEPARTED', count: 0, bgColor: '#14B8A6' },
        { icon: 'anchor', label: 'ON WATER', count: 0, bgColor: '#666666' },
      ]
    },
    {
      title: 'Sea Arrival Control',
      type: 'sea' as const,
      stats: [
        { icon: 'anchor', label: 'ARRIVED AT POD', count: 0, bgColor: '#FFB020' },
        { icon: 'truck-delivery', label: 'DISCHARGED', count: 0, bgColor: '#14B8A6' },
        { icon: 'clock-alert', label: 'OUTGATE', count: 0, bgColor: '#D14343' },
        { icon: 'train', label: 'ON RAIL', count: 0, bgColor: '#4CAF50' },
        { icon: 'train-variant', label: 'OFF RAIL', count: 0, bgColor: '#4CAF50' },
      ]
    },
    {
      title: 'Air Control',
      type: 'air' as const,
      stats: [
        { icon: 'airplane-takeoff', label: 'DEPARTED', count: 2, bgColor: '#FFB020' },
        { icon: 'airplane-landing', label: 'ARRIVED', count: 0, bgColor: '#14B8A6' },
        { icon: 'package-variant', label: 'DELIVERED', count: 0, bgColor: '#4CAF50' },
      ]
    },
    {
      title: 'Delivery Control',
      type: 'delivery' as const,
      stats: [
        { icon: 'calendar-check', label: 'APPOINTED', count: 0, bgColor: '#FFB020' },
        { icon: 'clock-alert', label: 'OUTGATE', count: 0, bgColor: '#D14343' },
        { icon: 'truck-check', label: 'DELIVERED (ETD JAN 16 - MAR 02)', count: 0, bgColor: '#4CAF50' },
      ]
    },
    {
      title: 'Road Control',
      type: 'road' as const,
      stats: [
        { icon: 'truck', label: 'PICK UP', count: 0, bgColor: '#FFB020' },
        { icon: 'truck-delivery', label: 'DELIVERED', count: 0, bgColor: '#4CAF50' },
      ]
    },
  ];

  return (
    <View style={styles.controlsContainer}>
      {sections.map((section, index) => (
        <View key={index} style={styles.controlSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={styles.cardGrid}>
            {section.stats.map((stat, statIndex) => (
              <StatusCard key={statIndex} {...stat} containerStyle={styles.controlCard} />
            ))}
          </View>
          <SectionBackground type={section.type} />
        </View>
      ))}
    </View>
  );
};

const ExceptionalControlSection = () => {
  const exceptionalStats = [
    { icon: 'calendar-remove', label: 'NO SCHEDULE', count: 0, bgColor: '#D14343' },
    { icon: 'map-marker-remove', label: 'NO ROUTE', count: 0, bgColor: '#D14343' },
    { icon: 'clock-alert', label: 'DEPARTURE DELAYED', count: 0, bgColor: '#D14343' },
    { icon: 'file-document-alert', label: 'MISSING SHIPPING DOCUMENT', count: 2, bgColor: '#D14343' },
    { icon: 'file-remove', label: 'NO D/O', count: 0, bgColor: '#D14343' },
    { icon: 'clock-alert', label: 'NO APPOINTMENT', count: 0, bgColor: '#D14343' },
    { icon: 'alert-circle', label: 'BCI EMPTY', count: 0, bgColor: '#D14343' },
    { icon: 'train-variant-alert', label: 'PENDING ON RAIL', count: 0, bgColor: '#D14343' },
  ];

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exceptional Control</Text>
      </View>
      <View style={styles.cardGrid}>
        {exceptionalStats.map((stat, index) => (
          <StatusCard key={index} {...stat} containerStyle={styles.exceptionCard} />
        ))}
      </View>
    </View>
  );
};

export default function ControlPanelScreen() {
  const MapComponent = () => {
    if (Platform.OS === 'web') {
      return (
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d61549726.12773765!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2s!4v1710425161645!5m2!1sen!2s"
          style={{ border: 0, width: '100%', height: '400px' }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      );
    }
    return (
      <View style={styles.map}>
        <Text>Map is not available on this platform</Text>
      </View>
    );
  };

  return (
    <MainLayout 
      title="Control Panel"
      breadcrumbs={[
        { label: 'Dashboard' },
        { label: 'Control Panel' }
      ]}
    >
      <ScrollView style={styles.container}>
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Container maps</Text>
            <View style={styles.mapActions}>
              <MaterialCommunityIcons name="filter-variant" size={24} color="#666" />
              <MaterialCommunityIcons name="magnify" size={24} color="#666" />
              <MaterialCommunityIcons name="fullscreen" size={24} color="#666" />
            </View>
          </View>
          <MapComponent />
        </View>
        <POControlSection />
        <ActiveShipmentSection />
        <ShipmentControlSection />
        <ExceptionalControlSection />
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
  },
  mapContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 15,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f1f2',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  mapActions: {
    flexDirection: 'row',
    gap: 15,
  },
  map: {
    width: '100%',
    height: 400,
  },
  sectionContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 15,
    overflow: 'hidden',
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  controlSection: {
    flex: 1,
    minWidth: 300,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#f0f1f2',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cardGrid: {
    padding: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    backgroundColor: '#f8f9fa',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    padding: 10,
    gap: 10,
  },
  poCard: {
    flex: 1,
    minWidth: '23%',
  },
  shipmentCard: {
    flex: 1,
    minWidth: '30%',
  },
  controlCard: {
    flex: 1,
    minWidth: '45%',
  },
  exceptionCard: {
    flex: 1,
    minWidth: '23%',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: {
    flex: 1,
  },
  statusCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: 11,
    color: '#666',
  },
}); 