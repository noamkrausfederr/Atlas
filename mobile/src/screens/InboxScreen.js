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
      <View style={styles.header}>
        <Text style={styles.title}>inbox</Text>
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
                  <View style={styles.threadAvatar} />
                )}
                <View style={styles.threadBody}>
                  <View style={styles.threadMeta}>
                    {thread.unreadCount > 0 ? (
                      <View style={styles.unreadBadge}>
                        <BlurView intensity={28} tint="extraLight" style={styles.unreadBadgeBlur} />
                        <Text style={styles.unreadBadgeText}>{formatUnreadCount(thread.unreadCount)}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.threadTopRow}>
                    <Text style={styles.threadName}>{thread.ownerName}</Text>
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
            placeholderTextColor="#8A8A84"
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
    flex: 1,
    backgroundColor: '#F4F0EB'
  },
  threadListScroll: {
    flex: 1,
    backgroundColor: '#F4F0EB'
  },
  threadListContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20
  },
  header: {
    marginBottom: 8,
    paddingLeft: 8
  },
  title: {
    color: '#2B2927',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  threadList: {
    gap: 12
  },
  threadCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFDF8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4DED6',
    padding: 14,
    minHeight: 92
  },
  threadCardActive: {
    borderColor: '#E4DED6',
    backgroundColor: '#FFFDF8'
  },
  threadAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E4DED6',
    alignSelf: 'center'
  },
  threadAvatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E4DED6',
    alignSelf: 'center'
  },
  threadBody: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
    paddingRight: 62
  },
  threadTopRow: {
    marginBottom: 2,
    paddingRight: 0
  },
  threadName: {
    color: '#2B2927',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    paddingRight: 8,
    fontFamily: 'Nunito_700Bold'
  },
  threadMeta: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 56,
    alignItems: 'center',
    flexShrink: 0
  },
  unreadBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -14,
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4DED6',
    backgroundColor: 'transparent'
  },
  unreadBadgeBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244,240,235,0.82)'
  },
  unreadBadgeText: {
    color: '#2B2927',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Nunito_700Bold'
  },
  threadHandle: {
    color: '#8C867E',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: 'Nunito_400Regular'
  },
  threadPreview: {
    flex: 1,
    minWidth: 0,
    color: '#8C867E',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular'
  },
  emptyState: {
    backgroundColor: '#FFFDF8',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E4DED6',
    padding: 22,
    alignItems: 'center'
  },
  emptyStateTitle: {
    color: '#2B2927',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    fontFamily: 'Nunito_800ExtraBold'
  },
  emptyStateText: {
    color: '#8C867E',
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
    backgroundColor: '#F4F0EB'
  },
  chatScroll: {
    flex: 1
  },
  chatHeaderDivider: {
    height: 1,
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#D8D8D2'
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
    color: '#4A4A4A',
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
    backgroundColor: '#E4DED6'
  },
  chatProfileAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E4DED6'
  },
  chatTitle: {
    color: '#2B2927',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Nunito_800ExtraBold'
  },
  chatHandle: {
    marginTop: 2,
    color: '#8C867E',
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
    borderColor: '#E4DED6',
    backgroundColor: 'transparent',
    overflow: 'hidden'
  },
  chatDayBadgeBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244,240,235,0.82)'
  },
  chatDayBadgeText: {
    color: '#8C867E',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular'
  },
  emptyChatState: {
    alignItems: 'center',
    paddingTop: 28
  },
  emptyChatText: {
    color: '#8C867E',
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E4E4DE'
  },
  chatBubbleIncomingBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.66)'
  },
  chatBubbleOutgoing: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E4E4DE'
  },
  chatBubbleOutgoingBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.72)'
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular'
  },
  chatBubbleTextIncoming: {
    color: '#2B2927'
  },
  chatBubbleTextOutgoing: {
    color: '#2B2927'
  },
  chatMessageTime: {
    marginTop: 5,
    color: '#8C867E',
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
    borderColor: '#E4DED6',
    backgroundColor: 'transparent'
  },
  chatInputBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244,240,235,0.82)'
  },
  chatInput: {
    paddingLeft: 18,
    paddingRight: 16,
    paddingVertical: 14,
    color: '#2B2927',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular'
  },
  sendButton: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4DED6',
    backgroundColor: 'transparent'
  },
  sendButtonBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244,240,235,0.82)'
  },
  sendButtonText: {
    color: '#8C867E',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    fontFamily: 'Nunito_400Regular'
  }
});
