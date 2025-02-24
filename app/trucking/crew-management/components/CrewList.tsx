import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CrewMember } from '../types';

interface CrewListProps {
  crewMembers: CrewMember[];
  selectedMemberId: string | null;
  onSelectMember: (member: CrewMember) => void;
  onShowDetails: (member: CrewMember) => void;
}

export default function CrewList({ 
  crewMembers, 
  selectedMemberId, 
  onSelectMember,
  onShowDetails 
}: CrewListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="account-group" size={20} color="#1976D2" />
          <Text style={styles.title}>Crew Members</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add Member</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {/* Filter controls here */}
      </View>

      <ScrollView style={styles.list}>
        {crewMembers.map(member => (
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

            {member.isArmoredCertified && (
              <View style={styles.certificationBadge}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#1976D2" />
                <Text style={styles.certificationText}>Armored Certified</Text>
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
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const getTypeColor = (type: string) => {
  switch (type) {
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 4,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  memberCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#1976D2',
    backgroundColor: '#F5F9FF',
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
}); 