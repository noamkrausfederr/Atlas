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

function formatHandle(ownerName) {
  return `@${ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
}

function formatRelativeTime(value) {
  if (!value) return '';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return '';

  const diffMinutes = Math.max(Math.round((Date.now() - timestamp) / 60000), 0);
  if (diffMinutes < 1) return 'Now';
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d`;
}

function ThreadList({ threads, selectedProfileName, onSelectThread }) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Social</Text>
        <Text style={styles.title}>Inbox</Text>
      </View>

      {threads.length > 0 ? (
        <View style={styles.threadList}>
          {threads.map((thread) => {
            const isActive = thread.ownerName === selectedProfileName;
            return (
              <TouchableOpacity
                key={thread.ownerName}
                style={[styles.threadCard, isActive && styles.threadCardActive]}
                activeOpacity={0.88}
                onPress={() => onSelectThread(thread.ownerName)}
              >
                {thread.image ? (
                  <Image source={{ uri: thread.image }} style={styles.threadAvatarImage} />
                ) : (
                  <View style={styles.threadAvatar}>
                    <Text style={styles.threadAvatarText}>{thread.ownerName.slice(0, 1)}</Text>
                  </View>
                )}
                <View style={styles.threadBody}>
                  <View style={styles.threadTopRow}>
                    <Text style={styles.threadName}>{thread.ownerName}</Text>
                    <View style={styles.threadMeta}>
                      <Text style={styles.threadTime}>{formatRelativeTime(thread.lastMessageAt)}</Text>
                      {thread.unreadCount > 0 ? (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{thread.unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <Text style={styles.threadHandle}>{thread.handle}</Text>
                  <Text style={styles.threadPreview} numberOfLines={1} ellipsizeMode="tail">
                    {thread.lastMessageText}
                  </Text>
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
    </>
  );
}

function ChatScreen({ profile, messages, onBack, unreadCount, onSendMessage }) {
  const [draftMessage, setDraftMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
          <Text style={styles.backButtonArrow}>‹</Text>
          <Text style={styles.backButtonText}>{unreadCount}</Text>
        </TouchableOpacity>
        {profile.image ? <Image source={{ uri: profile.image }} style={styles.chatProfilePhoto} /> : null}
        <View style={styles.chatHeaderText}>
          <Text style={styles.chatTitle}>{profile.ownerName}</Text>
          <Text style={styles.chatHandle}>{profile.handle}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.chatScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chatMessages}
      >
        {messages.length > 0 ? messages.map((message) => (
          <View
            key={message.id}
            style={[styles.chatBubbleRow, message.incoming ? styles.chatBubbleRowLeft : styles.chatBubbleRowRight]}
          >
            <View style={[styles.chatBubble, message.incoming ? styles.chatBubbleIncoming : styles.chatBubbleOutgoing]}>
              <Text style={[styles.chatBubbleText, message.incoming ? styles.chatBubbleTextIncoming : styles.chatBubbleTextOutgoing]}>
                {message.text}
              </Text>
            </View>
          </View>
        )) : (
          <View style={styles.emptyChatState}>
            <Text style={styles.emptyChatText}>Say hi to start the chat.</Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.chatComposer,
          { bottom: keyboardHeight > 0 ? keyboardHeight + 8 : 0 }
        ]}
      >
        <TextInput
          placeholder={`Message ${profile.ownerName}...`}
          placeholderTextColor="#B1A294"
          value={draftMessage}
          onChangeText={setDraftMessage}
          style={styles.chatInput}
        />
        <TouchableOpacity style={styles.sendButton} activeOpacity={0.9} onPress={sendMessage}>
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
  onSendMessage
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
        unreadCount={unreadCount}
        onBack={onCloseThread}
        onSendMessage={onSendMessage}
      />
    );
  }

  return (
    <View style={styles.inboxScreen}>
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
    flex: 1
  },
  header: {
    marginBottom: 18
  },
  eyebrow: {
    color: '#C89B6D',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  title: {
    marginTop: 4,
    color: '#4B3A32',
    fontSize: 28,
    fontWeight: '800'
  },
  threadList: {
    gap: 12
  },
  threadCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FAEEE7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8C9D0',
    padding: 14,
    minHeight: 92
  },
  threadCardActive: {},
  threadAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D9E7D1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  threadAvatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D9E7D1'
  },
  threadAvatarText: {
    color: '#A97C50',
    fontSize: 18,
    fontWeight: '800'
  },
  threadBody: {
    flex: 1,
    minWidth: 0
  },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  threadName: {
    color: '#4B3A32',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    paddingRight: 8
  },
  threadMeta: {
    width: 40,
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0
  },
  threadTime: {
    color: '#A8998A',
    fontSize: 11,
    fontWeight: '700'
  },
  unreadBadge: {
    width: 28,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E6A6B3',
    alignItems: 'center',
    justifyContent: 'center'
  },
  unreadBadgeText: {
    color: '#FFF8F0',
    fontSize: 11,
    fontWeight: '800'
  },
  threadHandle: {
    color: '#A97C50',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6
  },
  threadPreview: {
    color: '#7A6658',
    fontSize: 13,
    lineHeight: 18
  },
  emptyState: {
    backgroundColor: '#FFF8F0',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    padding: 22,
    alignItems: 'center'
  },
  emptyStateTitle: {
    color: '#4B3A32',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6
  },
  emptyStateText: {
    color: '#7A6658',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18
  },
  chatScreen: {
    flex: 1
  },
  chatScroll: {
    flex: 1
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1E7DA',
    borderRadius: 999,
    minWidth: 70,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2D3BF'
  },
  backButtonArrow: {
    color: '#4B3A32',
    fontSize: 26,
    lineHeight: 26,
    fontWeight: '500',
    marginTop: -1
  },
  backButtonText: {
    color: '#4B3A32',
    fontSize: 17,
    fontWeight: '700'
  },
  chatHeaderText: {
    flex: 1
  },
  chatProfilePhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D9E7D1'
  },
  chatTitle: {
    color: '#4B3A32',
    fontSize: 22,
    fontWeight: '800'
  },
  chatHandle: {
    marginTop: 2,
    color: '#A97C50',
    fontSize: 13,
    fontWeight: '700'
  },
  chatMessages: {
    gap: 12,
    paddingBottom: 96
  },
  emptyChatState: {
    alignItems: 'center',
    paddingTop: 28
  },
  emptyChatText: {
    color: '#A8998A',
    fontSize: 14,
    fontWeight: '700'
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
  chatBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  chatBubbleIncoming: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#E2D3BF'
  },
  chatBubbleOutgoing: {
    backgroundColor: '#E6A6B3'
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 20
  },
  chatBubbleTextIncoming: {
    color: '#4B3A32'
  },
  chatBubbleTextOutgoing: {
    color: '#FFF8F0'
  },
  chatComposer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    backgroundColor: '#F6EFE5'
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#4B3A32'
  },
  sendButton: {
    backgroundColor: '#E6A6B3',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  sendButtonText: {
    color: '#FFF8F0',
    fontWeight: '800'
  }
});
