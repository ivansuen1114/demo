import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, ScrollView, Dimensions, TouchableOpacity, PanResponder, Animated, LayoutAnimation, Platform, UIManager, Modal, TouchableWithoutFeedback, TextInput, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '@/components/MainLayout';
import { Haptics } from '@/utils/Haptics';
import * as ExpoHaptics from 'expo-haptics';
import dayjs from 'dayjs';
import DateTimePicker, { DateTimePickerEvent, IOSMode } from '@react-native-community/datetimepicker';
import { TimeDatePicker } from 'react-native-time-date-picker';
import { Picker } from '@react-native-picker/picker';

// 添加预设名字列表
const CREW_NAMES = {
  drivers: [
    'Alex Wong',
    'Michael Chan',
    'David Lee',
    'Jason Lau',
    'Kenneth Ng',
    'Eric Cheung',
    'Tony Yip',
  ],
  leaders: [
    'Chris Tang',
    'Peter Leung',
    'Simon Ho',
    'Raymond Chow',
    'Vincent Lam',
    'Kevin Wu',
    'Gary Tsang',
  ],
  members: [
    'Andy Lai',
    'Ben Yuen',
    'Charlie Kwok',
    'Danny Fung',
    'Eddie Poon',
    'Frank Ma',
    'George Tam',
    'Henry Ip',
    'Ivan Suen',
    'Jack Cheng',
    'Keith Wong',
    'Leo Chan',
    'Mark Liu',
    'Nick Ho',
    'Oscar Ng',
  ],
};

// 添加香港电话号码生成函数
const generateHKPhoneNumber = () => {
  const prefixes = ['5', '6', '9'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+852 ${prefix}${number}`;
};

interface JobDetail {
  id: string;
  companyName: string;
  address: string;
  district: string;
  deliveryTime: string;
  isDone: boolean;
  type: 'PICK_UP' | 'DELIVERY' | null;
  isHold?: boolean;
  serviceType: 'Air-Import' | 'Air-Export' | 'Domestic' | 'Handcarry';
  pickupDate: string;
  deliveryDate: string;
  pickupCompany: {
    name: string;
    address: string;
  };
  deliveryCompany: {
    name: string;
    address: string;
  };
  remark: string;  // Required field
  pieces: number;  // 添加件数字段
  weights?: number[];  // 每件貨物的重量
  dimensions?: Array<{
    length: number;
    width: number;
    height: number;
  }>;  // 每件貨物的尺寸
  mawb?: string;
  hawb?: string;
  sealNumbers?: string[];  // Add this new property
}

interface TruckCrew {
  driver: string;
  driverPhone: string;
  leader: string;
  leaderPhone: string;
  members: Array<{
    name: string;
    phone: string;
  }>;
}

interface TruckCardProps {
  title: string;
  truckType: string;
  deviceId: string;
  insuranceValue: number;
  districts: string[];
  processedOrders: number;
  totalOrders: number;
  jobs: JobDetail[];
  isSelected: boolean;
  onSelect: () => void;
  crew?: TruckCrew;
  onCrewChange?: (crew: TruckCrew) => void;
}

const getOrderedItems = (items: JobDetail[], from: number, to: number) => {
  const newItems = [...items];
  const item = newItems.splice(from, 1)[0];
  newItems.splice(to, 0, item);
  return newItems;
};

interface DraggableJobCardProps {
  job: JobDetail;
  index: number;
  moveCard: (draggedIndex: number, hoveredIndex: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  scrollViewRef: React.RefObject<ScrollView>;
  onRemove?: () => void;  // 添加新的属性
}

const DraggableJobCard = ({ job, index, moveCard, onDragStart, onDragEnd, scrollViewRef, onRemove }: DraggableJobCardProps) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const cardRef = useRef<View>(null);
  const dragHandleRef = useRef<View>(null);
  const accumulatedDy = useRef(0);
  const cardHeight = useRef(120);
  const lastValidIndex = useRef(index);

  const isSameDay = (date1: string, date2: string) => {
    return dayjs(date1).format('YYYY-MM-DD') === dayjs(date2).format('YYYY-MM-DD');
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.body.style.cursor = isDragging ? 'none' : 'default';
    }
    return () => {
      if (Platform.OS === 'web') {
        document.body.style.cursor = 'default';
      }
    };
  }, [isDragging]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
    })
  ).current;

  const handleResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !job.isDone,
      onMoveShouldSetPanResponder: () => !job.isDone,
      onPanResponderGrant: () => {
        if (job.isDone) return;
        
        setIsDragging(true);
        onDragStart();
        pan.setValue({ x: 0, y: 0 });
        accumulatedDy.current = 0;
        lastValidIndex.current = index;
        
        cardRef.current?.measure((x, y, width, height) => {
          cardHeight.current = height;
        });
      },
      onPanResponderMove: (_, { dy }) => {
        if (job.isDone) return;

        Animated.event(
          [{ y: pan.y }],
          { useNativeDriver: false }
        )({ y: dy });

        accumulatedDy.current = dy;
        
        // Calculate target index
        const moveDistance = Math.round(dy / cardHeight.current);
        const targetIndex = Math.max(0, index + moveDistance);
        
        // Only trigger movement when target index changes
        if (targetIndex !== lastValidIndex.current) {
          lastValidIndex.current = targetIndex;
          moveCard(index, targetIndex);
          
          // Add haptic feedback
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
          }
        }

        // Auto-scroll logic
        cardRef.current?.measure((x, y, width, height) => {
          const screenHeight = Dimensions.get('window').height;
          const scrollThreshold = 50; // Scroll trigger threshold

          if (y + height - accumulatedDy.current > screenHeight - scrollThreshold) {
            // Scroll down
            scrollViewRef.current?.scrollTo({ y: y + height - screenHeight + scrollThreshold + accumulatedDy.current, animated: true });
          } else if (y - accumulatedDy.current < scrollThreshold) {
            // Scroll up
            scrollViewRef.current?.scrollTo({ y: y - scrollThreshold + accumulatedDy.current, animated: true });
          }
        });
      },
      onPanResponderRelease: () => {
        if (job.isDone) return;

        setIsDragging(false);
        onDragEnd();
        
        // Use spring animation to return to original position
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 7,
          tension: 30,
          restSpeedThreshold: 0.1,
          restDisplacementThreshold: 0.1,
        }).start();
      },
    })
  ).current;

  const cardStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
    ],
    zIndex: isDragging ? 999 : 1,
    shadowOpacity: isDragging ? 0.3 : 0.15,
    shadowRadius: isDragging ? 12 : 4,
    elevation: isDragging ? 8 : 3,
    backgroundColor: job.isDone ? '#FFF1F0' : (job.type === 'DELIVERY' ? '#FFF7E6' : '#F0F7FF'),
    borderColor: job.isDone ? '#FFA39E' : (isDragging ? '#1976D2' : (job.type === 'DELIVERY' ? '#FFB74D' : '#91CAFF')),
    opacity: job.isDone ? 0.95 : 1,
  };

  const dragHandleStyle = StyleSheet.create({
    base: {
      position: 'absolute',
      right: 10,
      top: '50%',
      transform: [{ translateY: -10 }],
      padding: 8,
      borderRadius: 4,
      backgroundColor: '#F5F5F5',
      zIndex: 1000,
    },
    dragging: {
      backgroundColor: '#E3F2FD',
    },
    webCursor: Platform.OS === 'web' ? {
      cursor: 'grab',
    } as any : {},
    webCursorDisabled: Platform.OS === 'web' ? {
      cursor: 'not-allowed',
    } as any : {},
  });

  const getStatusLabel = () => {
    if (job.isDone) {
      return { text: 'DONE', color: '#4CAF50' };
    }
    if (job.type === 'PICK_UP') {
      return { text: 'PICK UP', color: '#1976D2' };
    }
    if (job.type === 'DELIVERY') {
      return { text: 'DELIVERY', color: '#FF9800' };
    }
    return null;
  };

  const statusLabel = getStatusLabel();

  const isSamedayDelivery = ((job.type === 'PICK_UP' && job.serviceType === 'Domestic') || 
    (job.type === 'PICK_UP' && job.serviceType === 'Handcarry')) && 
    isSameDay(job.pickupDate, job.deliveryDate);

  return (
    <View>
      <JobDetailModal
        isVisible={showDetail}
        onClose={() => setShowDetail(false)}
        job={job}
      />
      {job.isHold ? (
        <View style={[styles.jobCard, styles.holdCard]}>
          <View style={[styles.statusLabel, { backgroundColor: '#FF0000', flexDirection: 'row', alignItems: 'center' }]}>
            <MaterialCommunityIcons name="alert" size={16} color="#FFF" style={{ marginRight: 5 }} />
            <Text style={styles.statusLabelText}>Hold In Truck</Text>
          </View>
          <View style={styles.jobContent}>
            <View style={styles.jobHeaderLeft}>
              <MaterialCommunityIcons name="package-variant" size={24} color="#666" />
              <Text style={styles.companyName}>{job.companyName}</Text>
            </View>
          </View>
          <View style={styles.jobContent}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
              <Text style={styles.infoLabel}>District:</Text>
              <View style={styles.districtBadge}>
                <Text style={styles.districtText}>{job.district}</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { marginTop: 4 }]}>
              <MaterialCommunityIcons name="package-variant" size={16} color="#666" />
              <Text style={styles.infoLabel}>Pieces:</Text>
              <View style={styles.piecesContainer}>
                <Text style={[styles.piecesText, styles.piecesTextHold]}>
                  {job.pieces} PCS
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="office-building" size={16} color="#666" />
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{job.address}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.infoButton, { backgroundColor: '#E3F2FD', zIndex: 100 }]}
            onPress={() => setShowDetail(true)}
          >
            <MaterialCommunityIcons name="information" size={16} color="#1976D2" />
          </TouchableOpacity>
          {onRemove && (
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={onRemove}
            >
              <MaterialCommunityIcons name="minus-circle" size={16} color="#F44336" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Animated.View
          ref={cardRef}
          {...panResponder.panHandlers}
          style={[
            styles.jobCard,
            cardStyle,
            isSamedayDelivery && styles.samedayDeliveryContainer
          ]}
        >
          {isSamedayDelivery ? (
            <>
              <View style={[styles.statusLabel, { backgroundColor: '#1976D2' }]}>
                <Text style={styles.statusLabelText}>PICK UP</Text>
                <Text style={[styles.statusLabelText, styles.serviceTypeLabel]}>
                  • {job.serviceType}
                </Text>
              </View>

              <Text style={styles.samedayWatermark}>
                {job.serviceType === 'Domestic' ? 'Sameday Delivery' : 'Sameday Handcarry'}
              </Text>

              <View style={styles.samedayContent}>
                <View style={styles.samedayHeader}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                    <Text style={styles.infoLabel}>District:</Text>
                    <View style={styles.districtBadge}>
                      <Text style={styles.districtText}>{job.district}</Text>
                    </View>
                    <View style={styles.piecesContainer}>
                      <Text style={[styles.piecesText, styles.piecesTextHighlight]}>
                        ECT {job.pieces} PCS
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.samedayTimeline}>
                  <View style={styles.samedayTimelinePoint}>
                    <View style={styles.samedayTimeIcon}>
                      <Text style={styles.samedayTimeText}>{dayjs(job.pickupDate).format('HH:mm')}</Text>
                    </View>
                    <View style={styles.samedayTimelineContent}>
                      <View style={styles.samedayTimelineCompany}>
                        <MaterialCommunityIcons name="package-variant" size={24} color="#1976D2" />
                        <Text style={styles.samedayTimelineCompanyName}>{job.pickupCompany.name}</Text>
                      </View>
                      <View style={styles.samedayTimelineHeader}>
                        <MaterialCommunityIcons name="export" size={16} color="#4CAF50" />
                        <Text style={styles.samedayTimelineTitle}>Pick up from</Text>
                        <View style={[styles.piecesContainer, { marginLeft: 'auto' }]}>
                          <Text style={[styles.piecesText, styles.piecesTextHighlight]}>
                            ECT {job.pieces} PCS
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.samedayTimelineAddress}>{job.pickupCompany.address}</Text>
                    </View>
                  </View>

                  <View style={styles.samedayTimelineConnector} />

                  <View style={styles.samedayTimelinePoint}>
                    <View style={styles.samedayTimeIcon}>
                      <Text style={styles.samedayTimeText}>{dayjs(job.deliveryDate).format('HH:mm')}</Text>
                    </View>
                    <View style={styles.samedayTimelineContent}>
                      <View style={styles.samedayTimelineCompany}>
                        <MaterialCommunityIcons name="package-variant" size={24} color="#1976D2" />
                        <Text style={styles.samedayTimelineCompanyName}>{job.deliveryCompany.name}</Text>
                      </View>
                      <View style={styles.samedayTimelineHeader}>
                        <MaterialCommunityIcons name="import" size={16} color="#F44336" />
                        <Text style={styles.samedayTimelineTitle}>Delivery to</Text>
                      </View>
                      <Text style={styles.samedayTimelineAddress}>{job.deliveryCompany.address}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <>
          {statusLabel && (
            <View style={[styles.statusLabel, { backgroundColor: statusLabel.color }]}>
              <Text style={styles.statusLabelText}>{statusLabel.text}</Text>
                  <Text style={[styles.statusLabelText, styles.serviceTypeLabel]}>
                    • {job.serviceType}
                  </Text>
            </View>
          )}
          {!job.isDone && (
            <View 
              ref={dragHandleRef}
              {...handleResponder.panHandlers}
              style={[
                dragHandleStyle.base,
                isDragging && dragHandleStyle.dragging,
                job.isDone ? dragHandleStyle.webCursorDisabled : dragHandleStyle.webCursor
              ]}
            >
              <MaterialCommunityIcons 
                name="drag" 
                size={20} 
                color={isDragging ? '#1976D2' : '#999'} 
              />
            </View>
          )}
          <View style={styles.jobContent}>
            <View style={styles.jobHeader}>
              <View style={styles.jobHeaderLeft}>
                <MaterialCommunityIcons name="package-variant" size={24} color="#1976D2" />
                <Text style={styles.companyName}>{job.companyName}</Text>
              </View>
              <View style={styles.timeContainer}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                <Text style={styles.deliveryTime}>{job.deliveryTime}</Text>
              </View>
            </View>
            <View style={styles.jobContent}>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                <Text style={[styles.infoLabel, { width: 80 }]}>District:</Text>
                <View style={styles.districtBadge}>
                  <Text style={styles.districtText}>{job.district}</Text>
                </View>
              </View>
              <View style={[styles.infoRow, { marginTop: 4 }]}>
                <MaterialCommunityIcons name="package-variant" size={16} color="#666" />
                <Text style={[styles.infoLabel, { width: 80 }]}>Pieces:</Text>
                <View style={styles.piecesContainer}>
                  <Text style={[
                    styles.piecesText,
                    job.isDone ? styles.piecesTextDone : 
                    job.isHold ? styles.piecesTextHold :
                    job.type === 'PICK_UP' ? styles.piecesTextHighlight : null
                  ]}>
                    {job.isDone ? `DONE • ${job.pieces} PCS` :
                     job.isHold ? `${job.pieces} PCS` :
                     job.type === 'PICK_UP' ? `ECT ${job.pieces} PCS` :
                     `${job.pieces} PCS`}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="office-building" size={16} color="#666" />
                <Text style={[styles.infoLabel, { width: 80 }]}>Address:</Text>
                <Text style={styles.infoValue}>{job.address}</Text>
              </View>
            </View>
          </View>
            </>
          )}
          <TouchableOpacity 
            style={[styles.infoButton, { backgroundColor: '#E3F2FD', zIndex: 100 }]}
            onPress={() => setShowDetail(true)}
          >
            <MaterialCommunityIcons name="information" size={16} color="#1976D2" />
          </TouchableOpacity>
          {onRemove && (
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={onRemove}
            >
              <MaterialCommunityIcons name="minus-circle" size={16} color="#FFF" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const TruckCard = ({
  title,
  truckType,
  deviceId,
  insuranceValue,
  districts,
  processedOrders,
  totalOrders,
  jobs,
  isSelected,
  onSelect,
  crew,
  onCrewChange,
}: TruckCardProps) => {
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [showCrewSelectModal, setShowCrewSelectModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  
  // 預設的車隊名單
  const rosterList = [
    {
      id: 'team1',
      name: 'Team No.1 (Day Shift)',
      color: '#E3F2FD',
      borderColor: '#1976D2',
      driver: 'Alex Wong',
      driverPhone: '+852 51234567',
      leader: 'Chris Tang',
      leaderPhone: '+852 61234567',
      members: [
        { name: 'Andy Lai', phone: '+852 91234567' }
      ]
    },
    {
      id: 'team2',
      name: 'Team No.2 (Normal Shift)',
      color: '#E8F5E9',
      borderColor: '#4CAF50',
      driver: 'Michael Chan',
      driverPhone: '+852 52345678',
      leader: 'Peter Leung',
      leaderPhone: '+852 62345678',
      members: [
        { name: 'Danny Fung', phone: '+852 92345678' }
      ]
    },
    {
      id: 'team3',
      name: 'Team No.3 (Night Shift)',
      color: '#FFF3E0',
      borderColor: '#FF9800',
      driver: 'David Lee',
      driverPhone: '+852 53456789',
      leader: 'Simon Ho',
      leaderPhone: '+852 63456789',
      members: [
        { name: 'George Tam', phone: '+852 93456789' },
        { name: 'Henry Ip', phone: '+852 93456790' }
      ]
    }
  ];

  // 處理車隊選擇
  const handleRosterSelect = (selectedRoster: typeof rosterList[0]) => {
    if (onCrewChange) {
      onCrewChange(selectedRoster);
    }
    setShowRosterModal(false);
    setShowCrewSelectModal(false);
  };

  // Calculate HOLD IN TRUCK count
  const holdInTruckCount = jobs.filter(job => job.isHold).length;
  // Calculate actual total (excluding HOLD IN TRUCK)
  const actualTotalOrders = totalOrders - holdInTruckCount;
  
  const getProgressColor = (processed: number, total: number) => {
    const completionRate = (processed / total) * 100;
    
    if (completionRate >= 70) return { bg: '#E8F5E9', text: '#4CAF50' }; // Green - 70% or above
    if (completionRate >= 40) return { bg: '#FFF3E0', text: '#FF9800' }; // Orange - 40-69%
    return { bg: '#FFEBEE', text: '#D32F2F' }; // Red - below 40%
  };

  const progressColors = getProgressColor(processedOrders, actualTotalOrders);
  const isFree = processedOrders === actualTotalOrders && actualTotalOrders > 0;

  return (
    <TouchableOpacity onPress={onSelect}>
      <View style={[
        styles.truckCard,
        isSelected && styles.selectedTruckCard
      ]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            {isFree && (
              <View style={styles.freeLabel}>
                <Text style={styles.freeLabelText}>FREE</Text>
              </View>
            )}
          </View>
          <View style={styles.counterContainer}>
            <View style={[styles.counter, { backgroundColor: progressColors.bg }]}>
              <Text style={styles.counterText}>Progress:</Text>
              <Text style={[styles.counterNumber, { color: progressColors.text }]}>{processedOrders}/{actualTotalOrders}</Text>
            </View>
            {holdInTruckCount > 0 && (
              <View style={[styles.counter, { backgroundColor: '#4E4E4E' }]}>
                <Text style={[styles.counterText, { color: '#FFFFFF' }]}>Hold:</Text>
                <Text style={[styles.counterNumber, { color: '#FFFFFF' }]}>{holdInTruckCount}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="truck" size={16} color="#666" />
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{truckType}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="barcode" size={16} color="#666" />
            <Text style={styles.infoLabel}>Device ID:</Text>
            <Text style={styles.infoValue}>{deviceId}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="currency-usd" size={16} color="#666" />
            <Text style={styles.infoLabel}>Insurance:</Text>
            <Text style={styles.infoValue}>${insuranceValue.toLocaleString()}</Text>
          </View>
          
          <View style={styles.districtsContainer}>
            {districts.map((district, index) => (
              <View key={index} style={styles.districtBadge}>
                <Text style={styles.districtText}>{district}</Text>
              </View>
            ))}
          </View>
          
          {crew && (
            <View style={styles.crewInfo}>
              <View style={styles.crewHeader}>
                <MaterialCommunityIcons name="account-group" size={14} color="#666" />
                <Text style={styles.crewTitle}>Crew Members</Text>
              </View>
              <View style={styles.crewDetails}>
                <View style={styles.crewMemberBlock}>
                  <View style={styles.crewIconRow}>
                    <MaterialCommunityIcons name="steering" size={12} color="#666" />
                    <Text style={styles.crewRoleLabel}>Driver</Text>
                  </View>
                  <View style={styles.crewDataRow}>
                    <Text style={styles.crewName}>{crew.driver}</Text>
                    <Text style={styles.crewPhone}>{crew.driverPhone}</Text>
                  </View>
                </View>

                <View style={styles.crewMemberBlock}>
                  <View style={styles.crewIconRow}>
                    <MaterialCommunityIcons name="shield-account" size={12} color="#666" />
                    <Text style={styles.crewRoleLabel}>Leader</Text>
                  </View>
                  <View style={styles.crewDataRow}>
                    <Text style={styles.crewName}>{crew.leader}</Text>
                    <Text style={styles.crewPhone}>{crew.leaderPhone}</Text>
                  </View>
                </View>

                {crew.members.length > 0 && (
                  <View style={styles.crewMemberBlock}>
                    <View style={styles.crewIconRow}>
                      <MaterialCommunityIcons name="account-multiple" size={12} color="#666" />
                      <Text style={styles.crewRoleLabel}>Members</Text>
                    </View>
                    <View style={styles.membersList}>
                      {crew.members.map((member, index) => (
                        <View key={index} style={styles.crewDataRow}>
                          <Text style={styles.crewName}>{member.name}</Text>
                          <Text style={styles.crewPhone}>{member.phone}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.editCrewButton}
            onPress={() => setShowCrewSelectModal(true)}
          >
            <MaterialCommunityIcons name="account-edit" size={16} color="#1976D2" />
            <Text style={styles.editCrewButtonText}>
              {crew ? 'Edit Crew' : 'Add Crew'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 選擇模式 Modal */}
        <Modal
          visible={showCrewSelectModal}
          transparent={true}
          onRequestClose={() => setShowCrewSelectModal(false)}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.crewSelectModal}>
              <View style={styles.crewSelectModalHeader}>
                <Text style={styles.crewSelectModalTitle}>Select Crew Mode</Text>
                <TouchableOpacity onPress={() => setShowCrewSelectModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.crewSelectModalContent}>
                <TouchableOpacity 
                  style={styles.crewSelectOption}
                  onPress={() => {
                    setShowRosterModal(true);
                    setShowCrewSelectModal(false);
                  }}
                >
                  <MaterialCommunityIcons name="account-group" size={24} color="#1976D2" />
                  <Text style={styles.crewSelectOptionTitle}>Select from Roster</Text>
                  <Text style={styles.crewSelectOptionDesc}>Choose from predefined crew teams</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.crewSelectOption}
                  onPress={() => {
                    setShowCrewModal(true);
                    setShowCrewSelectModal(false);
                  }}
                >
                  <MaterialCommunityIcons name="account-edit" size={24} color="#4CAF50" />
                  <Text style={styles.crewSelectOptionTitle}>Manual Edit</Text>
                  <Text style={styles.crewSelectOptionDesc}>Manually create or edit crew members</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Roster 選擇 Modal */}
        <Modal
          visible={showRosterModal}
          transparent={true}
          onRequestClose={() => setShowRosterModal(false)}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.rosterModal}>
              <View style={styles.rosterModalHeader}>
                <Text style={styles.rosterModalTitle}>Select from Roster</Text>
                <TouchableOpacity onPress={() => setShowRosterModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.rosterModalContent}>
                {rosterList.map((roster) => (
                  <TouchableOpacity 
                    key={roster.id}
                    style={[
                      styles.rosterItem,
                      { 
                        backgroundColor: roster.color,
                        borderColor: roster.borderColor
                      }
                    ]}
                    onPress={() => handleRosterSelect(roster)}
                  >
                    <View style={styles.rosterItemHeader}>
                      <MaterialCommunityIcons 
                        name="account-group" 
                        size={28} 
                        color={roster.borderColor} 
                      />
                      <Text style={[
                        styles.rosterItemTitle,
                        { color: roster.borderColor }
                      ]}>{roster.name}</Text>
                    </View>
                    
                    <View style={styles.rosterItemContent}>
                      <View style={styles.rosterMemberRow}>
                        <MaterialCommunityIcons name="steering" size={20} color={roster.borderColor} />
                        <Text style={[styles.rosterRoleText, { color: roster.borderColor, backgroundColor: `${roster.color}99` }]}>DRIVER</Text>
                        <Text style={styles.rosterMemberName}>{roster.driver}</Text>
                        <Text style={styles.rosterMemberPhone}>{roster.driverPhone}</Text>
                      </View>
                      
                      <View style={styles.rosterMemberRow}>
                        <MaterialCommunityIcons name="shield-account" size={20} color={roster.borderColor} />
                        <Text style={[styles.rosterRoleText, { color: roster.borderColor, backgroundColor: `${roster.color}99` }]}>LEADER</Text>
                        <Text style={styles.rosterMemberName}>{roster.leader}</Text>
                        <Text style={styles.rosterMemberPhone}>{roster.leaderPhone}</Text>
                      </View>
                      
                      <View style={styles.rosterMembersSection}>
                        {roster.members.map((member, index) => (
                          <View key={index} style={styles.rosterMemberRow}>
                            <MaterialCommunityIcons name="account" size={20} color={roster.borderColor} />
                            <Text style={[styles.rosterRoleText, { color: roster.borderColor, backgroundColor: `${roster.color}99` }]}>MEMBER</Text>
                            <Text style={styles.rosterMemberName}>{member.name}</Text>
                            <Text style={styles.rosterMemberPhone}>{member.phone}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* 原有的 CrewSelectionModal */}
        <CrewSelectionModal
          isVisible={showCrewModal}
          onClose={() => setShowCrewModal(false)}
          onSave={(crew: TruckCrew) => {
            if (onCrewChange) {
              onCrewChange(crew);
            }
          }}
          initialCrew={crew}
        />
      </View>
    </TouchableOpacity>
  );
};

const generateRandomTime = () => {
  const hour = Math.floor(Math.random() * (17 - 9 + 1)) + 9;
  const minute = Math.floor(Math.random() * 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const companies = [
  { name: 'Apple Store', address: '100 Plaza, Hysan Place', district: 'CWB' },
  { name: 'Nike Factory', address: '88 Queens Road', district: 'Central' },
  { name: 'Adidas HK', address: '168 Nathan Road', district: 'TST' },
  { name: 'Samsung Experience', address: '1 Harbour City', district: 'TST' },
  { name: 'Microsoft HK', address: '15 Times Square', district: 'CWB' },
  { name: 'Louis Vuitton', address: 'Shop 101, IFC Mall', district: 'Central' },
  { name: 'Gucci Flagship', address: '1881 Heritage', district: 'TST' },
  { name: 'H&M Store', address: 'Langham Place', district: 'MK' },
  { name: 'Uniqlo', address: 'APM Mall', district: 'KLB' },
];

// Add order queue sample data
const generateRandomMAWB = () => {
  const prefix = '160';
  const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}-${number}`;
};

const generateRandomHAWB = (companyPrefix: string, date: string) => {
  const dateStr = date.replace(/-/g, '').substring(0, 8);
  const number = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${companyPrefix}${dateStr}${number}`;
};

const generateRandomWeight = () => {
  return Number((15 + Math.random() * 15).toFixed(1));
};

const generateRandomDimensions = () => {
  return {
    length: Math.floor(55 + Math.random() * 30),
    width: Math.floor(35 + Math.random() * 30),
    height: Math.floor(25 + Math.random() * 20)
  };
};

const generateCargoDetails = (pieces: number) => {
  return {
    weights: Array.from({ length: pieces }, () => generateRandomWeight()),
    dimensions: Array.from({ length: pieces }, () => generateRandomDimensions()),
    sealNumbers: Array.from({ length: pieces }, () => '')
  };
};

const sampleOrdersData: JobDetail[] = [
  { 
    id: 'O001', 
    companyName: 'Nike Flagship Store', 
    address: '18 Canton Road, Tsim Sha Tsui, Kowloon, Hong Kong', 
    district: 'TST', 
    deliveryTime: '09:00', 
    type: 'DELIVERY', 
    isDone: false, 
    serviceType: 'Air-Import', 
    pickupDate: '2024-03-01', 
    deliveryDate: '2024-03-02', 
    pickupCompany: { name: 'Nike Factory', address: '88 Queens Road' }, 
    deliveryCompany: { name: 'Nike Flagship Store', address: '18 Canton Road' }, 
    remark: 'Handle with care - Premium products', 
    pieces: 10,
    ...generateCargoDetails(10),
    mawb: generateRandomMAWB(),
    hawb: generateRandomHAWB('NK', '2024-03-01')
  },
  { 
    id: 'O002', 
    companyName: 'Louis Vuitton', 
    address: '1881 Heritage Mall, 2A Canton Road, Tsim Sha Tsui, Kowloon, Hong Kong', 
    district: 'TST', 
    deliveryTime: '09:30', 
    type: 'PICK_UP', 
    isDone: false, 
    serviceType: 'Air-Export', 
    pickupDate: '2024-03-02', 
    deliveryDate: '2024-03-03', 
    pickupCompany: { name: 'Louis Vuitton', address: 'Shop 101, IFC Mall' }, 
    deliveryCompany: { name: 'Nike Flagship Store', address: '18 Canton Road' }, 
    remark: 'Luxury items - Signature required', 
    pieces: 5,
    mawb: generateRandomMAWB(),
    hawb: generateRandomHAWB('LV', '2024-03-02')
  },
  { 
    id: 'O003', 
    companyName: 'Gucci Store', 
    address: 'K11 Musea, 18 Hanoi Road, Tsim Sha Tsui, Kowloon, Hong Kong', 
    district: 'TST', 
    deliveryTime: '18:00', 
    type: 'PICK_UP', 
    isDone: false, 
    serviceType: 'Domestic', 
    pickupDate: '2024-03-03 18:00', 
    deliveryDate: '2024-03-03 19:30', 
    pickupCompany: { name: 'Gucci Store', address: 'K11 Musea, 18 Hanoi Road, Tsim Sha Tsui' }, 
    deliveryCompany: { name: 'Gucci Flagship', address: '1881 Heritage, 2A Canton Road, Tsim Sha Tsui' }, 
    remark: 'Sameday delivery - Urgent', 
    pieces: 8
  },
  { 
    id: 'O004', 
    companyName: 'Apple Store', 
    address: 'IFC Mall, 8 Finance Street, Central, Hong Kong', 
    district: 'Central', 
    deliveryTime: '10:30', 
    type: 'DELIVERY', 
    isDone: false, 
    serviceType: 'Air-Import', 
    pickupDate: '2024-03-04', 
    deliveryDate: '2024-03-05', 
    pickupCompany: { name: 'Apple Store', address: 'IFC Mall' }, 
    deliveryCompany: { name: 'Apple Store', address: '8 Finance Street' }, 
    remark: 'Electronic devices - Keep dry', 
    pieces: 7,
    ...generateCargoDetails(7),
    mawb: generateRandomMAWB(),
    hawb: generateRandomHAWB('AP', '2024-03-04')
  },
  { 
    id: 'O005', 
    companyName: 'Zara', 
    address: 'Times Square, 1 Matheson Street, Causeway Bay, Hong Kong', 
    district: 'CWB', 
    deliveryTime: '11:00', 
    type: 'DELIVERY', 
    isDone: false, 
    serviceType: 'Air-Import', 
    pickupDate: '2024-03-05', 
    deliveryDate: '2024-03-06', 
    pickupCompany: { name: 'Zara HK', address: '68 Canton Road' }, 
    deliveryCompany: { name: 'Zara', address: 'Times Square' }, 
    remark: 'Fast fashion items - Time sensitive', 
    pieces: 6,
    ...generateCargoDetails(6),
    mawb: generateRandomMAWB(),
    hawb: generateRandomHAWB('ZR', '2024-03-05')
  }
  // ... keep other sample orders but without cargo details if they are PICK_UP orders
];

// Add sort type definition
type SortType = 'processedOrders' | 'time' | 'district' | null;
type SortDirection = 'asc' | 'desc';

// Convert time string to minutes
const getMinutes = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const JobDetailModal = ({ isVisible, onClose, job }: { 
  isVisible: boolean; 
  onClose: () => void; 
  job: JobDetail 
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getServiceTypeIcon = (serviceType: string) => {
    if (serviceType.includes('Air')) return 'airplane-takeoff';
    if (serviceType === 'Domestic') return 'truck';
    return 'package-variant';
  };

  const isAirShipment = job.serviceType === 'Air-Import' || job.serviceType === 'Air-Export';
  const shouldShowCargoDetails = job.type !== 'PICK_UP' && job.weights && job.dimensions;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.detailModal,
                { transform: [{ translateY: slideAnim }] }
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <MaterialCommunityIcons 
                    name={job.type === 'DELIVERY' ? 'truck-delivery' : 'package-variant'} 
                    size={24} 
                    color="#1976D2" 
                  />
                  <Text style={styles.modalTitle}>Order Detail</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {/* Service type card */}
                <View style={styles.modalCard}>
                  <View style={styles.serviceTypeContainer}>
                    <View style={styles.serviceTypeIconContainer}>
                      <MaterialCommunityIcons 
                        name={getServiceTypeIcon(job.serviceType)}
                        size={24} 
                        color="#1976D2" 
                      />
                    </View>
                    <View style={styles.serviceTypeContent}>
                      <Text style={styles.serviceTypeTitle}>Service Type</Text>
                      <Text style={styles.serviceTypeValue}>{job.serviceType}</Text>
                    </View>
                  </View>
                </View>

                {/* Air Waybill Information */}
                {isAirShipment && (
                  <View style={[styles.modalCard, styles.airWaybillCard]}>
                    <View style={styles.airWaybillHeader}>
                      <MaterialCommunityIcons 
                        name={job.serviceType === 'Air-Import' ? 'airplane-landing' : 'airplane-takeoff'} 
                        size={24} 
                        color="#1976D2" 
                      />
                      <Text style={styles.airWaybillTitle}>Air Waybill Information</Text>
                    </View>
                    <View style={styles.airWaybillContent}>
                      <View style={styles.airWaybillRow}>
                        <Text style={styles.airWaybillLabel}>MAWB:</Text>
                        <Text style={styles.airWaybillValue}>{job.mawb || 'N/A'}</Text>
                      </View>
                      <View style={styles.airWaybillRow}>
                        <Text style={styles.airWaybillLabel}>HAWB:</Text>
                        <Text style={styles.airWaybillValue}>{job.hawb || 'N/A'}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Cargo Details */}
                {shouldShowCargoDetails && (
                  <View style={[styles.modalCard, styles.cargoDetailsCard]}>
                    <View style={styles.cargoDetailsHeader}>
                      <MaterialCommunityIcons name="package-variant" size={24} color="#1976D2" />
                      <Text style={styles.cargoDetailsTitle}>Parcel Information</Text>
                    </View>
                    <View style={styles.cargoDetailsContent}>
                      {job.weights?.map((weight, index) => (
                        <View key={index} style={styles.cargoItem}>
                          <Text style={styles.cargoItemTitle}>Item #{index + 1}</Text>
                          <View style={styles.cargoItemDetails}>
                            {job.sealNumbers?.[index] && (
                              <View style={styles.cargoSealNumber}>
                                <Text style={styles.cargoLabel}>Seal Number:</Text>
                                <Text style={styles.cargoValue}>{job.sealNumbers[index]}</Text>
                              </View>
                            )}
                            <View style={styles.cargoWeight}>
                              <Text style={styles.cargoLabel}>Weight:</Text>
                              <Text style={styles.cargoValue}>{weight} KG</Text>
                            </View>
                            {job.dimensions?.[index] && (
                              <View style={styles.cargoDimensions}>
                                <Text style={styles.cargoLabel}>Dimensions (L×W×H):</Text>
                                <Text style={styles.cargoValue}>
                                  {job.dimensions[index].length} × {job.dimensions[index].width} × {job.dimensions[index].height} CM
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Timeline card */}
                <View style={styles.modalCard}>
                  <View style={styles.timelineContainer}>
                    <View style={styles.timelineHeader}>
                      <MaterialCommunityIcons name="calendar-clock" size={24} color="#1976D2" />
                      <Text style={styles.timelineTitle}>Schedule</Text>
                    </View>
                    <View style={styles.timelinePath}>
                      <View style={styles.timelinePoint}>
                        <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]} />
                        <View style={styles.timelineInfo}>
                          <Text style={styles.timelineLabel}>Pick up</Text>
                          <Text style={styles.timelineTime}>{job.pickupDate}</Text>
                        </View>
                      </View>
                      <View style={styles.timelineVerticalLine} />
                      <View style={styles.timelinePoint}>
                        <View style={[styles.timelineDot, { backgroundColor: '#F44336' }]} />
                        <View style={styles.timelineInfo}>
                          <Text style={styles.timelineLabel}>Delivery</Text>
                          <Text style={styles.timelineTime}>{job.deliveryDate}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Address information card */}
                <View style={styles.addressCardsContainer}>
                  <View style={[styles.modalCard, styles.addressCard]}>
                    <View style={styles.addressHeader}>
                      <MaterialCommunityIcons name="export" size={24} color="#4CAF50" />
                      <Text style={styles.addressTitle}>Pick up from</Text>
                    </View>
                    <View style={styles.addressContent}>
                      <Text style={styles.companyNameLarge}>{job.pickupCompany.name}</Text>
                      <View style={styles.addressRow}>
                        <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
                        <Text style={styles.addressText}>{job.pickupCompany.address}</Text>
                      </View>
                    </View>
                  </View>

                  <MaterialCommunityIcons 
                    name="arrow-right" 
                    size={24} 
                    color="#1976D2" 
                    style={styles.addressArrow}
                  />

                  <View style={[styles.modalCard, styles.addressCard]}>
                    <View style={styles.addressHeader}>
                      <MaterialCommunityIcons name="import" size={24} color="#F44336" />
                      <Text style={styles.addressTitle}>Delivery to</Text>
                    </View>
                    <View style={styles.addressContent}>
                      <Text style={styles.companyNameLarge}>{job.deliveryCompany.name}</Text>
                      <View style={styles.addressRow}>
                        <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
                        <Text style={styles.addressText}>{job.deliveryCompany.address}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Separator */}
                {job.remark && <View style={styles.modalDivider} />}

                {/* Remarks card */}
                {job.remark && (
                  <View style={[styles.modalCard, styles.remarkCard]}>
                    <View style={styles.remarkHeader}>
                      <MaterialCommunityIcons name="note-text" size={24} color="#FF9800" />
                      <Text style={styles.remarkTitle}>Remark</Text>
                    </View>
                    <Text style={styles.remarkText}>{job.remark}</Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

interface AddOrderModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAddOrder: (order: JobDetail) => void;
}

// Add district options
const HK_DISTRICTS = [
  'Central & Western',
  'Wan Chai',
  'Eastern',
  'Southern',
  'Yau Tsim Mong',
  'Sham Shui Po',
  'Kowloon City',
  'Wong Tai Sin',
  'Kwun Tong',
  'Tsuen Wan',
  'Tuen Mun',
  'Yuen Long',
  'North',
  'Tai Po',
  'Sai Kung',
  'Sha Tin',
  'Kwai Tsing',
  'Islands'
];

interface DistrictModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (district: string) => void;
  currentDistrict?: string;
}

const DistrictModal = ({ isVisible, onClose, onSelect, currentDistrict }: DistrictModalProps) => {
  const [customDistrict, setCustomDistrict] = useState('');

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      onRequestClose={onClose}
      animationType="fade"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.districtModal}>
              <View style={styles.districtModalHeader}>
                <Text style={styles.districtModalTitle}>Select District</Text>
                <TouchableOpacity onPress={onClose}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.districtGrid}>
                {HK_DISTRICTS.map((district) => (
                  <TouchableOpacity
                    key={district}
                    style={[
                      styles.districtGridItem,
                      district === currentDistrict && styles.districtGridItemSelected
                    ]}
                    onPress={() => {
                      onSelect(district);
                      onClose();
                    }}
                  >
                    <Text style={[
                      styles.districtGridItemText,
                      district === currentDistrict && styles.districtGridItemTextSelected
                    ]}>
                      {district}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.customDistrictSection}>
                <Text style={styles.customDistrictLabel}>Custom District</Text>
                <View style={styles.customDistrictInput}>
                  <TextInput
                    style={styles.input}
                    value={customDistrict}
                    onChangeText={setCustomDistrict}
                    placeholder="Enter custom district"
                  />
                  <TouchableOpacity
                    style={styles.customDistrictButton}
                    onPress={() => {
                      if (customDistrict.trim()) {
                        onSelect(customDistrict.trim());
                        onClose();
                      }
                    }}
                  >
                    <Text style={styles.customDistrictButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const AddOrderModal = ({ isVisible, onClose, onAddOrder }: AddOrderModalProps) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));

  const [formData, setFormData] = useState<Partial<JobDetail>>({
    type: 'PICK_UP',
    serviceType: 'Domestic',
    isDone: false,
    isHold: false,
    pickupCompany: {
      name: '',
      address: '',
    },
    deliveryCompany: {
      name: '',
      address: '',
    },
    pieces: 0,
    weights: [],
    dimensions: [],
    sealNumbers: [],
    mawb: '',
    hawb: '',
    remark: ''
  });

  const [pickupDate, setPickupDate] = useState(dayjs());
  const [deliveryDate, setDeliveryDate] = useState(dayjs());
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [showPickupDistrictModal, setShowPickupDistrictModal] = useState(false);
  const [showDeliveryDistrictModal, setShowDeliveryDistrictModal] = useState(false);
  const [pickupDistrict, setPickupDistrict] = useState('');
  const [deliveryDistrict, setDeliveryDistrict] = useState('');

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  const handleSubmit = () => {
    const isAirShipment = formData.serviceType === 'Air-Import' || formData.serviceType === 'Air-Export';
    const companyPrefix = formData.type === 'PICK_UP' ? 
      formData.pickupCompany?.name?.substring(0, 2).toUpperCase() : 
      formData.deliveryCompany?.name?.substring(0, 2).toUpperCase();

    const newOrder: JobDetail = {
      id: `O${Math.random().toString(36).substr(2, 9)}`,
      companyName: formData.type === 'PICK_UP' ? formData.pickupCompany?.name || '' : formData.deliveryCompany?.name || '',
      address: formData.type === 'PICK_UP' ? formData.pickupCompany?.address || '' : formData.deliveryCompany?.address || '',
      district: formData.isHold ? pickupDistrict : (formData.type === 'PICK_UP' ? pickupDistrict : deliveryDistrict),
      deliveryTime: dayjs(pickupDate).format('HH:mm'),
      type: formData.isHold ? null : (formData.type || 'PICK_UP'),
      isDone: false,
      isHold: formData.isHold || false,
      serviceType: formData.serviceType || 'Domestic',
      pickupDate: pickupDate.format('YYYY-MM-DD HH:mm'),
      deliveryDate: deliveryDate.format('YYYY-MM-DD HH:mm'),
      pickupCompany: {
        name: formData.pickupCompany?.name || '',
        address: formData.pickupCompany?.address || '',
      },
      deliveryCompany: {
        name: formData.deliveryCompany?.name || '',
        address: formData.deliveryCompany?.address || '',
      },
      remark: formData.remark || '',
      pieces: formData.pieces || 0,
      // Add cargo details
      weights: formData.weights || [],
      dimensions: formData.dimensions || [],
      sealNumbers: formData.sealNumbers || [],
      // Add air waybill information for air shipments
      ...(isAirShipment && {
        mawb: formData.mawb || generateRandomMAWB(),
        hawb: formData.hawb || generateRandomHAWB(companyPrefix || 'XX', pickupDate.format('YYYY-MM-DD'))
      })
    };

    onAddOrder(newOrder);
    
    // Reset form data
    setFormData({
      type: 'PICK_UP',
      serviceType: 'Domestic',
      isDone: false,
      isHold: false,
      pickupCompany: {
        name: '',
        address: '',
      },
      deliveryCompany: {
        name: '',
        address: '',
      },
      pieces: 0,
      weights: [],
      dimensions: [],
      sealNumbers: [],
      mawb: '',
      hawb: '',
      remark: ''
    });
    setPickupDistrict('');
    setDeliveryDistrict('');
    setPickupDate(dayjs());
    setDeliveryDate(dayjs());
    onClose();
  };

  const handleServiceTypeChange = (type: 'Air-Import' | 'Air-Export' | 'Domestic' | 'Handcarry') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFormData(prev => ({
      ...prev,
      serviceType: type
    }));
  };

  const handlePickupCompanyChange = (field: 'name' | 'address', value: string) => {
    setFormData(prev => ({
      ...prev,
      pickupCompany: {
        name: field === 'name' ? value : (prev.pickupCompany?.name || ''),
        address: field === 'address' ? value : (prev.pickupCompany?.address || ''),
      }
    }));
  };

  const handleDeliveryCompanyChange = (field: 'name' | 'address', value: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryCompany: {
        name: field === 'name' ? value : (prev.deliveryCompany?.name || ''),
        address: field === 'address' ? value : (prev.deliveryCompany?.address || ''),
      }
    }));
  };

  const handleOrderTypeChange = (newType: 'PICK_UP' | 'DELIVERY' | null, isHoldInTruck: boolean = false) => {
    setFormData(prev => ({
      ...prev,
      type: isHoldInTruck ? 'DELIVERY' : newType,  // 修改這裡，當 isHoldInTruck 為 true 時，保持 type 為 'DELIVERY'
      isHold: isHoldInTruck,
    }));
  };

  const handleWeightChange = (index: number, value: string) => {
    // 允許輸入數字和小數點，並處理多個小數點的情況
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const weight = parseFloat(value) || 0;
      setFormData(prev => {
        const newWeights = [...(prev.weights || [])];
        newWeights[index] = weight;
        return {
          ...prev,
          weights: newWeights
        };
      });
    }
  };

  const handleDimensionChange = (index: number, dimension: 'length' | 'width' | 'height', value: string) => {
    const dimensionValue = parseFloat(value) || 0;
    setFormData(prev => {
      const newDimensions = [...(prev.dimensions || [])];
      if (!newDimensions[index]) {
        newDimensions[index] = { length: 0, width: 0, height: 0 };
      }
      newDimensions[index] = {
        ...newDimensions[index],
        [dimension]: dimensionValue
      };
      return {
        ...prev,
        dimensions: newDimensions
      };
    });
  };

  const formatMAWB = (value: string) => {
    // 移除所有非數字字符
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) {
      return numbers;
    }
    // 格式化為 XXX-XXXXXXXX
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 11)}`;
  };

  const handleMAWBChange = (value: string) => {
    const formattedValue = formatMAWB(value);
    setFormData(prev => ({
      ...prev,
      mawb: formattedValue
    }));
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.addOrderModal,
                { transform: [{ translateY: slideAnim }] }
              ]}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <MaterialCommunityIcons name="plus-circle" size={24} color="#4CAF50" />
                  <Text style={styles.modalTitle}>Add #DEMO# New Order</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.addOrderForm}>
                {/* Basic Information */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Order Type</Text>
                    <View style={styles.radioGroup}>
                      <TouchableOpacity
                        style={[
                          styles.radioButton,
                          formData.type === 'PICK_UP' && styles.radioButtonSelected
                        ]}
                        onPress={() => handleOrderTypeChange('PICK_UP')}
                      >
                        <Text style={[
                          styles.radioButtonText,
                          formData.type === 'PICK_UP' && styles.radioButtonTextSelected
                        ]}>Pick Up</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.radioButton,
                          formData.type === 'DELIVERY' && !formData.isHold && styles.radioButtonSelected
                        ]}
                        onPress={() => handleOrderTypeChange('DELIVERY')}
                      >
                        <Text style={[
                          styles.radioButtonText,
                          formData.type === 'DELIVERY' && !formData.isHold && styles.radioButtonTextSelected
                        ]}>Delivery</Text>
                      </TouchableOpacity>
                      {formData.type === 'DELIVERY' && (
                        <TouchableOpacity
                          style={[
                            styles.radioButton,
                            formData.isHold && styles.holdInTruckButton,
                            formData.serviceType === 'Air-Export' && { opacity: 0.5 }
                          ]}
                          onPress={() => {
                            if (formData.serviceType !== 'Air-Export') {
                              handleOrderTypeChange('DELIVERY', !formData.isHold);  // 修改這裡，保持 type 為 'DELIVERY'
                            }
                          }}
                          disabled={formData.serviceType === 'Air-Export'}
                        >
                          <MaterialCommunityIcons 
                            name="truck-check" 
                            size={16} 
                            color={formData.isHold ? '#FF0000' : '#666'} 
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[
                            styles.radioButtonText,
                            formData.isHold && styles.holdInTruckButtonText,
                            formData.serviceType === 'Air-Export' && { color: '#999' }
                          ]}>Hold In Truck</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Service Type</Text>
                    <View style={styles.radioGroup}>
                      {['Domestic', 'Handcarry', 'Air-Import', 'Air-Export'].map((type) => {
                        const isDisabled = formData.isHold && type === 'Air-Export';
                        return (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.radioButton,
                              formData.serviceType === type && styles.radioButtonSelected,
                              isDisabled && { opacity: 0.5 }
                            ]}
                            onPress={() => {
                              if (!isDisabled) {
                                handleServiceTypeChange(type as 'Air-Import' | 'Air-Export' | 'Domestic' | 'Handcarry');
                                // 如果選擇了 Air-Export，取消 Hold In Truck
                                if (type === 'Air-Export' && formData.isHold) {
                                  setFormData(prev => ({
                                    ...prev,
                                    isHold: false,
                                    type: 'DELIVERY'
                                  }));
                                }
                              }
                            }}
                            disabled={isDisabled}
                          >
                            <Text style={[
                              styles.radioButtonText,
                              formData.serviceType === type && styles.radioButtonTextSelected,
                              isDisabled && { color: '#999' }
                            ]}>{type}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>
                      {formData.type === 'PICK_UP' ? 'Estimated Pieces' : 'Pieces'}
                    </Text>
                    <View style={styles.piecesInputContainer}>
                      <TextInput
                        style={styles.piecesInput}
                        value={formData.pieces?.toString() || ''}
                        onChangeText={(text) => {
                          const pieces = parseInt(text) || 0;
                          if (pieces >= 0 && pieces <= 100) {
                            // 更新 pieces 時同時初始化對應數量的重量和尺寸數組
                            setFormData(prev => ({
                              ...prev,
                              pieces,
                              weights: Array(pieces).fill(0),
                              dimensions: Array(pieces).fill({ length: 0, width: 0, height: 0 })
                            }));
                          }
                        }}
                        keyboardType="numeric"
                        placeholder={formData.type === 'PICK_UP' ? "0-100" : "0-100"}
                        maxLength={3}
                      />
                      <View style={[
                        styles.piecesLabel,
                        formData.type === 'PICK_UP' ? styles.piecesLabelHighlight : null
                      ]}>
                        <Text style={[
                          styles.piecesLabelText,
                          formData.type === 'PICK_UP' ? styles.piecesLabelTextHighlight : null
                        ]}>
                          {formData.type === 'PICK_UP' ? 'ECT PCS' : 'PCS'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Air Waybill Information (如果需要) */}
                {(formData.serviceType === 'Air-Import' || formData.serviceType === 'Air-Export') && (
                  <View style={[styles.formSection, styles.airwayBillSection]}>
                    <View style={styles.airwayBillHeader}>
                      <View style={styles.airwayBillHeaderLeft}>
                        <MaterialCommunityIcons name="airplane" size={20} color="#1976D2" />
                        <Text style={styles.airwayBillTitle}>Air Waybill Information</Text>
                      </View>
                      <MaterialCommunityIcons 
                        name={formData.serviceType === 'Air-Import' ? 'airplane-landing' : 'airplane-takeoff'} 
                        size={24} 
                        color="#90CAF9" 
                      />
                    </View>
                    
                    <View style={styles.airwayBillContent}>
                      <View style={styles.airwayBillField}>
                        <Text style={styles.airwayBillLabel}>MAWB</Text>
                        <View style={styles.airwayBillInputContainer}>
                          <MaterialCommunityIcons name="barcode" size={20} color="#90CAF9" style={styles.airwayBillIcon} />
                          <TextInput
                            style={styles.airwayBillInput}
                            value={formData.mawb}
                            onChangeText={handleMAWBChange}
                            placeholder="XXX-XXXXXXXX"
                            maxLength={12}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                      
                      <View style={styles.airwayBillField}>
                        <Text style={styles.airwayBillLabel}>HAWB</Text>
                        <View style={styles.airwayBillInputContainer}>
                          <MaterialCommunityIcons name="file-document-outline" size={20} color="#90CAF9" style={styles.airwayBillIcon} />
                          <TextInput
                            style={styles.airwayBillInput}
                            value={formData.hawb}
                            onChangeText={(value) => setFormData(prev => ({ ...prev, hawb: value }))}
                            placeholder="Optional"
                            maxLength={20}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Pick Up & Delivery Information */}
                <View style={styles.formRow}>
                  <View style={styles.formColumn}>
                    <View style={[styles.formSection, styles.formSectionCard]}>
                      <View style={styles.formSectionHeader}>
                        <MaterialCommunityIcons name="export" size={20} color="#4CAF50" />
                        <Text style={[styles.sectionTitle, styles.sectionTitleWithIcon]}>Pick Up Information</Text>
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Company Name</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.pickupCompany?.name}
                          onChangeText={(text) => handlePickupCompanyChange('name', text)}
                          placeholder="Enter pick up company name"
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Address</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={formData.pickupCompany?.address}
                          onChangeText={(text) => handlePickupCompanyChange('address', text)}
                          placeholder="Enter pick up address"
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <TouchableOpacity
                          style={styles.districtButton}
                          onPress={() => setShowPickupDistrictModal(true)}
                        >
                          <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
                          <Text style={styles.districtButtonText}>
                            {pickupDistrict || 'Select District'}
                          </Text>
                          <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Pick Up Time</Text>
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => setShowPickupDatePicker(true)}
                        >
                          <MaterialCommunityIcons name="calendar-clock" size={20} color="#666" />
                          <Text style={styles.datePickerButtonText}>
                            {pickupDate.format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.formColumn}>
                    <View style={[styles.formSection, styles.formSectionCard]}>
                      <View style={styles.formSectionHeader}>
                        <MaterialCommunityIcons name="import" size={20} color="#FF9800" />
                        <Text style={[styles.sectionTitle, styles.sectionTitleWithIcon]}>Delivery Information</Text>
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Company Name</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.deliveryCompany?.name}
                          onChangeText={(text) => handleDeliveryCompanyChange('name', text)}
                          placeholder="Enter delivery company name"
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Address</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={formData.deliveryCompany?.address}
                          onChangeText={(text) => handleDeliveryCompanyChange('address', text)}
                          placeholder="Enter delivery address"
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                      <View style={styles.formGroup}>
                        <TouchableOpacity
                          style={styles.districtButton}
                          onPress={() => setShowDeliveryDistrictModal(true)}
                        >
                          <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
                          <Text style={styles.districtButtonText}>
                            {deliveryDistrict || 'Select District'}
                          </Text>
                          <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Delivery Time</Text>
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => setShowDeliveryDatePicker(true)}
                        >
                          <MaterialCommunityIcons name="calendar-clock" size={20} color="#666" />
                          <Text style={styles.datePickerButtonText}>
                            {deliveryDate.format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Remarks */}
                <View style={[styles.formSection, styles.formSectionCard]}>
                  <View style={styles.formSectionHeader}>
                    <MaterialCommunityIcons name="note-text" size={20} color="#FF9800" />
                    <Text style={[styles.sectionTitle, styles.sectionTitleWithIcon]}>Remarks</Text>
                  </View>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.remark}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, remark: text }))}
                    placeholder="Enter order remarks"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.footerButton, styles.submitButton]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>

              <DistrictModal
                isVisible={showPickupDistrictModal}
                onClose={() => setShowPickupDistrictModal(false)}
                onSelect={setPickupDistrict}
                currentDistrict={pickupDistrict}
              />

              <DistrictModal
                isVisible={showDeliveryDistrictModal}
                onClose={() => setShowDeliveryDistrictModal(false)}
                onSelect={setDeliveryDistrict}
                currentDistrict={deliveryDistrict}
              />

              {/* 日期選擇器模態框 */}
              {showPickupDatePicker && (
                <View style={styles.dateTimePickerOverlay}>
                  <View style={styles.dateTimePickerContainer}>
                    <View style={styles.dateTimePickerHeader}>
                      <Text style={styles.dateTimePickerTitle}>Select Pickup Time</Text>
                      <TouchableOpacity 
                        onPress={() => setShowPickupDatePicker(false)}
                        style={styles.closeButton}
                      >
                        <MaterialCommunityIcons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.webDateTimePickerContainer}>
                      <input
                        type="datetime-local"
                        value={pickupDate.format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => {
                          const newDate = dayjs(e.target.value);
                          if (newDate.isValid()) {
                            setPickupDate(newDate);
                          }
                        }}
                        min={dayjs().format('YYYY-MM-DDTHH:mm')}
                        style={styles.webDateTimePicker}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setShowPickupDatePicker(false)}
                    >
                      <Text style={styles.modalButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {showDeliveryDatePicker && (
                <View style={styles.dateTimePickerOverlay}>
                  <View style={styles.dateTimePickerContainer}>
                    <View style={styles.dateTimePickerHeader}>
                      <Text style={styles.dateTimePickerTitle}>Select Delivery Time</Text>
                      <TouchableOpacity 
                        onPress={() => setShowDeliveryDatePicker(false)}
                        style={styles.closeButton}
                      >
                        <MaterialCommunityIcons name="close" size={24} color="#666" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.webDateTimePickerContainer}>
                      <input
                        type="datetime-local"
                        value={deliveryDate.format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => {
                          const newDate = dayjs(e.target.value);
                          if (newDate.isValid()) {
                            setDeliveryDate(newDate);
                          }
                        }}
                        min={pickupDate.format('YYYY-MM-DDTHH:mm')}
                        style={styles.webDateTimePicker}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setShowDeliveryDatePicker(false)}
                    >
                      <Text style={styles.modalButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {(formData.pieces ?? 0) > 0 && (
                <View style={styles.measurementsContainer}>
                  <Text style={styles.measurementsTitle}>Parcel Information</Text>
                  <ScrollView style={styles.measurementsScrollView}>
                    {Array.from({ length: formData.pieces ?? 0 }).map((_, index) => (
                      <View key={index} style={styles.measurementItem}>
                        <Text style={styles.measurementItemTitle}>Item #{index + 1}</Text>
                        
                        <View style={styles.measurementRow}>
                          <View style={styles.sealNumberContainer}>
                            <Text style={styles.measurementLabel}>Seal Number</Text>
                            <TextInput
                              style={styles.sealNumberInput}
                              value={formData.sealNumbers?.[index] || ''}
                              onChangeText={(text) => {
                                setFormData(prev => {
                                  const newSealNumbers = [...(prev.sealNumbers || [])];
                                  newSealNumbers[index] = text;
                                  return {
                                    ...prev,
                                    sealNumbers: newSealNumbers
                                  };
                                });
                              }}
                              placeholder="Enter seal number"
                            />
                          </View>
                          
                          <View style={styles.weightContainer}>
                            <Text style={styles.measurementLabel}>Weight (KG)</Text>
                            <TextInput
                              style={styles.measurementInput}
                              value={formData.weights?.[index]?.toString() || ''}
                              onChangeText={(text) => handleWeightChange(index, text)}
                              keyboardType="decimal-pad"
                              placeholder="0.0"
                              maxLength={7}
                            />
                          </View>
                          
                          <View style={styles.dimensionsContainer}>
                            <Text style={styles.measurementLabel}>Dimensions (CM)</Text>
                            <View style={styles.dimensionsInputRow}>
                              <TextInput
                                style={styles.dimensionInput}
                                value={formData.dimensions?.[index]?.length?.toString() || ''}
                                onChangeText={(text) => handleDimensionChange(index, 'length', text)}
                                keyboardType="numeric"
                                placeholder="L"
                                maxLength={3}
                              />
                              <Text style={styles.dimensionSeparator}>×</Text>
                              <TextInput
                                style={styles.dimensionInput}
                                value={formData.dimensions?.[index]?.width?.toString() || ''}
                                onChangeText={(text) => handleDimensionChange(index, 'width', text)}
                                keyboardType="numeric"
                                placeholder="W"
                                maxLength={3}
                              />
                              <Text style={styles.dimensionSeparator}>×</Text>
                              <TextInput
                                style={styles.dimensionInput}
                                value={formData.dimensions?.[index]?.height?.toString() || ''}
                                onChangeText={(text) => handleDimensionChange(index, 'height', text)}
                                keyboardType="numeric"
                                placeholder="H"
                                maxLength={3}
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// 添加 CrewSelectionModal 组件
const CrewSelectionModal = ({ 
  isVisible, 
  onClose, 
  onSave,
  initialCrew,
}: { 
  isVisible: boolean; 
  onClose: () => void;
  onSave: (crew: TruckCrew) => void;
  initialCrew?: TruckCrew;
}) => {
  const [driver, setDriver] = useState(initialCrew?.driver || '');
  const [driverPhone, setDriverPhone] = useState(initialCrew?.driverPhone || '');
  const [leader, setLeader] = useState(initialCrew?.leader || '');
  const [leaderPhone, setLeaderPhone] = useState(initialCrew?.leaderPhone || '');
  const [members, setMembers] = useState<Array<{ name: string; phone: string }>>(
    initialCrew?.members || []
  );

  // 重置表单
  useEffect(() => {
    if (isVisible) {
      setDriver(initialCrew?.driver || '');
      setDriverPhone(initialCrew?.driverPhone || '');
      setLeader(initialCrew?.leader || '');
      setLeaderPhone(initialCrew?.leaderPhone || '');
      setMembers(initialCrew?.members || []);
    }
  }, [isVisible, initialCrew]);

  const handleDriverSelect = (name: string) => {
    setDriver(name);
    setDriverPhone(name ? generateHKPhoneNumber() : '');
  };

  const handleLeaderSelect = (name: string) => {
    setLeader(name);
    setLeaderPhone(name ? generateHKPhoneNumber() : '');
  };

  const handleAddMember = () => {
    setMembers([...members, { name: '', phone: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const handleMemberSelect = (index: number, name: string) => {
    const newMembers = [...members];
    newMembers[index] = {
      name,
      phone: name ? generateHKPhoneNumber() : ''
    };
    setMembers(newMembers);
  };

  const handleSave = () => {
    // 只保存有名字的队员
    const validMembers = members.filter(m => m.name.trim() !== '');
    onSave({
      driver,
      driverPhone,
      leader,
      leaderPhone,
      members: validMembers,
    });
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.crewModal}>
          <View style={styles.crewModalHeader}>
            <Text style={styles.crewModalTitle}>Edit Crew Members</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.crewModalContent}>
            <View style={styles.crewInputGroup}>
              <Text style={styles.crewInputLabel}>Driver</Text>
              <View style={styles.crewInputRow}>
                <View style={styles.crewSelectContainer}>
                  <Picker
                    selectedValue={driver}
                    onValueChange={handleDriverSelect}
                    style={styles.crewSelect}
                  >
                    <Picker.Item label="Select Driver" value="" />
                    {CREW_NAMES.drivers
                      .filter(name => name !== leader && !members.some(m => m.name === name))
                      .map((name) => (
                        <Picker.Item key={name} label={name} value={name} />
                      ))}
                  </Picker>
                </View>
                {driverPhone && (
                  <Text style={styles.phoneNumber}>{driverPhone}</Text>
                )}
              </View>
            </View>

            <View style={styles.crewInputGroup}>
              <Text style={styles.crewInputLabel}>Leader</Text>
              <View style={styles.crewInputRow}>
                <View style={styles.crewSelectContainer}>
                  <Picker
                    selectedValue={leader}
                    onValueChange={handleLeaderSelect}
                    style={styles.crewSelect}
                  >
                    <Picker.Item label="Select Leader" value="" />
                    {CREW_NAMES.leaders
                      .filter(name => name !== driver && !members.some(m => m.name === name))
                      .map((name) => (
                        <Picker.Item key={name} label={name} value={name} />
                      ))}
                  </Picker>
                </View>
                {leaderPhone && (
                  <Text style={styles.phoneNumber}>{leaderPhone}</Text>
                )}
              </View>
            </View>

            <View style={styles.crewInputGroup}>
              <View style={[styles.crewHeader, styles.memberHeaderRow]}>
                <Text style={styles.crewInputLabel}>Members</Text>
                <TouchableOpacity
                  style={styles.addMemberButton}
                  onPress={handleAddMember}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#1976D2" />
                  <Text style={styles.addMemberButtonText}>Add Member</Text>
                </TouchableOpacity>
              </View>
              
              {members.map((member, index) => (
                <View key={index} style={styles.memberInputRow}>
                  <View style={styles.crewSelectContainer}>
                    <Picker
                      selectedValue={member.name}
                      onValueChange={(value) => handleMemberSelect(index, value)}
                      style={styles.crewSelect}
                    >
                      <Picker.Item label="Select Member" value="" />
                      {CREW_NAMES.members
                        .filter(name => 
                          name !== driver && 
                          name !== leader && 
                          !members.some((m, i) => i !== index && m.name === name)
                        )
                        .map((name) => (
                          <Picker.Item key={name} label={name} value={name} />
                        ))}
                    </Picker>
                  </View>
                  {member.phone && (
                    <Text style={styles.phoneNumber}>{member.phone}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.removeMemberButton}
                    onPress={() => handleRemoveMember(index)}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.crewModalFooter}>
            <TouchableOpacity
              style={[styles.crewModalButton, styles.crewModalCancelButton]}
              onPress={onClose}
            >
              <Text style={styles.crewModalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.crewModalButton, styles.crewModalSaveButton]}
              onPress={handleSave}
            >
              <Text style={styles.crewModalSaveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function DispatchScreen() {
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [jobsData, setJobsData] = useState<{ [key: string]: JobDetail[] }>({});
  const [crewData, setCrewData] = useState<{ [key: string]: TruckCrew }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [showDoneJobs, setShowDoneJobs] = useState(false);
  const [ordersData, setOrdersData] = useState<JobDetail[]>(sampleOrdersData);
  const [orderSort, setOrderSort] = useState<{ type: SortType; direction: SortDirection }>({
    type: 'time',
    direction: 'asc'
  });
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<[string, string] | null>(null);
  const [truckSort, setTruckSort] = useState<{ type: SortType; direction: SortDirection }>({ 
    type: null, 
    direction: 'asc' 
  });
  const [jobSort, setJobSort] = useState<{ type: SortType; direction: SortDirection }>({ 
    type: 'time', 
    direction: 'asc' 
  });
  const [isListView, setIsListView] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<JobDetail | null>(null);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  const generateJobs = (count: number, processedCount: number): JobDetail[] => {
    const jobs: JobDetail[] = [];
    const companies = [
      { name: 'Apple Store', address: '100 Plaza, Hysan Place', district: 'CWB' },
      { name: 'Nike Factory', address: '88 Queens Road', district: 'Central' },
      { name: 'Adidas HK', address: '168 Nathan Road', district: 'TST' },
      { name: 'Samsung Experience', address: '1 Harbour City', district: 'TST' },
      { name: 'Microsoft HK', address: '15 Times Square', district: 'CWB' },
      { name: 'Louis Vuitton', address: 'Shop 101, IFC Mall', district: 'Central' },
      { name: 'Gucci Flagship', address: '1881 Heritage', district: 'TST' },
      { name: 'H&M Store', address: 'Langham Place', district: 'MK' },
      { name: 'Uniqlo', address: 'APM Mall', district: 'KLB' },
    ]; // 移除了 Zara HK
    
    const remarks = [
      'Fragile items - Handle with care',
      'Signature required',
      'Temperature controlled delivery',
      'High-value items',
      'Time-sensitive delivery',
      'Bulk cargo',
      'Special handling required',
      'Insurance required',
      'Scheduled delivery',
      'Installation service needed',
      'Sameday delivery - Urgent',
      'Express local delivery',
      'Priority handling required',
      'Delivery within 4 hours',
      'Local rush delivery'
    ];
    
    for (let i = 0; i < count; i++) {
      const isDone = i < processedCount;
      const isHold = !isDone && Math.random() < 0.3;
      
      // Increase probability of generating Domestic and Handcarry
      const serviceTypeRandom = Math.random();
      let serviceType: 'Air-Import' | 'Air-Export' | 'Domestic' | 'Handcarry';
      if (serviceTypeRandom < 0.4) {
        serviceType = 'Domestic';
      } else if (serviceTypeRandom < 0.6) {
        serviceType = 'Handcarry';
      } else if (serviceTypeRandom < 0.8) {
        serviceType = 'Air-Import';
      } else {
        serviceType = 'Air-Export';
      }
      
      const pickupCompany = companies[Math.floor(Math.random() * companies.length)];
      const deliveryCompany = companies[Math.floor(Math.random() * companies.length)];
      
      // Increase probability of generating PICK_UP, especially for Domestic and Handcarry
      const type = (serviceType === 'Domestic' || serviceType === 'Handcarry') && Math.random() < 0.7 
        ? 'PICK_UP' 
        : (Math.random() > 0.5 ? 'DELIVERY' : 'PICK_UP');
      
      // Generate current date and time
      const today = dayjs();
      const pickupDate = today.add(Math.floor(Math.random() * 3), 'day');
      
      // For Domestic and Handcarry, always set delivery date to the same day
      const deliveryDate = (serviceType === 'Domestic' || serviceType === 'Handcarry')
        ? pickupDate
        : pickupDate.add(Math.floor(Math.random() * 2) + 1, 'day');
      
      // For orders with same-day delivery, choose specific remarks
      const samedayRemarks = [
        'Sameday delivery - Urgent',
        'Express local delivery',
        'Priority handling required',
        'Delivery within 4 hours',
        'Local rush delivery'
      ];
      
      const remark = (serviceType === 'Domestic' || serviceType === 'Handcarry') 
        ? samedayRemarks[Math.floor(Math.random() * samedayRemarks.length)]
        : remarks[Math.floor(Math.random() * remarks.length)];
      
      jobs.push({
        id: `JOB-${Math.random().toString(36).substr(2, 9)}`,
        companyName: type === 'DELIVERY' ? deliveryCompany.name : pickupCompany.name,
        address: type === 'DELIVERY' ? deliveryCompany.address : pickupCompany.address,
        district: type === 'DELIVERY' ? deliveryCompany.district : pickupCompany.district,
        deliveryTime: generateRandomTime(),
        isDone,
        type,
        isHold,
        serviceType,
        pickupDate: pickupDate.format('YYYY-MM-DD HH:mm'),
        deliveryDate: deliveryDate.format('YYYY-MM-DD HH:mm'),
        pickupCompany: {
          name: pickupCompany.name,
          address: pickupCompany.address,
        },
        deliveryCompany: {
          name: deliveryCompany.name,
          address: deliveryCompany.address,
        },
        remark,
        pieces: Math.floor(Math.random() * 100) + 1,
      });
    }
    return jobs;
  };

  const handleCrewChange = (truckId: string, crew: TruckCrew) => {
    setCrewData(prev => ({
      ...prev,
      [truckId]: crew
    }));
  };

  const truckData: TruckCardProps[] = useMemo(() => {
    const trucks = [
      {
        title: 'H01',
        truckType: 'Light Van',
        deviceId: 'H0001',
        insuranceValue: 1500000,
        districts: ['TST', 'HK', 'KL-E'],
        jobs: jobsData['H01'] || [],
        isSelected: selectedTruck === 'H01',
        onSelect: () => setSelectedTruck(prev => prev === 'H01' ? null : 'H01'),
        crew: crewData['H01'],
        onCrewChange: (crew: TruckCrew) => handleCrewChange('H01', crew),
      },
      {
        title: 'H02',
        truckType: '5.5 Ton Truck',
        deviceId: 'H0002',
        insuranceValue: 1500000,
        districts: ['HH', 'KL-W', 'NT'],
        jobs: jobsData['H02'] || [],
        isSelected: selectedTruck === 'H02',
        onSelect: () => setSelectedTruck('H02'),
        crew: crewData['H02'],
        onCrewChange: (crew: TruckCrew) => handleCrewChange('H02', crew),
      },
      {
        title: 'H03',
        truckType: '16 Ton Truck',
        deviceId: 'H0003',
        insuranceValue: 1500000,
        districts: ['TST', 'NT'],
        jobs: jobsData['H03'] || [],
        isSelected: selectedTruck === 'H03',
        onSelect: () => setSelectedTruck('H03'),
        crew: crewData['H03'],
        onCrewChange: (crew: TruckCrew) => handleCrewChange('H03', crew),
      },
      {
        title: 'H04',
        truckType: 'Armored Truck',
        deviceId: 'H0004',
        insuranceValue: 1500000,
        districts: ['KL-E', 'KL-W'],
        jobs: jobsData['H04'] || [],
        isSelected: selectedTruck === 'H04',
        onSelect: () => setSelectedTruck('H04'),
        crew: crewData['H04'],
        onCrewChange: (crew: TruckCrew) => handleCrewChange('H04', crew),
      },
      {
        title: 'H05',
        truckType: 'Semi Armored Truck',
        deviceId: 'H0005',
        insuranceValue: 1500000,
        districts: ['HK', 'TST'],
        jobs: jobsData['H05'] || [],
        isSelected: selectedTruck === 'H05',
        onSelect: () => setSelectedTruck('H05'),
        crew: crewData['H05'],
        onCrewChange: (crew: TruckCrew) => handleCrewChange('H05', crew),
      },
    ];

    // 为每个卡车计算processedOrders和totalOrders
    return trucks.map(truck => {
      const truckJobs = jobsData[truck.title] || [];
      const processedOrders = truckJobs.filter(job => job.isDone).length;
      const holdOrders = truckJobs.filter(job => job.isHold).length;
      const totalOrders = truckJobs.length;

      return {
        ...truck,
        processedOrders,
        totalOrders,
        jobs: truckJobs,
      };
    });
  }, [selectedTruck, jobsData, crewData]);

  const selectedTruckData = truckData.find(truck => truck.title === selectedTruck);

  // Sort icon component
  const SortIcon = ({ type, currentType, direction }: { 
    type: SortType; 
    currentType: SortType; 
    direction: SortDirection 
  }) => (
    <MaterialCommunityIcons
      name={type === currentType 
        ? (direction === 'asc' ? 'sort-ascending' : 'sort-descending')
        : 'sort'
      }
      size={18}
      color={type === currentType ? '#1976D2' : '#666'}
    />
  );

  // Handle truck list sorting
  const handleTruckSort = () => {
    setTruckSort(prev => ({
      type: 'processedOrders',
      direction: prev.type === 'processedOrders' && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle job sorting
  const handleJobSort = (type: 'time' | 'district') => {
    setJobSort(prev => {
      const newDirection = prev.type === type && prev.direction === 'asc' ? 'desc' : 'asc';
      return { type, direction: newDirection };
    });
  };

  // Sort truck data
  const sortedTruckData = useMemo(() => {
    let sorted = [...truckData];
    if (truckSort.type === 'processedOrders') {
      sorted.sort((a, b) => {
        const diff = a.processedOrders - b.processedOrders;
        return truckSort.direction === 'asc' ? diff : -diff;
      });
    }
    return sorted;
  }, [truckData, truckSort]);

  // Sort job data
  const sortJobs = (jobs: JobDetail[]) => {
    return [...jobs].sort((a, b) => {
      // First, sort by isHold status
      if (a.isHold !== b.isHold) {
        return a.isHold ? 1 : -1;
      }

      if (jobSort.type === 'time') {
        const timeA = getMinutes(a.deliveryTime);
        const timeB = getMinutes(b.deliveryTime);
        return jobSort.direction === 'asc' ? timeA - timeB : timeB - timeA;
      } else if (jobSort.type === 'district') {
        return jobSort.direction === 'asc'
          ? a.district.localeCompare(b.district)
          : b.district.localeCompare(a.district);
      }
      return 0;
    });
  };

  const sortedJobs = useMemo(() => {
    if (!selectedTruckData?.jobs) return [];
    
    let sorted = [...selectedTruckData.jobs];
    sorted = sortJobs(sorted);
    return sorted;
  }, [selectedTruckData?.jobs, jobSort]);

  const moveCard = (draggedIndex: number, hoveredIndex: number) => {
    const truck = selectedTruck;
    if (!truck) return;

    // Get only unfinished cards
    const unfinishedJobs = jobsData[truck].filter(job => !job.isDone);
    const finishedJobs = jobsData[truck].filter(job => job.isDone);

    // Ensure new index is within the range of unfinished cards
    const validHoveredIndex = Math.max(0, Math.min(hoveredIndex, unfinishedJobs.length - 1));

    // Re-sort unfinished cards
    const newUnfinishedJobs = [...unfinishedJobs];
    const [movedJob] = newUnfinishedJobs.splice(draggedIndex, 1);
    newUnfinishedJobs.splice(validHoveredIndex, 0, movedJob);

    // Combine unfinished and finished cards
    const newJobs = [...newUnfinishedJobs, ...finishedJobs];

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    setJobsData(prev => ({
      ...prev,
      [truck]: newJobs,
    }));
  };

  // Get all available districts
  const availableDistricts = useMemo(() => 
    Array.from(new Set(ordersData.map(order => order.district))).sort(),
    [ordersData]
  );

  // Handle order sorting and filtering
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...ordersData];
    
    // Apply district filter
    if (selectedDistrict) {
      filtered = filtered.filter(order => order.district === selectedDistrict);
    }
    
    // Apply time range filter
    if (selectedTimeRange) {
      const [start, end] = selectedTimeRange;
      filtered = filtered.filter(order => {
        return order.deliveryTime >= start && order.deliveryTime <= end;
      });
    }
    
    // Sort by time
    if (orderSort.type === 'time') {
      filtered.sort((a, b) => {
        const comparison = a.deliveryTime.localeCompare(b.deliveryTime);
        return orderSort.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [ordersData, selectedDistrict, selectedTimeRange, orderSort]);

  // Group orders by district
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: JobDetail[] } = {};
    filteredAndSortedOrders.forEach(order => {
      if (!groups[order.district]) {
        groups[order.district] = [];
      }
      groups[order.district].push(order);
    });
    return groups;
  }, [filteredAndSortedOrders]);

  // Handle group expansion/collapse
  const toggleGroup = (district: string) => {
    setCollapsedGroups(prev => 
      prev.includes(district)
        ? prev.filter(d => d !== district)
        : [...prev, district]
    );
  };

  const [showHoldInTruck, setShowHoldInTruck] = useState(false);

  const isSameDay = (date1: string, date2: string) => {
    return dayjs(date1).format('YYYY-MM-DD') === dayjs(date2).format('YYYY-MM-DD');
  };

  // Add function to save orders to localStorage
  const saveOrdersToStorage = (orders: JobDetail[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedOrders', JSON.stringify(orders));
    }
  };

  // Load orders from localStorage
  const loadOrdersFromStorage = () => {
    if (typeof window !== 'undefined') {
      const savedOrders = localStorage.getItem('savedOrders');
      if (savedOrders) {
        return JSON.parse(savedOrders);
      }
    }
    return sampleOrdersData;
  };

  // Load saved orders when component initializes
  useEffect(() => {
    const loadedOrders = loadOrdersFromStorage();
    setOrdersData(loadedOrders);
  }, []);

  // Add function to add new order
  const handleAddOrder = (newOrder: JobDetail) => {
    const updatedOrders = [...ordersData, newOrder];
    setOrdersData(updatedOrders);
    saveOrdersToStorage(updatedOrders);
    setShowAddOrderModal(false);
  };

  // Add cleanOrdersCache function after loadOrdersFromStorage
  const cleanOrdersCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('savedOrders');
      setOrdersData(sampleOrdersData);
    }
  };

  // Add useEffect to initialize collapsedGroups after groupedOrders is available
  useEffect(() => {
    setCollapsedGroups(Object.keys(groupedOrders));
  }, []); // 空依赖数组,只在组件挂载时执行一次

  const handleAddToTruck = (order: JobDetail) => {
    if (!selectedTruck) {
      alert('请先选择一辆卡车');
      return;
    }

    // 更新卡车的任务列表
    setJobsData(prev => ({
      ...prev,
      [selectedTruck]: [...(prev[selectedTruck] || []), order]
    }));

    // 从订单队列中移除,但不改变分组状态
    setOrdersData(prev => prev.filter(o => o.id !== order.id));
  };

  const handleRemoveFromTruck = (jobId: string) => {
    if (!selectedTruck) return;

    // 从卡车中移除任务
    const removedJob = jobsData[selectedTruck].find(job => job.id === jobId);
    if (!removedJob) return;

    // 更新卡车的任务列表
    setJobsData(prev => ({
      ...prev,
      [selectedTruck]: prev[selectedTruck].filter(job => job.id !== jobId)
    }));

    // 将任务添加回订单队列
    setOrdersData(prev => [...prev, removedJob]);
  };

  // 初始化示例数据
  useEffect(() => {
    if (Object.keys(jobsData).length === 0) {
      const newJobsData: { [key: string]: JobDetail[] } = {};
      
      // H01: 14个任务,全部完成
      newJobsData['H01'] = generateJobs(14, 14).filter(job => job.companyName !== 'Zara HK');
      
      // H02: 10个任务,7个完成
      newJobsData['H02'] = generateJobs(10, 7);
      
      // H03: 9个任务,4个完成,包含一个当天任务
      const today = dayjs();
      const samedayJob: JobDetail = {
        id: 'SAMEDAY-001',
        companyName: 'Apple Store',
        address: '100 Plaza, Hysan Place',
        district: 'CWB',
        deliveryTime: '10:00',
        isDone: false,
        type: 'PICK_UP',
        isHold: false,
        serviceType: 'Domestic',
        pickupDate: today.format('YYYY-MM-DD HH:mm'),
        deliveryDate: today.format('YYYY-MM-DD HH:mm'),
        pickupCompany: {
          name: 'Apple Store',
          address: '100 Plaza, Hysan Place',
        },
        deliveryCompany: {
          name: 'Apple Store IFC',
          address: 'Shop 101, IFC Mall, Central',
        },
        remark: 'Sameday delivery - Urgent',
        pieces: 0,
      };
      newJobsData['H03'] = [samedayJob, ...generateJobs(8, 4)];
      
      // H04: 5个任务,1个完成
      newJobsData['H04'] = generateJobs(5, 1);
      
      // H05: 5个任务,1个完成
      newJobsData['H05'] = generateJobs(5, 1);
      
      setJobsData(newJobsData);
    }
  }, []);

  return (
    <MainLayout
      title="Dispatch"
      breadcrumbs={[
        { label: 'Trucking' },
        { label: 'Dispatch' }
      ]}
      toolbarContent={
        <View style={styles.toolbarContent}>
          <View style={styles.toolbarSection}>
            <View style={styles.datePickerContainer}>
              <MaterialCommunityIcons name="calendar" size={20} color="#666" />
              <Text style={styles.dateLabel}>JOB DATE:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setIsDatePickerVisible(true)}
              >
                <Text style={styles.dateButtonText}>
                  {selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : 'Select Date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.toolbarButtons, { marginLeft: 'auto' }]}>
              <TouchableOpacity
                style={[styles.addOrderButton, { marginRight: 12 }]}
                onPress={() => setShowAddOrderModal(true)}
              >
                <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
                <Text style={styles.addOrderButtonText}>ADD #DEMO# ORDER</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cleanCacheButton}
                onPress={cleanOrdersCache}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#fff" />
                <Text style={styles.cleanCacheButtonText}>CLEAN CACHE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      }
    >
      <View style={[styles.container, { paddingTop: 0 }]}>
        <View style={[styles.leftPanel, { width: '12%' }]}>
          <View style={[styles.containerTitleRow, styles.leftPanelTitle]}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons name="truck-delivery" size={20} color="#1976D2" />
            <Text style={styles.containerTitle}>Vehicle List</Text>
            </View>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={handleTruckSort}
            >
              <SortIcon 
                type="processedOrders"
                currentType={truckSort.type}
                direction={truckSort.direction}
              />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scrollView}>
            <View style={styles.truckCardGrid}>
              {sortedTruckData.map((truck, index) => (
                <TruckCard key={index} {...truck} />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Add empty View as spacing */}
        <View style={{ width: 1 }} />

        <View style={styles.rightSection}>
          <View style={[styles.panel, { width: '28.56%' }]}>
            <View style={[styles.containerTitleRow, styles.middlePanelTitle]}>
              <View style={styles.titleContainer}>
                <MaterialCommunityIcons name="clipboard-list" size={20} color="#1976D2" />
                <Text style={styles.containerTitle}>
                  Truck Jobs Detail
                  {selectedTruck && (
                    <Text style={styles.selectedTruckLabel}> - {selectedTruck}</Text>
                  )}
                </Text>
              </View>
              <View style={styles.sortButtons}>
                <TouchableOpacity 
                  style={styles.sortButton}
                  onPress={() => handleJobSort('time')}
                >
                  <Text style={styles.sortButtonText}>Time</Text>
                  <SortIcon 
                    type="time"
                    currentType={jobSort.type}
                    direction={jobSort.direction}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.sortButton}
                  onPress={() => handleJobSort('district')}
                >
                  <Text style={styles.sortButtonText}>District</Text>
                  <SortIcon 
                    type="district"
                    currentType={jobSort.type}
                    direction={jobSort.direction}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView 
              style={styles.scrollView}
              scrollEnabled={!isDragging}
              ref={scrollViewRef}
            >
              {selectedTruckData ? (
                <View style={styles.jobsGrid}>
                  {/* Use sorted job data */}
                  {sortedJobs
                    .filter(job => {
                      // Basic filtering conditions
                      const matchesDistrict = !selectedDistrict || job.district === selectedDistrict;
                      const isNotDone = !job.isDone;
                      const isNotHold = !job.isHold;
                      
                      // If displaying completed tasks, do not show in main list
                      if (showDoneJobs && job.isDone) {
                        return false;
                      }
                      
                      // If displaying hold tasks, do not show in main list
                      if (showHoldInTruck && job.isHold) {
                        return false;
                      }
                      
                      return matchesDistrict && isNotDone && isNotHold;
                    })
                    .map((job, index) => (
                      <DraggableJobCard
                        key={job.id}
                        job={job}
                        index={index}
                        moveCard={moveCard}
                        onDragStart={() => setIsDragging(true)}
                        onDragEnd={() => setIsDragging(false)}
                        scrollViewRef={scrollViewRef}
                        onRemove={() => handleRemoveFromTruck(job.id)}
                      />
                    ))}
                  
                  {/* HOLD IN TRUCK button */}
                  {selectedTruckData.jobs.filter(job => job.isHold).length > 0 && (
                    <TouchableOpacity 
                      style={[styles.doneToggle, { backgroundColor: '#E57373' }]}
                      onPress={() => setShowHoldInTruck(!showHoldInTruck)}
                    >
                      <MaterialCommunityIcons 
                        name="truck-check" 
                        size={20} 
                        color="#FFF" 
                      />
                      <Text style={[styles.doneToggleText, { color: '#FFF' }]}>
                        {showHoldInTruck ? "Hide Hold In Truck" : "Show Hold In Truck"}
                        <Text style={[styles.doneCount, { color: '#FFF' }]}>
                          {" "}({selectedTruckData.jobs.filter(job => job.isHold).length})
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Display hold tasks */}
                  {showHoldInTruck && selectedTruckData.jobs.filter(job => job.isHold).length > 0 && (
                    <View style={styles.holdJobsContainer}>
                      {selectedTruckData.jobs
                        .filter(job => job.isHold)
                        .map((job, index) => (
                          <DraggableJobCard
                            key={job.id}
                            job={job}
                            index={index}
                            moveCard={moveCard}
                            onDragStart={() => setIsDragging(true)}
                            onDragEnd={() => setIsDragging(false)}
                            scrollViewRef={scrollViewRef}
                            onRemove={() => handleRemoveFromTruck(job.id)}
                          />
                        ))}
                    </View>
                  )}

                  <View style={styles.jobsDivider} />
                  
                  {/* HIDE DONE button */}
                  {selectedTruckData.jobs.filter(job => job.isDone).length > 0 && (
                    <TouchableOpacity 
                      style={[styles.doneToggle, { backgroundColor: '#81C784' }]}
                      onPress={() => setShowDoneJobs(!showDoneJobs)}
                    >
                      <MaterialCommunityIcons 
                        name="check-circle" 
                        size={20} 
                        color="#FFF" 
                      />
                      <Text style={[styles.doneToggleText, { color: '#FFF' }]}>
                        {showDoneJobs ? "Hide Done Jobs" : "Show Done Jobs"}
                        <Text style={[styles.doneCount, { color: '#FFF' }]}>
                          {" "}({selectedTruckData.jobs.filter(job => job.isDone).length})
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Display completed tasks */}
                  {showDoneJobs && selectedTruckData.jobs.filter(job => job.isDone).length > 0 && (
                    <View style={styles.doneJobsContainer}>
                      {selectedTruckData.jobs
                        .filter(job => job.isDone)
                        .map((job, index) => (
                          <DraggableJobCard
                            key={job.id}
                            job={job}
                            index={index}
                            moveCard={moveCard}
                            onDragStart={() => setIsDragging(true)}
                            onDragEnd={() => setIsDragging(false)}
                            scrollViewRef={scrollViewRef}
                            onRemove={() => handleRemoveFromTruck(job.id)}
                          />
                        ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noSelection}>
                  <Text style={styles.noSelectionText}>Please select a truck to view its jobs</Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Add empty View as spacing */}
          <View style={{ width: '2%' }} />

          <View style={[styles.panel, { width: '57.12%', flex: 1 }]}>
            <View style={[styles.containerTitleRow, styles.rightPanelTitle]}>
              <View style={styles.titleContainer}>
                <MaterialCommunityIcons name="package-variant" size={20} color="#1976D2" />
              <Text style={styles.containerTitle}>Orders Queue</Text>
              </View>
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={styles.viewModeButton}
                  onPress={() => {
                    const allDistricts = Object.keys(groupedOrders);
                    if (collapsedGroups.length === allDistricts.length) {
                      setCollapsedGroups([]);
                    } else {
                      setCollapsedGroups(allDistricts);
                    }
                  }}
                >
                  <MaterialCommunityIcons
                    name={collapsedGroups.length === Object.keys(groupedOrders).length ? "unfold-more-horizontal" : "unfold-less-horizontal"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewModeButton}
                  onPress={() => setIsListView(!isListView)}
                >
                  <MaterialCommunityIcons
                    name={isListView ? "view-grid" : "view-list"}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>District:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterSelect}>
                    {availableDistricts.map(district => (
                      <TouchableOpacity
                        key={district}
                        style={[
                          styles.filterOption,
                          selectedDistrict === district && styles.filterOptionSelected
                        ]}
                        onPress={() => setSelectedDistrict(prev => prev === district ? null : district)}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          selectedDistrict === district && styles.filterOptionTextSelected
                        ]}>
                          {district}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  </ScrollView>
                </View>
                
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Time:</Text>
                  <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => setOrderSort(prev => ({
                      type: 'time',
                      direction: prev.type === 'time' && prev.direction === 'asc' ? 'desc' : 'asc'
                    }))}
                  >
                    <SortIcon
                      type="time"
                      currentType={orderSort.type}
                      direction={orderSort.direction}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <ScrollView style={styles.scrollView}>
              {Object.entries(groupedOrders).map(([district, orders]) => (
                <View key={district} style={styles.orderGroup}>
                  <TouchableOpacity
                    style={styles.groupHeader}
                    onPress={() => toggleGroup(district)}
                  >
                    <View style={styles.groupHeaderContent}>
                      <MaterialCommunityIcons
                        name={collapsedGroups.includes(district) ? 'chevron-right' : 'chevron-down'}
                        size={24}
                        color="#666"
                      />
                      <Text style={styles.groupTitle}>{district}</Text>
                      <Text style={styles.groupCount}>({orders.length})</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {!collapsedGroups.includes(district) && (
                    <View style={styles.groupContent}>
                      {isListView ? (
                        <View style={styles.listViewContainer}>
                          {orders.map(order => {
                            const isSamedayDelivery = ((order.type === 'PICK_UP' && order.serviceType === 'Domestic') || 
                              (order.type === 'PICK_UP' && order.serviceType === 'Handcarry')) && 
                              isSameDay(order.pickupDate, order.deliveryDate);

                            if (isSamedayDelivery) {
                              return (
                                <View key={order.id} style={styles.listViewSamedayItem}>
                                  <Text style={styles.listViewSamedayWatermark}>
                                    {order.serviceType === 'Domestic' ? 'Sameday Delivery' : 'Sameday Handcarry'}
                                  </Text>
                                  
                                  <View style={styles.listViewSamedayServiceType}>
                                    <Text style={styles.listViewSamedayServiceTypeText}>
                                      PICK UP • {order.serviceType}
                                    </Text>
                                  </View>

                                  <View style={styles.listViewSamedayContent}>
                                    <View style={styles.listViewSamedayTimeColumn}>
                                      <View style={styles.listViewSamedayTimeBlock}>
                                        <Text style={styles.listViewSamedayTime}>
                                          {dayjs(order.pickupDate).format('HH:mm')}
                                        </Text>
                                        <View style={[styles.listViewType, { backgroundColor: '#F0F7FF' }]}>
                                          <Text style={[styles.listViewTypeText, { color: '#1976D2' }]}>
                                            PICK UP
                                          </Text>
                                        </View>
                                      </View>
                                      <MaterialCommunityIcons 
                                        name="chevron-down" 
                                        size={24} 
                                        color="#1976D2"
                                        style={styles.listViewSamedayArrow}
                                      />
                                      <View style={styles.listViewSamedayTimeBlock}>
                                        <Text style={styles.listViewSamedayTime}>
                                          {dayjs(order.deliveryDate).format('HH:mm')}
                                        </Text>
                                        <View style={[styles.listViewType, { backgroundColor: '#FFF7E6' }]}>
                                          <Text style={[styles.listViewTypeText, { color: '#FF9800' }]}>
                                            DELIVERY
                                          </Text>
                                        </View>
                                      </View>
                                    </View>

                                    <View style={styles.listViewSamedayAddressColumn}>
                                      <View style={styles.listViewSamedayAddressBlock}>
                                        <View style={styles.listViewSamedayAddressHeader}>
                                          <MaterialCommunityIcons name="export" size={16} color="#4CAF50" />
                                          <Text style={styles.listViewSamedayAddressTitle}>Pick up from</Text>
                                        </View>
                                        <Text style={styles.listViewSamedayCompanyName}>{order.pickupCompany.name}</Text>
                                        <Text style={styles.listViewSamedayAddress}>{order.pickupCompany.address}</Text>
                                      </View>

                                      <View style={styles.listViewSamedayAddressBlock}>
                                        <View style={styles.listViewSamedayAddressHeader}>
                                          <MaterialCommunityIcons name="import" size={16} color="#F44336" />
                                          <Text style={styles.listViewSamedayAddressTitle}>Delivery to</Text>
                                        </View>
                                        <Text style={styles.listViewSamedayCompanyName}>{order.deliveryCompany.name}</Text>
                                        <Text style={styles.listViewSamedayAddress}>{order.deliveryCompany.address}</Text>
                                      </View>
                                    </View>
                                  </View>

                                  <TouchableOpacity 
                                    style={styles.listViewSamedayInfoButton}
                                    onPress={() => setSelectedOrderDetail(order)}
                                  >
                                    <MaterialCommunityIcons name="information" size={16} color="#1976D2" />
                                  </TouchableOpacity>
                                  <TouchableOpacity 
                                    style={styles.addToTruckButton}
                                    onPress={() => handleAddToTruck(order)}
                                    accessibilityLabel="Press will add this order to the selected truck"
                                  >
                                    <MaterialCommunityIcons name="plus" size={14} color="#4CAF50" />
                                  </TouchableOpacity>
                                </View>
                              );
                            }

                            return (
                              <View 
                                key={order.id} 
                                style={[
                                  styles.listViewItem,
                                  { borderLeftColor: order.isHold ? '#FF0000' : (order.type === 'DELIVERY' ? '#FF9800' : '#1976D2'), borderLeftWidth: 4 }
                                ]}
                              >
                                <TouchableOpacity 
                                  style={styles.listViewInfoButton}
                                  onPress={() => setSelectedOrderDetail(order)}
                                >
                                  <MaterialCommunityIcons name="information" size={16} color="#1976D2" />
                                </TouchableOpacity>
                                <View style={styles.listViewLeft}>
                                  <Text style={styles.listViewTime}>{order.deliveryTime}</Text>
                                  <View style={[
                                    styles.listViewType,
                                    { backgroundColor: order.isHold ? '#FFF5F5' : (order.type === 'DELIVERY' ? '#FFF7E6' : '#F0F7FF') }
                                  ]}>
                                    <Text style={[
                                      styles.listViewTypeText,
                                      { color: order.isHold ? '#FF0000' : (order.type === 'DELIVERY' ? '#FF9800' : '#1976D2') }
                                    ]}>
                                      {order.isHold ? 'HOLD IN TRUCK' : order.type}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.listViewCenter}>
                                  <Text style={styles.listViewCompany}>{order.companyName}</Text>
                                  <View style={styles.listViewInfoRow}>
                                    <View style={styles.listViewAddressContainer}>
                                      <Text style={styles.listViewAddress}>{order.address}</Text>
                                      <View style={styles.piecesContainer}>
                                        <Text style={[
                                          styles.piecesText,
                                          order.isDone ? styles.piecesTextDone : 
                                          order.isHold ? styles.piecesTextHold :
                                          order.type === 'PICK_UP' ? styles.piecesTextHighlight : null
                                        ]}>
                                          {order.isDone ? `DONE • ${order.pieces} PCS` :
                                           order.isHold ? `${order.pieces} PCS` :
                                           order.type === 'PICK_UP' ? `ECT ${order.pieces} PCS` :
                                           `${order.pieces} PCS`}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>
                                </View>
                                <View style={styles.listViewRight}>
                                  <View style={styles.districtBadge}>
                                    <Text style={styles.districtText}>{order.district}</Text>
                                  </View>
                                </View>
                                <TouchableOpacity 
                                  style={styles.addToTruckButton}
                                  onPress={() => handleAddToTruck(order)}
                                  accessibilityLabel="Press will add this order to the selected truck"
                                >
                                  <MaterialCommunityIcons name="plus" size={14} color="#4CAF50" />
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                      <View style={[styles.cardGrid, { justifyContent: 'flex-start' }]}>
                        {orders.map(order => (
                            <React.Fragment key={order.id}>
                          <View 
                            style={[
                              styles.jobCard,
                              styles.gridCard,
                              { backgroundColor: order.isHold ? '#FFF5F5' : (order.type === 'DELIVERY' ? '#FFF7E6' : '#F0F7FF') },
                              ((order.type === 'PICK_UP' && order.serviceType === 'Domestic') || 
                               (order.type === 'PICK_UP' && order.serviceType === 'Handcarry')) && 
                               isSameDay(order.pickupDate, order.deliveryDate) && 
                               styles.samedayDeliveryContainer
                            ]}
                          >
                            {((order.type === 'PICK_UP' && order.serviceType === 'Domestic') || 
                              (order.type === 'PICK_UP' && order.serviceType === 'Handcarry')) && 
                             isSameDay(order.pickupDate, order.deliveryDate) ? (
                              <>
                                <View style={[styles.statusLabel, { backgroundColor: '#1976D2' }]}>
                                  <Text style={styles.statusLabelText}>PICK UP</Text>
                                  <Text style={[styles.statusLabelText, styles.serviceTypeLabel]}>
                                    • {order.serviceType}
                                  </Text>
                                </View>
                                
                                <Text style={styles.orderSamedayWatermark}>
                                  {order.serviceType === 'Domestic' ? 'Sameday Delivery' : 'Sameday Handcarry'}
                                </Text>
                                
                                <View style={styles.orderSamedayContent}>
                                  <View style={styles.orderSamedayHeader}>
                                    <View style={styles.infoRow}>
                                      <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                                      <Text style={styles.infoLabel}>District:</Text>
                                      <View style={styles.districtBadge}>
                                        <Text style={styles.districtText}>{order.district}</Text>
                                      </View>
                                    </View>
                                  </View>
                                  <View style={styles.orderSamedayTimeline}>
                                    <View style={styles.orderSamedayTimelinePoint}>
                                      <View style={styles.orderSamedayTimeIcon}>
                                        <Text style={styles.orderSamedayTimeText}>{dayjs(order.pickupDate).format('HH:mm')}</Text>
                                      </View>
                                      <View style={styles.orderSamedayTimelineContent}>
                                        <View style={styles.orderSamedayTimelineCompany}>
                                          <MaterialCommunityIcons name="package-variant" size={20} color="#1976D2" />
                                          <Text style={styles.orderSamedayTimelineCompanyName}>{order.pickupCompany.name}</Text>
                                        </View>
                                        <View style={styles.orderSamedayTimelineHeader}>
                                          <MaterialCommunityIcons name="export" size={14} color="#4CAF50" />
                                          <Text style={styles.orderSamedayTimelineTitle}>Pick up from</Text>
                                          <View style={[styles.piecesContainer, { marginLeft: 'auto' }]}>
                                            <Text style={[styles.piecesText, styles.piecesTextHighlight]}>
                                              ECT {order.pieces} PCS
                                            </Text>
                                          </View>
                                        </View>
                                        <Text style={styles.orderSamedayTimelineAddress}>{order.pickupCompany.address}</Text>
                                      </View>
                                    </View>

                                    <View style={styles.orderSamedayTimelineConnector} />

                                    <View style={styles.orderSamedayTimelinePoint}>
                                      <View style={styles.orderSamedayTimeIcon}>
                                        <Text style={styles.orderSamedayTimeText}>{dayjs(order.deliveryDate).format('HH:mm')}</Text>
                                      </View>
                                      <View style={styles.orderSamedayTimelineContent}>
                                        <View style={styles.orderSamedayTimelineCompany}>
                                          <MaterialCommunityIcons name="package-variant" size={20} color="#1976D2" />
                                          <Text style={styles.orderSamedayTimelineCompanyName}>{order.deliveryCompany.name}</Text>
                                        </View>
                                        <View style={styles.orderSamedayTimelineHeader}>
                                          <MaterialCommunityIcons name="import" size={14} color="#F44336" />
                                          <Text style={styles.orderSamedayTimelineTitle}>Delivery to</Text>
                                        </View>
                                        <Text style={styles.orderSamedayTimelineAddress}>{order.deliveryCompany.address}</Text>
                                      </View>
                                    </View>
                                  </View>
                                </View>
                              </>
                            ) : (
                              <>
                            <View style={[
                              styles.statusLabel,
                              { backgroundColor: order.isHold ? '#FF0000' : (order.type === 'PICK_UP' ? '#1976D2' : '#FF9800') }
                            ]}>
                              <Text style={styles.statusLabelText}>
                                {order.isHold ? 'HOLD IN TRUCK' : (order.type === 'PICK_UP' ? 'PICK UP' : 'DELIVERY')}
                              </Text>
                              <Text style={[styles.statusLabelText, styles.serviceTypeLabel]}>
                                • {order.serviceType}
                              </Text>
                            </View>
                            
                            <View style={styles.jobHeader}>
                              <View style={styles.jobHeaderLeft}>
                                <MaterialCommunityIcons
                                  name={order.isHold ? "truck-check" : "package-variant"}
                                  size={24}
                                  color={order.isHold ? '#FF0000' : (order.type === 'PICK_UP' ? '#1976D2' : '#FF9800')}
                                />
                                <Text style={styles.companyName}>{order.companyName}</Text>
                              </View>
                              <View style={styles.timeContainer}>
                                <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                                <Text style={styles.deliveryTime}>{order.deliveryTime}</Text>
                              </View>
                            </View>
                            
                            <View style={styles.jobContent}>
                              <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                                <Text style={[styles.infoLabel, { width: 80 }]}>District:</Text>
                                <View style={styles.districtBadge}>
                                  <Text style={styles.districtText}>{order.district}</Text>
                                </View>
                              </View>
                              <View style={[styles.infoRow, { marginTop: 4 }]}>
                                <MaterialCommunityIcons name="package-variant" size={16} color="#666" />
                                <Text style={[styles.infoLabel, { width: 80 }]}>Pieces:</Text>
                                <View style={styles.piecesContainer}>
                                  <Text style={[
                                    styles.piecesText,
                                    order.isDone ? styles.piecesTextDone : 
                                    order.isHold ? styles.piecesTextHold :
                                    order.type === 'PICK_UP' ? styles.piecesTextHighlight : null
                                  ]}>
                                    {order.isDone ? `DONE • ${order.pieces} PCS` :
                                     order.isHold ? `${order.pieces} PCS` :
                                     order.type === 'PICK_UP' ? `ECT ${order.pieces} PCS` :
                                     `${order.pieces} PCS`}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="office-building" size={16} color="#666" />
                                <Text style={[styles.infoLabel, { width: 80 }]}>Address:</Text>
                                <Text style={styles.infoValue}>{order.address}</Text>
                              </View>
                            </View>
                              </>
                            )}
                            <TouchableOpacity 
                              style={styles.orderInfoButton}
                              onPress={() => setSelectedOrderDetail(order)}
                            >
                              <MaterialCommunityIcons name="information" size={16} color="#1976D2" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.addToTruckButton}
                              onPress={() => handleAddToTruck(order)}
                              accessibilityLabel="Press will add this order to the selected truck"
                            >
                              <MaterialCommunityIcons name="plus" size={14} color="#4CAF50" />
                            </TouchableOpacity>
                          </View>
                            </React.Fragment>
                        ))}
                      </View>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Date picker popup */}
      {isDatePickerVisible && (
        <Modal
          visible={isDatePickerVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsDatePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <TouchableOpacity 
                  onPress={() => setIsDatePickerVisible(false)}
                  style={styles.closeButton}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                mode="single"
                date={selectedDate}
                onChange={({ date }) => {
                  setSelectedDate(date);
                  setIsDatePickerVisible(false);
                }}
                locale="zh"
                style={{ borderRadius: 8 }}
                classNames={{
                  day: 'hover:bg-blue-100',
                  selected: 'bg-blue-500 border-blue-500',
                  selected_label: 'text-white',
                }}
              />
            </View>
          </View>
        </Modal>
      )}
      {selectedOrderDetail && (
        <JobDetailModal
          isVisible={!!selectedOrderDetail}
          onClose={() => setSelectedOrderDetail(null)}
          job={selectedOrderDetail}
        />
      )}
      {showAddOrderModal && (
        <AddOrderModal
          isVisible={showAddOrderModal}
          onClose={() => setShowAddOrderModal(false)}
          onAddOrder={handleAddOrder}
        />
      )}
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 15,
    gap: 15,
    height: '100%',
  },
  leftPanel: {
    width: '14.28%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: '100%',
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 15,
  },
  panel: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: '100%',
  },
  containerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
    minWidth: 150,
  },
  containerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  truckCardGrid: {
    padding: 15,
    gap: 15,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 15,
  },
  truckCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  freeLabel: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  counter: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'space-between',
  },
  counterText: {
    fontSize: 10,
    color: '#666',
  },
  counterNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
    marginLeft: 4,
  },
  cardContent: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    color: '#666',
    fontSize: 12,
    width: 80,  // 固定宽度以对齐
  },
  infoValue: {
    color: '#333',
    fontSize: 10,
    flex: 1,
    flexWrap: 'wrap',
  },
  districtsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  districtBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  districtText: {
    color: '#1976D2',
    fontSize: 12,
  },
  selectedTruckCard: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  jobCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:10,
  },
  jobHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  deliveryTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  jobContent: {
    gap: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.23)',
    padding: 2,
    borderRadius: 8,
  },
  jobsGrid: {
    padding: 15,
  },
  noSelection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noSelectionText: {
    color: '#666',
    fontSize: 16,
  },
  dragHandle: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    zIndex: 1000,
  },
  doneLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  doneLabelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  jobsDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
    marginHorizontal: 15,
  },
  doneToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 15,
    borderRadius: 4,
    gap: 8,
  },
  doneToggleText: {
    fontSize: 14,
    color: '#666',
  },
  doneCount: {
    color: '#999',
  },
  statusLabel: {
    position: 'absolute',
    top: -1,
    left: 0,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    flexShrink: 0,
  },
  filterSelect: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  filterOptionSelected: {
    backgroundColor: '#E3F2FD',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
    flexShrink: 0,
  },
  filterOptionTextSelected: {
    color: '#1976D2',
  },
  orderGroup: {
    marginBottom: 15,
  },
  groupHeader: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  groupHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  groupCount: {
    fontSize: 14,
    color: '#666',
  },
  groupContent: {
    paddingTop: 15,
    paddingHorizontal: 15,
  },
  gridCard: {
    width: 280,
    marginBottom: 0,
  },
  holdCard: {
    opacity: 0.8,
    borderColor: '#FF0000',
    borderWidth: 1,
    paddingTop: 20,
  },
  holdJobsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB6C1',
  },
  doneJobsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#F0FFF0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90EE90',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  datePickerContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  toolbarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // 使用 space-between 来分隔左右内容
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  addOrderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cleanCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FF5722',
    borderRadius: 4,
  },
  cleanCacheButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  leftPanelTitle: {
    backgroundColor: '#E3F2FD',
  },
  middlePanelTitle: {
    backgroundColor: '#F3E5F5',
  },
  rightPanelTitle: {
    backgroundColor: '#E8F5E9',
  },
  selectedTruckLabel: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  listViewContainer: {
    gap: 8,
  },
  listViewItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listViewLeft: {
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  listViewTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listViewType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  listViewTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listViewCenter: {
    flex: 1,
    gap: 4,
  },
  listViewCompany: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  listViewAddress: {
    fontSize: 12,
    color: '#666',
  },
  listViewRight: {
    width: 80,
    alignItems: 'center',
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceTypeLabel: {
    fontSize: 10,
    marginLeft: 8,
    opacity: 0.9,
  },
  serviceTypeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  serviceTypeText: {
    fontSize: 14,
    color: '#666',
    flexShrink: 0,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineHorizontalLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  timelineContent: {
    flexDirection: 'column',
    gap: 4,
  },
  timelineText: {
    fontSize: 14,
    color: '#666',
  },
  addressesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addressBox: {
    flexDirection: 'column',
    gap: 4,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  remarkContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB6C1',
  },
  remarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remarkTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  remarkText: {
    fontSize: 12,
    color: '#666',
  },
  detailModal: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 800,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    paddingTop: 20,
    gap: 20,
    maxHeight: Dimensions.get('window').height * 0.85,
    overflowY: 'auto',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  infoButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceTypeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTypeContent: {
    marginLeft: 12,
  },
  serviceTypeTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  serviceTypeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timelinePath: {
    paddingLeft: 8,
  },
  timelinePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#666',
  },
  timelineTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
  },
  addressCardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  addressArrow: {
    marginHorizontal: 4,
  },
  addressContent: {
    gap: 8,
  },
  companyNameLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  samedayAddressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 8,
    gap: 8,
  },
  samedayAddressItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  samedayAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  samedayAddressLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  samedayTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  samedayTime: {
    fontSize: 12,
    color: '#666',
  },
  samedayAddressText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  samedayAddressArrow: {
    marginTop: 20,
  },
  samedayDeliveryContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F0F7FF',
    borderColor: '#1976D2',
    borderWidth: 1,
    minHeight: 220,
  },
  samedayWatermark: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    top: '52%',
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(244, 67, 54, 0.15)',
    zIndex: 0,
    
  },
  remarkCard: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFB74D',
    marginTop: 'auto',
  },
  modalScrollView: {
    maxHeight: '80%',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  timelineVerticalLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
  },
  orderInfoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1976D2',
    zIndex: 100,
  },
  listViewInfoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1976D2',
    zIndex: 100,
  },
  listViewSamedayInfoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1976D2',
    zIndex: 100,
  },
  samedayContent: {
    flex: 1,
    zIndex: 1,
  },
  samedayHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 8,
  },
  samedayTimeline: {
    marginTop: 8,
    gap: 8,
    paddingHorizontal: 8,
  },
  samedayTimelinePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  samedayTimelineConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#E0E0E0',
    marginLeft: 22,
  },
  samedayTimelineCompany: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  samedayTimelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flex: 1,
  },
  samedayTimelineContent: {
    flex: 1,
  },
  samedayTimelineCompanyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  samedayTimelineTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  samedayTimelineAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  samedayTimeIcon: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  samedayTimeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  orderSamedayWatermark: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    top: '52%',
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(244, 67, 54, 0.15)',
    zIndex: 0,
    
  },
  orderSamedayContent: {
    flex: 1,
    marginTop: 4,
    zIndex: 1,
    paddingTop: 4,
  },
  orderSamedayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  orderSamedayTimeline: {
    marginTop: 8,
    gap: 4,
    paddingHorizontal: 4,
  },
  orderSamedayTimelinePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'transparent',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderSamedayTimelineConnector: {
    width: 2,
    height: 12,
    backgroundColor: '#E0E0E0',
    marginLeft: 18,
  },
  orderSamedayTimelineCompany: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  orderSamedayTimelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  orderSamedayTimelineContent: {
    flex: 1,
  },
  orderSamedayTimelineCompanyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  orderSamedayTimelineTitle: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  orderSamedayTimelineAddress: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  orderSamedayTimeIcon: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  orderSamedayTimeText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
  },
  // Add SAMEDAY list mode styles
  listViewSamedayItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'stretch',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#1976D2',
    position: 'relative',
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  listViewSamedayWatermark: {
    position: 'absolute',
    width: '100%',
    textAlign: 'left',
    top: '57%',
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(244, 67, 54, 0.15)',
    zIndex: 0,
    
  },
  listViewSamedayContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 1,
    marginTop: 16, // Add top margin for label space
  },
  listViewSamedayTimeColumn: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  listViewSamedayTimeBlock: {
    backgroundColor: '#F0F7FF',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  listViewSamedayTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  listViewSamedayTimeLabel: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 2,
    backgroundColor: '#1976D2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listViewSamedayArrow: {
    alignSelf: 'center',
    color: '#1976D2',
    marginVertical: 4,
  },
  listViewSamedayAddressColumn: {
    flex: 1,
    gap: 12,
  },
  listViewSamedayAddressBlock: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  listViewSamedayAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  listViewSamedayAddressTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  listViewSamedayCompanyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  listViewSamedayAddress: {
    fontSize: 12,
    color: '#666',
  },
  listViewSamedayServiceType: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#1976D2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomRightRadius: 8,
    zIndex: 2,
  },
  listViewSamedayServiceTypeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listViewSamedayInfoButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    zIndex: 2,
  },
  formRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  formColumn: {
    flex: 1,
  },
  districtButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  } as ViewStyle,
  districtButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  } as TextStyle,
  districtModal: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    alignSelf: 'center',
  } as ViewStyle,
  districtModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  } as ViewStyle,
  districtModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  } as TextStyle,
  districtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  } as ViewStyle,
  districtGridItem: {
    width: '23%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  } as ViewStyle,
  districtGridItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  } as ViewStyle,
  districtGridItemText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  } as TextStyle,
  districtGridItemTextSelected: {
    color: '#1976D2',
    fontWeight: '500',
  } as TextStyle,
  customDistrictSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  } as ViewStyle,
  customDistrictLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  } as TextStyle,
  customDistrictInput: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  } as ViewStyle,
  customDistrictButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  } as ViewStyle,
  customDistrictButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  } as TextStyle,
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  } as TextStyle,
  holdInTruckButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF0000',
    borderWidth: 1,
  },
  holdInTruckButtonText: {
    color: '#FF0000',
    fontWeight: '500',
  },
  timeDatePicker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  dateTimePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dateTimePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  dateTimePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
  },
  dateTimePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webDateTimePickerContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  } as any,
  webDateTimePicker: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  } as any,
  addOrderModal: {
    backgroundColor: '#FFF',
    width: '90%',
    maxWidth: 1200,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  } as ViewStyle,
  addOrderModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  } as ViewStyle,
  addOrderModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  } as TextStyle,
  addOrderForm: {
    flex: 1,
    padding: 16,
  } as ViewStyle,
  formSection: {
    marginBottom: 24,
  } as ViewStyle,
  formSectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  } as ViewStyle,
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitleWithIcon: {
    marginBottom: 0,
  },
  formGroup: {
    marginBottom: 16,
  } as ViewStyle,
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  } as TextStyle,
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFFFFF',
  } as TextStyle,
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  } as TextStyle,
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  radioButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  radioButtonText: {
    fontSize: 14,
    color: '#666',
  },
  radioButtonTextSelected: {
    color: '#1976D2',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  submitButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  piecesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  piecesText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  piecesTextHighlight: {
    color: '#1976D2',
  },
  piecesTextDone: {
    color: '#4CAF50',
  },
  piecesTextHold: {
    color: '#FF0000',
  },
  listViewInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  listViewAddressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  crewInfo: {
    marginTop: 8, // 减小上边距
    padding: 6, // 减小内边距
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  crewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4, // 减小标题和内容的间距
  },
  crewTitle: {
    fontSize: 11, // 减小标题字体
    color: '#666',
    fontWeight: '500',
  },
  crewDetails: {
    gap: 2, // 减小各块之间的间距
  },
  crewMemberBlock: {
    marginBottom: 2, // 减小块之间的间距
  },
  crewIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2, // 减小图标行的下边距
  },
  crewRoleLabel: {
    fontSize: 10, // 减小角色标签字体
    color: '#666',
    fontWeight: '500',
  },
  crewDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16, // 减小左内边距
    paddingVertical: 3, // 减小上下内边距
    paddingHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  crewName: {
    fontSize: 11, // 减小名字字体
    color: '#333',
    flex: 1,
  },
  crewPhone: {
    fontSize: 10, // 减小电话号码字体
    color: '#666',
    marginLeft: 8,
  },
  membersList: {
    gap: 2, // 减小成员列表项间距
  },
  editCrewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6, // 减小按钮上边距
    padding: 6, // 减小按钮内边距
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  editCrewButtonText: {
    fontSize: 11, // 减小按钮文字
    color: '#1976D2',
    fontWeight: '500',
  },
  crewModal: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  crewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  crewModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  crewModalContent: {
    maxHeight: 400,
  },
  crewInputGroup: {
    marginBottom: 16,
  },
  crewInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  crewInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  memberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  removeMemberButton: {
    padding: 8,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  addMemberButtonText: {
    fontSize: 14,
    color: '#1976D2',
  },
  crewModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  crewModalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  crewModalCancelButton: {
    backgroundColor: '#F5F5F5',
  },
  crewModalSaveButton: {
    backgroundColor: '#1976D2',
  },
  crewModalCancelButtonText: {
    fontSize: 14,
    color: '#666',
  },
  crewModalSaveButtonText: {
    fontSize: 14,
    color: '#FFF',
  },
  phoneNumber: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  crewSelectContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  crewSelect: {
    height: 40,
    width: '100%',
  },
  crewInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  crewSelectModal: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
  },
  crewSelectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  crewSelectModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  crewSelectModalContent: {
    gap: 16,
  },
  crewSelectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  crewSelectOptionTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  crewSelectOptionDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  rosterModal: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    width: '95%',
    maxWidth: 800,
    maxHeight: '95%',
  },
  rosterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 12,
  },
  rosterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  rosterModalContent: {
    maxHeight: 600,
  },
  rosterItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
  },
  rosterItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 12,
  },
  rosterItemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  rosterMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rosterRoleText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  rosterMemberName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  rosterMemberPhone: {
    fontSize: 13,
    color: '#666',
  },
  rosterMembersSection: {
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  rosterItemContent: {
    padding: 8,
    gap: 8,
    backgroundColor: '#F5F5F5',
  },
  piecesInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  piecesInput: {
    width: 80,  // 減小寬度
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',  // 文字置中
  },
  piecesLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  piecesLabelText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  piecesLabelHighlight: {
    backgroundColor: '#E3F2FD',
  },
  piecesLabelTextHighlight: {
    color: '#1976D2',
  },
  measurementsContainer: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1976D2',  // 改為藍色邊框
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#E3F2FD',  // 改為淺藍色背景
  },
  measurementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',  // 改為藍色標題
    marginBottom: 12,
  },
  measurementsScrollView: {
    maxHeight: 300,
  },
  measurementItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#90CAF9',  // 改為較淺的藍色邊框
    shadowColor: '#1976D2',  // 添加藍色陰影
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  measurementItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976D2',  // 改為藍色標題
    marginBottom: 8,
  },
  measurementLabel: {
    fontSize: 12,
    color: '#1976D2',  // 改為藍色標籤
    marginBottom: 4,
    fontWeight: '500',  // 加粗標籤
  },
  measurementRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  weightContainer: {
    flex: 1,
  },
  dimensionsContainer: {
    flex: 2,
  },
  dimensionsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dimensionInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  dimensionSeparator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 4,
  },
  measurementInput: {
    borderWidth: 1,
    borderColor: '#90CAF9',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    width: 120,  // 稍微加寬以適應小數
  },
  airwayBillContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  airwayBillField: {
    flex: 1,
  },
  airwayBillInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#90CAF9',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 1,
  },
  airwayBillSection: {
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#90CAF9',
    overflow: 'hidden',
  },
  airwayBillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderBottomWidth: 1,
    borderBottomColor: '#90CAF9',
  },
  airwayBillTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  airwayBillContent: {
    padding: 16,
    gap: 16,
  },
  airwayBillField: {
    gap: 8,
  },
  airwayBillLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  airwayBillInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#90CAF9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  airwayBillIcon: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRightWidth: 1,
    borderRightColor: '#90CAF9',
  },
  airwayBillInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    letterSpacing: 1,
  },
  airwayBillHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Air Waybill Card Styles
  airWaybillCard: {
    backgroundColor: '#F8F9FA',
    borderColor: '#90CAF9',
  },
  airWaybillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  airWaybillTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  airWaybillContent: {
    gap: 12,
  },
  airWaybillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  airWaybillLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  airWaybillValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },

  // Cargo Details Card Styles
  cargoDetailsCard: {
    backgroundColor: '#F8F9FA',
    borderColor: '#90CAF9',
  },
  cargoDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cargoDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  cargoDetailsContent: {
    gap: 12,
  },
  cargoItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  cargoItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  cargoItemDetails: {
    gap: 8,
  },
  cargoWeight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cargoDimensions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cargoLabel: {
    fontSize: 14,
    color: '#666',
    width: 140,
  },
  cargoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  sealNumberContainer: {
    flex: 1,
    marginRight: 16,
  },
  sealNumberInput: {
    borderWidth: 1,
    borderColor: '#90CAF9',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  cargoSealNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 4,
    borderRadius: 4,
  },
  addToTruckButton: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
    zIndex: 100,
  },
  addToTruckButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
    zIndex: 100,
  },
}); 