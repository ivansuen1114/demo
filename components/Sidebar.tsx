import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Text } from './Themed';

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

const menuItems: MenuItem[] = [
  { 
    icon: 'view-dashboard', 
    label: 'Dashboard',
    subItems: [
      { label: 'Control Panel', route: '/dashboard/control-panel' },
      { label: 'Performance', route: '/dashboard/performance' },
      { label: 'Departure Control', route: '/dashboard/departure' },
      { label: 'Arrival Control', route: '/dashboard/arrival' },
      { label: 'Delivery Control', route: '/dashboard/delivery' },
      { label: 'ARAP Control', route: '/dashboard/arap' },
      { label: 'Station Control', route: '/dashboard/station' },
      { label: 'Market News', route: '/dashboard/news' },
      { label: 'Change Log', route: '/dashboard/changelog' },
    ]
  },
  { 
    icon: 'file-document-outline', 
    label: 'Shipping Order',
    subItems: [
      { label: 'SO Dashboard', route: '/shipping-order/dashboard' },
      { label: 'All', route: '/shipping-order/all' },
      { label: 'New', route: '/shipping-order/new' },
    ]
  },
  { 
    icon: 'truck-delivery', 
    label: 'Shipment',
    subItems: [
      { label: 'All', route: '/shipment/all' },
      { label: 'No Job#', route: '/shipment/no-job' },
      { label: 'Arrival Notice', route: '/shipment/arrival-notice' },
      { label: 'Customs Compliance', route: '/shipment/customs' },
      { label: 'Air Master Stock', route: '/shipment/air-master' },
      { label: 'New Consol.Master', route: '/shipment/new-consol' },
      { label: 'Consol.Plan', route: '/shipment/consol-plan' },
      { label: 'Label Print', route: '/shipment/label-print' },
    ]
  },
  { 
    icon: 'truck', 
    label: 'Trucking',
    subItems: [
      { label: 'Delivery Order', route: '/trucking/delivery-order' },
      { label: 'Delivery Order Status', route: '/trucking/order-status' },
      { label: 'Truck Management', route: '/trucking/truck-management' },
      { label: 'Device Management', route: '/trucking/device-management' },
      { label: 'Crew Management', route: '/trucking/crew-management' },
      { label: 'Dispatch', route: '/trucking/dispatch' },
    ]
  },
  { 
    icon: 'crosshairs-gps', 
    label: 'Tracking',
    subItems: [
      { label: 'By Air', route: '/tracking/air' },
    ]
  },
  { 
    icon: 'currency-usd', 
    label: 'Accounting',
    subItems: [
      { label: 'Performance', route: '/accounting/performance' },
      { label: 'Job Control', route: '/accounting/job-control' },
      { label: 'ARAP Control', route: '/accounting/arap' },
      { label: 'Invoice & Cost', route: '/accounting/invoice-cost' },
      { label: 'Group Invoice', route: '/accounting/group-invoice' },
      { label: 'Payment & Receipt', route: '/accounting/payment-receipt' },
      { label: 'Charge', route: '/accounting/charge' },
      { label: 'Exchange Rate', route: '/accounting/exchange-rate' },
    ]
  },
  { 
    icon: 'database', 
    label: 'Master',
    subItems: [
      { label: 'Company', route: '/master/company' },
      { label: 'User Application', route: '/master/user-application' },
      { label: 'User Maintenance', route: '/master/user-maintenance' },
    ]
  },
  { 
    icon: 'file-chart', 
    label: 'Report',
    subItems: [
      { label: 'Standard', route: '/report/standard' },
      { label: 'Customized', route: '/report/customized' },
      { label: 'Station', route: '/report/station' },
    ]
  },
];

interface SidebarProps {
  onMenuSelect?: (item: MenuItem) => void;
}

export default function Sidebar({ onMenuSelect }: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const router = useRouter();

  const handleMenuClick = (item: MenuItem, index: number) => {
    if (item.subItems) {
      setActiveMenu(activeMenu === index ? null : index);
      onMenuSelect?.(item);
    } else if (item.route) {
      router.push(item.route as any);
      setActiveMenu(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={[
              styles.menuItem,
              activeMenu === index && styles.menuItemActive
            ]}
            onPress={() => handleMenuClick(item, index)}
          >
            <MaterialCommunityIcons 
              name={item.icon as any} 
              size={24} 
              color="#FFF" 
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    backgroundColor: '#1f2023',
    height: '100%',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: 60,
  },
  menuItemActive: {
    backgroundColor: '#2b2b2b',
  },
}); 