import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CrewMember {
  id: string;
  staffId: string;
  name: string;
  type: 'Leader' | 'Driver' | 'Guard';
  phone: string;
  email: string;
  joinedDate: string;
  isGunCertified: boolean;
  status: 'Active' | 'On Leave' | 'Inactive';
  avatar?: string;
  skills: string[];
  documents: {
    type: string;
    number: string;
    expiryDate: string;
  }[];
}

interface CrewDetailsProps {
  member: CrewMember | null;
  onEdit?: () => void;
}

export default function CrewDetails({ member, onEdit }: CrewDetailsProps) {
  if (!member) {
    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="account-question" size={48} color="#666" />
        <Text style={styles.emptyStateText}>Select a crew member to view details</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 基本資料卡片 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <MaterialCommunityIcons name="card-account-details" size={20} color="#1976D2" />
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <MaterialCommunityIcons name="pencil" size={16} color="#1976D2" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Staff ID</Text>
            <Text style={styles.infoValue}>#{member.staffId}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(member.type) }]}>
              <Text style={styles.typeBadgeText}>{member.type}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.status) }]}>
              <Text style={styles.statusBadgeText}>{member.status}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Joined Date</Text>
            <Text style={styles.infoValue}>{new Date(member.joinedDate).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.contactInfo}>
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="phone" size={16} color="#666" />
            <Text style={styles.contactText}>{member.phone}</Text>
          </View>
          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="email" size={16} color="#666" />
            <Text style={styles.contactText}>{member.email}</Text>
          </View>
        </View>
      </View>

      {/* 技能卡片 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <MaterialCommunityIcons name="star" size={20} color="#1976D2" />
            <Text style={styles.cardTitle}>Skills & Certifications</Text>
          </View>
        </View>

        <View style={styles.skillsContainer}>
          {member.isGunCertified && (
            <View style={styles.certificationBadge}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#1976D2" />
              <Text style={styles.certificationText}>Gun Certified</Text>
            </View>
          )}
          {member.skills.map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 證件卡片 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <MaterialCommunityIcons name="file-document" size={20} color="#1976D2" />
            <Text style={styles.cardTitle}>Documents</Text>
          </View>
        </View>

        <View style={styles.documentsContainer}>
          {member.documents.map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <View style={styles.documentHeader}>
                <Text style={styles.documentType}>{doc.type}</Text>
                <Text style={styles.documentNumber}>{doc.number}</Text>
              </View>
              <View style={styles.documentExpiry}>
                <MaterialCommunityIcons name="calendar" size={14} color="#666" />
                <Text style={styles.expiryText}>
                  Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return '#E8F5E9';
    case 'On Leave':
      return '#FFF3E0';
    case 'Inactive':
      return '#FFEBEE';
    default:
      return '#F5F5F5';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#E3F2FD',
  },
  editButtonText: {
    fontSize: 14,
    color: '#1976D2',
  },
  infoGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    width: '45%',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactInfo: {
    padding: 16,
    paddingTop: 0,
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
  skillsContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  certificationText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  skillText: {
    fontSize: 12,
    color: '#333',
  },
  documentsContainer: {
    padding: 16,
    gap: 12,
  },
  documentItem: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  documentNumber: {
    fontSize: 14,
    color: '#666',
  },
  documentExpiry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    color: '#666',
  },
}); 