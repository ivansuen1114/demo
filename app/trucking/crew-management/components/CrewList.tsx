import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrewMember } from '../types';

interface CrewListProps {
  crewMembers: CrewMember[];
  selectedMemberId: string | null;
  onSelectMember: (member: CrewMember) => void;
  onShowDetails: (member: CrewMember) => void;
  onShowPDALogin: (member: CrewMember) => void;
}

export default function CrewList({ 
  crewMembers, 
  selectedMemberId, 
  onSelectMember,
  onShowDetails,
  onShowPDALogin
}: CrewListProps) {
  const [searchText, setSearchText] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<CrewMember['type'][]>([]);

  const positions: CrewMember['type'][] = [
    'Senior Crew Leader',
    'Leader',
    'Driver',
    'Guard'
  ];

  const filteredMembers = crewMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchText.toLowerCase()) ||
      member.staffId.toLowerCase().includes(searchText.toLowerCase());
    const matchesPosition = selectedPositions.length === 0 || selectedPositions.includes(member.type);
    return matchesSearch && matchesPosition;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="account-group" size={20} color="#1976D2" />
          <Text style={styles.title}>Crew Members</Text>
        </View>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search..."
              placeholderTextColor="#999"
            />
            {searchText ? (
              <TouchableOpacity
                onPress={() => setSearchText('')}
                style={styles.clearButton}
              >
                <MaterialCommunityIcons name="close-circle" size={16} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showFilter && styles.filterButtonActive
            ]}
            onPress={() => setShowFilter(!showFilter)}
          >
            <MaterialCommunityIcons 
              name="filter-variant" 
              size={20} 
              color={showFilter ? "#1976D2" : "#666"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {showFilter && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Position</Text>
          <View style={styles.filterOptions}>
            {positions.map(position => (
              <TouchableOpacity
                key={position}
                style={[
                  styles.filterOption,
                  selectedPositions.includes(position) && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setSelectedPositions(prev =>
                    prev.includes(position)
                      ? prev.filter(p => p !== position)
                      : [...prev, position]
                  );
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedPositions.includes(position) && styles.filterOptionTextSelected
                ]}>
                  {position}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView style={styles.list}>
        {filteredMembers.map(member => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.memberCard,
              selectedMemberId === member.id && styles.selectedCard
            ]}
            onPress={() => onSelectMember(member)}
          >
            <View style={styles.memberHeader}>
              <View style={styles.avatarContainer}>
                {member.avatar ? (
                  <Image 
                    source={{ uri: member.avatar }} 
                    style={styles.avatar} 
                  />
                ) : (
                  <MaterialCommunityIcons 
                    name="account-circle" 
                    size={40} 
                    color="#666" 
                  />
                )}
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: member.status === 'Active' ? '#4CAF50' : '#FFA000' }
                ]} />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.staffId}>#{member.staffId}</Text>
              </View>
              <View style={[
                styles.typeBadge,
                { backgroundColor: getTypeColor(member.type) }
              ]}>
                <Text style={styles.typeText}>{member.type}</Text>
              </View>
            </View>
            
            <View style={styles.memberDetails}>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="phone" size={16} color="#666" />
                <Text style={styles.detailText}>{member.phone}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="calendar" size={16} color="#666" />
                <Text style={styles.detailText}>
                  Joined: {new Date(member.joinedDate).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {member.isGunCertified && (
              <View style={styles.certificationBadge}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#1976D2" />
                <Text style={styles.certificationText}>Gun Certified</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.infoButton}
              onPress={(e) => {
                e.stopPropagation();
                onShowDetails(member);
              }}
            >
              <MaterialCommunityIcons name="information" size={16} color="#1976D2" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.pdaLoginButton}
              onPress={(e) => {
                e.stopPropagation();
                onShowPDALogin(member);
              }}
            >
              <MaterialCommunityIcons name="tablet" size={16} color="#1976D2" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Senior Crew Leader':
      return '#E1F5FE';
    case 'Leader':
      return '#E3F2FD';
    case 'Driver':
      return '#E8F5E9';
    case 'Guard':
      return '#FFF3E0';
    default:
      return '#F5F5F5';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    position: 'relative',
    shadowColor: '#1976D2',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E3F2FD',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#1976D2',
  },
  selectedCard: {
    backgroundColor: '#F5F9FF',
    borderColor: '#1976D2',
    shadowColor: '#1976D2',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statusIndicator: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  staffId: {
    fontSize: 12,
    color: '#666',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1976D2',
  },
  memberDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  certificationText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
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
  },
  pdaLoginButton: {
    position: 'absolute',
    right: 40,
    bottom: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 8,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 8,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#666',
  },
  filterOptionTextSelected: {
    color: '#1976D2',
    fontWeight: '500',
  },
}); 