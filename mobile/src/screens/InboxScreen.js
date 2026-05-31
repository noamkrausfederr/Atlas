import {
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { BlurView } from 'expo-blur';

const TAG_COLORS = [
  { bg: 'rgba(211,182,211,0.30)', text: '#D3B6D3' },
  { bg: 'rgba(109,184,190,0.40)', text: '#6DB8BE' },
  { bg: 'rgba(165,187,26,0.30)',  text: '#A5BB1A' },
];

function formatHandle(ownerName) {
  return `@${ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
}

function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatUnreadCount(count) {
  if (!count) return '';
  return count > 99 ? '99' : String(count);
}

function getMessageDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatMessageTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatMessageDayLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function ThreadList({ threads, selectedProfileName, onSelectThread }) {
  return (
    <ScrollView
      style={styles.threadListScroll}
      contentContainerStyle={styles.threadListContent}
      showsVerticalScrollIndicator={false}
    >
      {threads.length > 0 ? (
        <View style={styles.threadList}>
          {threads.map((thread, idx) => {
            const isActive = thread.ownerName === selectedProfileName;
            const initial = thread.ownerName?.[0]?.toUpperCase() ?? '?';
            const tagColor = TAG_COLORS[idx % TAG_COLORS.length];
            return (
              <TouchableOpacity
                key={thread.ownerName}
                style={[styles.threadCard, isActive && styles.threadCardActive]}
                activeOpacity={0.88}
                onPress={() => onSelectThread(thread.ownerName)}
              >
                {/* Avatar with unread badge */}
                <View style={styles.threadAvatarWrap}>
                  {thread.image ? (
                    <Image source={{ uri: thread.image }} style={styles.threadAvatarImage} />
                  ) : (
                    <View style={styles.threadAvatar}>
                      <Text style={styles.threadAvatarInitial}>{initial}</Text>
                    </View>
                  )}
                  {thread.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{formatUnreadCount(thread.unreadCount)}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Thread content */}
                <View style={styles.threadBody}>
                  <View style={styles.threadTopRow}>
                    <Text style={styles.threadName} numberOfLines={1}>{thread.ownerName}</Text>
                    <Text style={styles.threadTime}>{formatRelativeTime(thread.lastMessageAt)}</Text>
                  </View>
                  <Text style={styles.threadPreview} numberOfLines={2} ellipsizeMode="tail">
                    {thread.lastMessageText}
                  </Text>
                  {thread.tripName ? (
                    <View style={[styles.threadTripTag, { backgroundColor: tagColor.bg }]}>
                      <Text style={[styles.threadTripTagText, { color: tagColor.text }]}>{thread.tripName}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No messages yet</Text>
          <Text style={styles.emptyStateText}>Start a conversation from a public profile.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function ChatScreen({ profile, messages, onBack, onSendMessage }) {
  const [draftMessage, setDraftMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const chatItems = useMemo(() => {
    const items = [];
    let previousDayKey = '';

    messages.forEach((message) => {
      const dayKey = getMessageDayKey(message.createdAt);
      if (dayKey && dayKey !== previousDayKey) {
        items.push({
          type: 'day',
          id: `day-${dayKey}`,
          label: formatMessageDayLabel(message.createdAt)
        });
        previousDayKey = dayKey;
      }

      items.push({
        type: 'message',
        ...message
      });
    });

    return items;
  }, [messages]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const sendMessage = () => {
    const nextText = draftMessage.trim();
    if (!nextText) return;

    onSendMessage(profile.ownerName, nextText);
    setDraftMessage('');
  };

  return (
    <View style={styles.chatScreen}>
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.backButtonArrow}>←</Text>
        </TouchableOpacity>
        {profile.image ? (
          <Image source={{ uri: profile.image }} style={styles.chatProfilePhoto} />
        ) : (
          <View style={styles.chatProfileAvatarFallback} />
        )}
        <View style={styles.chatHeaderText}>
          <Text style={styles.chatTitle}>{profile.ownerName}</Text>
          <Text style={styles.chatHandle}>{profile.handle}</Text>
        </View>
      </View>

      <View style={styles.chatHeaderDivider} />

      <ScrollView
        style={styles.chatScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chatMessages}
      >
        {chatItems.length > 0 ? chatItems.map((item) => (
          item.type === 'day' ? (
            <View key={item.id} style={styles.chatDayRow}>
              <View style={styles.chatDayBadge}>
                <BlurView intensity={28} tint="extraLight" style={styles.chatDayBadgeBlur} />
                <Text style={styles.chatDayBadgeText}>{item.label}</Text>
              </View>
            </View>
          ) : (
            <View
              key={item.id}
              style={[styles.chatBubbleRow, item.incoming ? styles.chatBubbleRowLeft : styles.chatBubbleRowRight]}
            >
              <View style={[styles.chatBubbleStack, item.incoming ? styles.chatBubbleStackLeft : styles.chatBubbleStackRight]}>
                <View style={[styles.chatBubble, item.incoming ? styles.chatBubbleIncoming : styles.chatBubbleOutgoing]}>
                  <BlurView
                    intensity={28}
                    tint="extraLight"
                    style={item.incoming ? styles.chatBubbleIncomingBlur : styles.chatBubbleOutgoingBlur}
                  />
                  <Text style={[styles.chatBubbleText, item.incoming ? styles.chatBubbleTextIncoming : styles.chatBubbleTextOutgoing]}>
                    {item.text}
                  </Text>
                </View>
                <Text style={[styles.chatMessageTime, item.incoming ? styles.chatMessageTimeLeft : styles.chatMessageTimeRight]}>
                  {formatMessageTime(item.createdAt)}
                </Text>
              </View>
            </View>
          )
        )) : (
          <View style={styles.emptyChatState}>
            <Text style={styles.emptyChatText}>Say hi to start the chat.</Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.chatComposer,
          { bottom: keyboardHeight > 0 ? keyboardHeight + 8 : 14 }
        ]}
      >
        <View style={styles.chatInputWrap}>
          <BlurView intensity={28} tint="extraLight" style={styles.chatInputBlur} />
          <TextInput
            placeholder="Message..."
            placeholderTextColor="#8a8987"
            value={draftMessage}
            onChangeText={setDraftMessage}
            style={styles.chatInput}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>
        <TouchableOpacity style={styles.sendButton} activeOpacity={0.9} onPress={sendMessage}>
          <BlurView intensity={28} tint="extraLight" style={styles.sendButtonBlur} />
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function InboxScreen({
  profileDirectory,
  threads,
  selectedProfileName,
  isThreadOpen,
  onSelectThread,
  onCloseThread,
  onSendMessage,
  onNavigateToTab
}) {
  const threadList = useMemo(
    () => Object.values(threads)
      .filter((thread) => (thread.messages?.length ?? 0) > 0)
      .map((thread) => ({
        ...thread,
        image: profileDirectory[thread.ownerName]?.image ?? null
      }))
      .sort((left, right) => new Date(right.lastMessageAt) - new Date(left.lastMessageAt)),
    [profileDirectory, threads]
  );

  const activeThread = selectedProfileName ? threads[selectedProfileName] ?? null : null;
  const activeProfile = selectedProfileName
    ? profileDirectory[selectedProfileName] ?? {
      ownerName: selectedProfileName,
      handle: formatHandle(selectedProfileName),
      image: null
    }
    : null;
  const unreadCount = threadList
    .filter((thread) => thread.ownerName !== selectedProfileName && thread.unreadCount > 0)
    .length;

  if (isThreadOpen && activeProfile) {
    return (
      <ChatScreen
        profile={activeProfile}
        messages={activeThread?.messages ?? []}
        onBack={onCloseThread}
        onSendMessage={onSendMessage}
      />
    );
  }

  return (
    <View style={styles.inboxScreen}>
      <View style={styles.inboxTopHeader}>
        <View style={styles.inboxTabRow}>
          <View style={[styles.inboxTabPill, styles.inboxTabPillActive]}>
            <Text style={[styles.inboxTabText, styles.inboxTabTextActive]}>Inbox</Text>
          </View>
          <TouchableOpacity style={styles.inboxTabPill} onPress={() => onNavigateToTab?.('Profile')} activeOpacity={0.75}>
            <Text style={styles.inboxTabText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inboxTabPill} onPress={() => onNavigateToTab?.('Profile')} activeOpacity={0.75}>
            <Text style={styles.inboxTabText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ThreadList
        threads={threadList}
        selectedProfileName={selectedProfileName}
        onSelectThread={onSelectThread}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inboxScreen: {
    flex: 1,
    backgroundColor: '#f3f2ef'
  },
  inboxTopHeader: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14
  },
  inboxTabRow: {
    flexDirection: 'row',
    gap: 8
  },
  inboxTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#ddd5c8',
    borderWidth: 1,
    borderColor: '#ddd5c8'
  },
  inboxTabPillActive: {
    backgroundColor: '#EFCE7B',
    borderColor: '#EFCE7B'
  },
  inboxTabText: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
    color: '#8a7a6a'
  },
  inboxTabTextActive: {
    color: '#ffffff'
  },
  inboxTabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3
  },
  inboxTabBadgeText: {
    color: '#1c1b18',
    fontSize: 9,
    fontWeight: '800'
  },
  threadListScroll: {
    flex: 1,
    backgroundColor: '#f3f2ef'
  },
  threadListContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 24
  },
  threadList: {
    gap: 9
  },
  threadCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#edebe8',
    padding: 15,
    shadowColor: '#2c2b28',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1
  },
  threadCardActive: {
    borderColor: '#d4cfc9',
    backgroundColor: '#fafaf8'
  },
  threadAvatarWrap: {
    position: 'relative',
    alignSelf: 'flex-start'
  },
  threadAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0ede8',
    alignItems: 'center',
    justifyContent: 'center'
  },
  threadAvatarInitial: {
    fontSize: 19,
    fontWeight: '800',
    color: '#888480',
    fontFamily: 'Nunito_800ExtraBold'
  },
  threadAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8e5e0'
  },
  unreadBadge: {
    position: 'absolute',
    bottom: -1,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EFCE7B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff'
  },
  unreadBadgeText: {
    color: '#2c2b28',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Nunito_700Bold'
  },
  threadBody: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center'
  },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  threadName: {
    color: '#1a1918',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold',
    flex: 1,
    marginRight: 8
  },
  threadTime: {
    color: '#a09d9a',
    fontSize: 11,
    fontWeight: '400',
    fontFamily: 'Nunito_400Regular',
    flexShrink: 0
  },
  threadPreview: {
    color: '#6e6c69',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular'
  },
  threadTripTag: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#f0ede8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  threadTripTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7a7770',
    fontFamily: 'Nunito_600SemiBold'
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e8e5e0',
    padding: 22,
    alignItems: 'center'
  },
  emptyStateTitle: {
    color: '#2c2b28',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    fontFamily: 'Nunito_800ExtraBold'
  },
  emptyStateText: {
    color: '#8a8987',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular'
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingTop: 20
  },
  chatScreen: {
    flex: 1,
    backgroundColor: '#f3f2ef'
  },
  chatScroll: {
    flex: 1
  },
  chatHeaderDivider: {
    height: 1,
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#e8e5e0'
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    height: 28,
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  backButtonArrow: {
    color: '#7a7770',
    fontSize: 26,
    lineHeight: 26,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: 'Nunito_700Bold'
  },
  chatHeaderText: {
    flex: 1,
    minWidth: 0
  },
  chatProfilePhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8e5e0'
  },
  chatProfileAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8e5e0'
  },
  chatTitle: {
    color: '#2c2b28',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  chatHandle: {
    marginTop: 2,
    color: '#8a8987',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Nunito_400Regular'
  },
  chatMessages: {
    gap: 9,
    paddingHorizontal: 18,
    paddingBottom: 96
  },
  chatDayRow: {
    alignItems: 'center',
    marginBottom: 4
  },
  chatDayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e8e5e0',
    backgroundColor: '#f0efed'
  },
  chatDayBadgeBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent'
  },
  chatDayBadgeText: {
    color: '#8a8987',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular'
  },
  emptyChatState: {
    alignItems: 'center',
    paddingTop: 28
  },
  emptyChatText: {
    color: '#8a8987',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular'
  },
  chatBubbleRow: {
    flexDirection: 'row'
  },
  chatBubbleRowLeft: {
    justifyContent: 'flex-start'
  },
  chatBubbleRowRight: {
    justifyContent: 'flex-end'
  },
  chatBubbleStack: {
    maxWidth: '82%'
  },
  chatBubbleStackLeft: {
    alignItems: 'flex-start'
  },
  chatBubbleStackRight: {
    alignItems: 'flex-end'
  },
  chatBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    overflow: 'hidden'
  },
  chatBubbleIncoming: {
    backgroundColor: '#f0efed',
    borderWidth: 1,
    borderColor: '#e8e5e0'
  },
  chatBubbleIncomingBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent'
  },
  chatBubbleOutgoing: {
    backgroundColor: '#2c2b28',
    borderWidth: 0
  },
  chatBubbleOutgoingBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent'
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular'
  },
  chatBubbleTextIncoming: {
    color: '#2c2b28'
  },
  chatBubbleTextOutgoing: {
    color: '#ffffff'
  },
  chatMessageTime: {
    marginTop: 5,
    color: '#8a8987',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Nunito_400Regular'
  },
  chatMessageTimeLeft: {
    paddingLeft: 10,
    textAlign: 'left'
  },
  chatMessageTimeRight: {
    paddingRight: 10,
    textAlign: 'right'
  },
  chatComposer: {
    position: 'absolute',
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'transparent'
  },
  chatInputWrap: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e5e0',
    backgroundColor: 'transparent'
  },
  chatInputBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240,239,237,0.92)'
  },
  chatInput: {
    paddingLeft: 18,
    paddingRight: 16,
    paddingVertical: 14,
    color: '#2c2b28',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular'
  },
  sendButton: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    overflow: 'hidden',
    backgroundColor: '#ffba30'
  },
  sendButtonBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent'
  },
  sendButtonText: {
    color: '#2c2b28',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold'
  }
});
