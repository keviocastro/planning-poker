import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { socket } from '../utils/socket';
import { Users, RotateCcw, Eye, History, CheckCircle, X, LogOut } from 'lucide-react-native';
import { useIntl } from 'react-intl';

const FIBONACCI = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'];

interface Participant {
  id: string;
  name: string;
  vote: string | null;
  isAdmin?: boolean;
}

interface HistoryItem {
  title: string;
  estimate: string;
  timestamp: string;
}

interface RoomState {
  id: string;
  participants: Participant[];
  isRevealed: boolean;
  adminId?: string;
  storyTitle: string;
  history: HistoryItem[];
}

export default function RoomScreen() {
  const intl = useIntl();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { roomId, userName } = route.params;
  
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    socket.connect();
    socket.emit('join_room', { roomId, userName });

    socket.on('room_update', (state: RoomState) => {
      setRoomState(state);
      if (!state.isRevealed && state.participants.every(p => p.vote === null)) {
        setMyVote(null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, userName]);

  const handleVote = (vote: string) => {
    setMyVote(vote);
    socket.emit('cast_vote', { roomId, vote });
  };

  const handleReveal = () => {
    socket.emit('reveal_votes', roomId);
  };

  const handleReset = () => {
    socket.emit('reset_votes', roomId);
  };

  const handleUpdateStory = (title: string) => {
    socket.emit('update_story', { roomId, title });
  };

  const handleConfirm = (average: string) => {
    socket.emit('confirm_estimation', { roomId, average });
  };

  const handleLeave = () => {
    navigation.navigate('Home' as never);
  };

  const renderParticipant = ({ item }: { item: Participant }) => {
    const hasVoted = item.vote !== null;
    const showVote = roomState?.isRevealed;

    return (
      <View style={styles.participantItem}>
        <View style={[styles.participantIcon, hasVoted && styles.participantIconVoted]}>
          <Text style={styles.participantInitial}>{item.name[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.participantName}>
          {item.name} {item.id === socket.id ? intl.formatMessage({ id: 'room.you' }) : ''} {item.isAdmin ? '👑' : ''}
        </Text>
        <View style={[styles.voteBadge, hasVoted && styles.voteBadgeVoted]}>
          <Text style={styles.voteText}>
            {showVote ? item.vote : (hasVoted ? '✓' : '?')}
          </Text>
        </View>
      </View>
    );
  };

  if (!roomState) return <View style={styles.loading}><Text>{intl.formatMessage({ id: 'room.connecting' })}</Text></View>;

  const currentUser = roomState.participants.find(p => p.id === socket.id);
  const isCurrentUserAdmin = currentUser?.isAdmin || false;

  const validVotes = roomState.participants
    .map(p => p.vote)
    .filter(v => v !== null && v !== '?' && v !== '☕')
    .map(v => Number(v))
    .filter(n => !isNaN(n));
  
  const average = validVotes.length > 0 
    ? (validVotes.reduce((a, b) => a + b, 0) / validVotes.length).toFixed(1)
    : 'N/A';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.roomLabel}>{intl.formatMessage({ id: 'room.roomId' })}</Text>
          <Text style={styles.roomId}>{roomId}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistory(true)}>
            <History size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <LogOut size={20} color="#e74c3c" />
          </TouchableOpacity>
          <View style={styles.stats}>
            <Users size={18} color="#666" />
            <Text style={styles.statsText}>{roomState.participants.length}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={roomState.participants}
        renderItem={renderParticipant}
        keyExtractor={item => item.id}
        style={styles.participantList}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>{intl.formatMessage({ id: 'room.participants' })}</Text>}
      />

      <View style={styles.footer}>
        {roomState.isRevealed && (
          <View style={styles.resultsSummary}>
             <Text style={styles.sectionTitle}>{intl.formatMessage({ id: 'room.resultsIn' })}</Text>
             
             {isCurrentUserAdmin && (
               <TextInput
                 style={styles.storyInput}
                 placeholder={intl.formatMessage({ id: 'room.storyTitle' })}
                 value={roomState.storyTitle}
                 onChangeText={handleUpdateStory}
               />
             )}

             <View style={styles.resultDetails}>
                <Text style={styles.averageValue}>
                  {intl.formatMessage({ id: 'room.average' })}: {average}
                </Text>
                {isCurrentUserAdmin && (
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirm(average)}>
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.confirmBtnText}>{intl.formatMessage({ id: 'room.confirm' })}</Text>
                  </TouchableOpacity>
                )}
             </View>
          </View>
        )}

        {!roomState.isRevealed && (
          <View>
             <Text style={styles.sectionTitle}>{intl.formatMessage({ id: 'room.castVote' })}</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsContainer}>
               {FIBONACCI.map(val => (
                 <TouchableOpacity
                   key={val}
                   style={[styles.card, myVote === val && styles.cardSelected]}
                   onPress={() => handleVote(val)}
                 >
                   <Text style={[styles.cardText, myVote === val && styles.cardTextSelected]}>{val}</Text>
                 </TouchableOpacity>
               ))}
             </ScrollView>
          </View>
        )}

        {isCurrentUserAdmin && (
          <View style={styles.controls}>
            <TouchableOpacity style={[styles.controlButton, styles.resetButton]} onPress={handleReset}>
              <RotateCcw size={20} color="#e74c3c" />
              <Text style={styles.resetButtonText}>{intl.formatMessage({ id: 'room.reset' })}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.revealButton, roomState.isRevealed && styles.buttonDisabled]} 
              onPress={handleReveal}
              disabled={roomState.isRevealed}
            >
              <Eye size={20} color="#fff" />
              <Text style={styles.revealButtonText}>{intl.formatMessage({ id: 'room.reveal' })}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={showHistory} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{intl.formatMessage({ id: 'room.history' })}</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {roomState.history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyText}>{intl.formatMessage({ id: 'room.noHistory' })}</Text>
              </View>
            ) : (
              <FlatList
                data={[...roomState.history].reverse()}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.historyItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyStory}>{item.title}</Text>
                      <Text style={styles.historyDate}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                    </View>
                    <View style={styles.historyEstimate}>
                      <Text style={styles.historyEstimateText}>{item.estimate}</Text>
                    </View>
                  </View>
                )}
              />
            )}
            
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowHistory(false)}>
              <Text style={styles.closeModalText}>{intl.formatMessage({ id: 'room.close' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  historyBtn: {
    padding: 8,
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
  },
  leaveBtn: {
    padding: 8,
    backgroundColor: '#fff1f0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffa39e',
  },
  roomLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  roomId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statsText: {
    marginLeft: 5,
    fontWeight: '600',
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  participantList: {
    flex: 1,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  participantIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e4e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantIconVoted: {
    backgroundColor: '#d4edda',
  },
  participantInitial: {
    fontWeight: 'bold',
    color: '#555',
  },
  participantName: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  voteBadge: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f2f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  voteBadgeVoted: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  voteText: {
    fontWeight: '700',
    color: '#666',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e4e8',
  },
  cardsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  card: {
    width: 60,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e1e4e8',
  },
  cardSelected: {
    borderColor: '#4a90e2',
    backgroundColor: '#eef6ff',
    transform: [{ scale: 1.05 }],
  },
  cardText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#444',
  },
  cardTextSelected: {
    color: '#4a90e2',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revealButton: {
    backgroundColor: '#4a90e2',
    flex: 2,
  },
  revealButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  resetButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  resultsSummary: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  storyInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  averageValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  confirmBtn: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    gap: 8,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyHistory: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  historyStory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
  historyEstimate: {
    backgroundColor: '#eef6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyEstimateText: {
    color: '#4a90e2',
    fontWeight: 'bold',
    fontSize: 18,
  },
  closeModalBtn: {
    marginTop: 20,
    backgroundColor: '#f0f2f5',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalText: {
    fontWeight: '700',
    color: '#333',
  }
});
