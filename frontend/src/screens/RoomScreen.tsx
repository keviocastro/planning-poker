import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Modal, Alert, Linking, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { socket } from '../utils/socket';
import { Users, RotateCcw, Eye, History, CheckCircle, X, LogOut, Settings, ExternalLink, Search, RefreshCcw } from 'lucide-react-native';
import { useIntl } from 'react-intl';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface JiraField {
  id: string;
  name: string;
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
  const [showJiraSettings, setShowJiraSettings] = useState(false);
  
  // Jira State
  const [jiraDomain, setJiraDomain] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [jiraSelectedField, setJiraSelectedField] = useState('');
  const [jiraFields, setJiraFields] = useState<JiraField[]>([]);
  const [isSearchingJira, setIsSearchingJira] = useState(false);
  const [isFetchingFields, setIsFetchingFields] = useState(false);

  useEffect(() => {
    loadJiraSettings();
    socket.connect();
    socket.emit('join_room', { roomId, userName });

    socket.on('room_update', (state: RoomState) => {
      setRoomState(state);
      if (!state.isRevealed && state.participants.every(p => p.vote === null)) {
        setMyVote(null);
      }
    });

    socket.on('jira_issue_data', (data) => {
      setIsSearchingJira(false);
      socket.emit('update_story', { roomId, title: `${data.key}: ${data.summary}` });
    });

    socket.on('jira_fields_data', (fields: JiraField[]) => {
      setIsFetchingFields(false);
      setJiraFields(fields);
    });

    socket.on('jira_update_success', (key) => {
      console.log('Jira issue updated:', key);
    });

    socket.on('jira_error', (error) => {
      setIsSearchingJira(false);
      setIsFetchingFields(false);
      Alert.alert('Jira Error', error);
    });

    return () => {
      socket.off('room_update');
      socket.off('jira_issue_data');
      socket.off('jira_fields_data');
      socket.off('jira_update_success');
      socket.off('jira_error');
      socket.disconnect();
    };
  }, [roomId, userName]);

  const loadJiraSettings = async () => {
    try {
      const domain = await AsyncStorage.getItem('jira_domain');
      const email = await AsyncStorage.getItem('jira_email');
      const token = await AsyncStorage.getItem('jira_token');
      const field = await AsyncStorage.getItem('jira_selected_field');
      if (domain) setJiraDomain(domain);
      if (email) setJiraEmail(email);
      if (token) setJiraToken(token);
      if (field) setJiraSelectedField(field);
    } catch (e) {}
  };

  const saveJiraSettings = async () => {
    try {
      await AsyncStorage.setItem('jira_domain', jiraDomain);
      await AsyncStorage.setItem('jira_email', jiraEmail);
      await AsyncStorage.setItem('jira_token', jiraToken);
      await AsyncStorage.setItem('jira_selected_field', jiraSelectedField);
      setShowJiraSettings(false);
    } catch (e) {}
  };

  const fetchJiraFields = () => {
    if (!jiraDomain || !jiraEmail || !jiraToken) {
      Alert.alert('Missing Info', 'Please fill in domain, email and token first.');
      return;
    }
    setIsFetchingFields(true);
    socket.emit('fetch_jira_fields', { domain: jiraDomain, email: jiraEmail, token: jiraToken });
  };

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

  const handleSearchJira = () => {
    if (!jiraToken || !roomState?.storyTitle) return;
    const match = roomState.storyTitle.match(/([A-Z]+-[0-9]+)/i);
    if (match) {
      const issueKey = match[1].toUpperCase();
      setIsSearchingJira(true);
      socket.emit('fetch_jira_issue', {
        domain: jiraDomain,
        email: jiraEmail,
        token: jiraToken,
        issueKey
      });
    } else {
      Alert.alert('Invalid Key', 'Please enter a valid Jira issue key (e.g., PROJ-123)');
    }
  };

  const handleOpenJira = (title: string) => {
    if (!title || !jiraDomain) return;
    const match = title.match(/([A-Z]+-[0-9]+)/i);
    if (match) {
      const cleanDomain = jiraDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      Linking.openURL(`https://${cleanDomain}/browse/${match[1].toUpperCase()}`);
    }
  };

  const handleConfirm = (average: string) => {
    socket.emit('confirm_estimation', { roomId, average });
    
    // Auto-update Jira if integrated
    if (jiraToken && jiraSelectedField && roomState?.storyTitle) {
      const match = roomState.storyTitle.match(/([A-Z]+-[0-9]+)/i);
      if (match && average !== 'N/A' && average !== '?' && average !== '☕') {
        socket.emit('update_jira_estimate', {
          domain: jiraDomain,
          email: jiraEmail,
          token: jiraToken,
          issueKey: match[1].toUpperCase(),
          fieldId: jiraSelectedField,
          value: average
        });
      }
    }
  };

  const handleLeave = async () => {
    try {
      await AsyncStorage.removeItem('last_room_id');
      navigation.navigate('Home' as never);
    } catch (e) {}
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

  const jiraIssueMatch = roomState.storyTitle ? roomState.storyTitle.match(/([A-Z]+-[0-9]+)/i) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.roomLabel}>{intl.formatMessage({ id: 'room.roomId' })}</Text>
          <Text style={styles.roomId}>{roomId}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowHistory(true)}>
            <History size={20} color="#666" />
          </TouchableOpacity>
          {isCurrentUserAdmin && (
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowJiraSettings(true)}>
              <Settings size={20} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.headerBtn, styles.leaveBtn]} onPress={handleLeave}>
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
        ListHeaderComponent={
          <View>
             <Text style={styles.sectionTitle}>{intl.formatMessage({ id: 'room.participants' })}</Text>
             {roomState.storyTitle ? (
               <View style={styles.currentStoryBadge}>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                   <Text style={[styles.currentStoryText, { flex: 1 }]}>{roomState.storyTitle}</Text>
                   {jiraIssueMatch && jiraDomain && (
                     <TouchableOpacity onPress={() => handleOpenJira(roomState.storyTitle)} style={styles.jiraLinkBtn}>
                        <ExternalLink size={16} color="#4a90e2" />
                        <Text style={styles.jiraLinkLabel}>{intl.formatMessage({ id: 'room.openInJira' })}</Text>
                     </TouchableOpacity>
                   )}
                 </View>
               </View>
             ) : null}
          </View>
        }
      />

      <View style={styles.footer}>
        {roomState.isRevealed && (
          <View style={styles.resultsSummary}>
             <Text style={styles.sectionTitle}>{intl.formatMessage({ id: 'room.resultsIn' })}</Text>
             
             {isCurrentUserAdmin && (
               <View>
                 <View style={styles.storyInputContainer}>
                   <TextInput
                     style={styles.storyInput}
                     placeholder={intl.formatMessage({ id: 'room.storyTitle' })}
                     value={roomState.storyTitle}
                     onChangeText={handleUpdateStory}
                     autoCapitalize="characters"
                     onSubmitEditing={handleSearchJira}
                     returnKeyType="search"
                   />
                   <TouchableOpacity 
                     style={[styles.searchJiraBtn, (!jiraToken || !roomState.storyTitle) && styles.searchJiraDisabled]} 
                     onPress={handleSearchJira}
                     disabled={!jiraToken || isSearchingJira}
                   >
                     {isSearchingJira ? <ActivityIndicator color="#fff" size="small" /> : <Search size={20} color="#fff" />}
                   </TouchableOpacity>
                 </View>
                 {isSearchingJira && <Text style={styles.searchingText}>{intl.formatMessage({ id: 'room.jiraSearching' })}</Text>}
               </View>
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

      {/* Jira Settings Modal */}
      <Modal visible={showJiraSettings} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{intl.formatMessage({ id: 'room.jiraSettings' })}</Text>
              <TouchableOpacity onPress={() => setShowJiraSettings(false)}>
                <X size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 500 }}>
              <TextInput
                style={styles.modalInput}
                placeholder={intl.formatMessage({ id: 'room.jiraDomain' })}
                value={jiraDomain}
                onChangeText={setJiraDomain}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.modalInput}
                placeholder={intl.formatMessage({ id: 'room.jiraEmail' })}
                value={jiraEmail}
                onChangeText={setJiraEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.modalInput}
                placeholder={intl.formatMessage({ id: 'room.jiraToken' })}
                value={jiraToken}
                onChangeText={setJiraToken}
                secureTextEntry
              />
              
              <TouchableOpacity 
                style={styles.linkContainer} 
                onPress={() => Linking.openURL('https://id.atlassian.com/manage-profile/security/api-tokens')}
              >
                <Text style={styles.linkText}>{intl.formatMessage({ id: 'room.jiraTokenLink' })}</Text>
                <ExternalLink size={14} color="#4a90e2" />
              </TouchableOpacity>

              <View style={styles.fieldSelectionArea}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={styles.sectionSubtitle}>{intl.formatMessage({ id: 'room.jiraSelectField' })}</Text>
                  <TouchableOpacity style={styles.fetchFieldsBtn} onPress={fetchJiraFields}>
                    {isFetchingFields ? <ActivityIndicator size="small" color="#4a90e2" /> : <RefreshCcw size={16} color="#4a90e2" />}
                    <Text style={styles.fetchFieldsText}>{intl.formatMessage({ id: 'room.jiraFetchFields' })}</Text>
                  </TouchableOpacity>
                </View>

                {jiraFields.length > 0 && (
                  <View style={styles.fieldsList}>
                    {jiraFields.map(f => (
                      <TouchableOpacity 
                        key={f.id} 
                        style={[styles.fieldOption, jiraSelectedField === f.id && styles.fieldOptionSelected]}
                        onPress={() => setJiraSelectedField(f.id)}
                      >
                        <Text style={[styles.fieldOptionText, jiraSelectedField === f.id && styles.fieldOptionTextSelected]}>{f.name}</Text>
                        {jiraSelectedField === f.id && <CheckCircle size={14} color="#fff" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={saveJiraSettings}>
              <Text style={styles.saveBtnText}>{intl.formatMessage({ id: 'room.save' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
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
                renderItem={({ item }) => {
                  const hasJiraKey = item.title.match(/([A-Z]+-[0-9]+)/i);
                  return (
                    <View style={styles.historyItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyStory}>{item.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={styles.historyDate}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                          {hasJiraKey && jiraDomain && (
                            <TouchableOpacity onPress={() => handleOpenJira(item.title)} style={styles.historyJiraLink}>
                              <ExternalLink size={12} color="#4a90e2" />
                              <Text style={styles.historyJiraText}>{intl.formatMessage({ id: 'room.openInJira' })}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <View style={styles.historyEstimate}>
                        <Text style={styles.historyEstimateText}>{item.estimate}</Text>
                      </View>
                    </View>
                  );
                }}
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
    gap: 10,
  },
  headerBtn: {
    padding: 8,
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
  },
  leaveBtn: {
    backgroundColor: '#fff1f0',
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
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  currentStoryBadge: {
    backgroundColor: '#eef6ff',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
    marginBottom: 20,
  },
  currentStoryText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  jiraLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4a90e2',
    marginLeft: 10,
    gap: 4,
  },
  jiraLinkLabel: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: '600',
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
    flex: 1,
  },
  storyInputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
  },
  searchJiraBtn: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchJiraDisabled: {
    backgroundColor: '#ccc',
  },
  searchingText: {
    fontSize: 12,
    color: '#4a90e2',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  resultDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
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
    maxHeight: '90%',
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
  modalInput: {
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 20,
  },
  linkText: {
    color: '#4a90e2',
    textDecorationLine: 'underline',
  },
  fieldSelectionArea: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    marginBottom: 20,
  },
  fetchFieldsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fetchFieldsText: {
    color: '#4a90e2',
    fontSize: 12,
    fontWeight: '600',
  },
  fieldsList: {
    marginTop: 10,
    gap: 8,
  },
  fieldOption: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldOptionSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  fieldOptionText: {
    color: '#333',
    fontSize: 14,
  },
  fieldOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  historyJiraLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyJiraText: {
    color: '#4a90e2',
    fontSize: 11,
    fontWeight: '600',
  },
  historyEstimate: {
    backgroundColor: '#eef6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 45,
    alignItems: 'center',
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
