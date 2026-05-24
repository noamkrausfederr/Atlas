import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMemo } from 'react';

function buildInboxThreads(publicTrips, followedProfileNames) {
  const owners = Array.from(new Set(publicTrips.map((trip) => trip.ownerName)));
  const prioritized = [
    ...followedProfileNames.filter((name) => owners.includes(name)),
    ...owners.filter((name) => !followedProfileNames.includes(name))
  ];

  return prioritized.slice(0, 8).map((ownerName, index) => ({
    ownerName,
    handle: `@${ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '')}`,
    preview: followedProfileNames.includes(ownerName)
      ? 'Thanks for following. Happy to swap trip ideas anytime.'
      : 'Open a conversation about shared itineraries and favorite spots.',
    time: index === 0 ? 'Now' : `${index + 1}h`
  }));
}

function buildChatMessages(ownerName) {
  const firstPlace = ownerName.split(' ')[0];
  return [
    {
      id: `${ownerName}-1`,
      author: ownerName,
      incoming: true,
      text: `Hey! Thanks for reaching out. I keep a running list of favorite spots for each trip.`
    },
    {
      id: `${ownerName}-2`,
      author: 'You',
      incoming: false,
      text: `Your itineraries are so good. I wanted to ask what you’d prioritize first.`
    },
    {
      id: `${ownerName}-3`,
      author: ownerName,
      incoming: true,
      text: `${firstPlace} mornings are always my favorite. Start with the neighborhood walk, then pick one food stop and one anchor activity.`
    }
  ];
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
                <View style={styles.threadAvatar}>
                  <Text style={styles.threadAvatarText}>{thread.ownerName.slice(0, 1)}</Text>
                </View>
                <View style={styles.threadBody}>
                  <View style={styles.threadTopRow}>
                    <Text style={styles.threadName}>{thread.ownerName}</Text>
                    <Text style={styles.threadTime}>{thread.time}</Text>
                  </View>
                  <Text style={styles.threadHandle}>{thread.handle}</Text>
                  <Text style={styles.threadPreview} numberOfLines={2}>{thread.preview}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No messages yet</Text>
          <Text style={styles.emptyStateText}>Follow creators and start conversations from their public profiles.</Text>
        </View>
      )}
    </>
  );
}

function ChatScreen({ thread, onBack }) {
  const messages = useMemo(() => buildChatMessages(thread.ownerName), [thread.ownerName]);

  return (
    <View>
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.chatHeaderText}>
          <Text style={styles.chatTitle}>{thread.ownerName}</Text>
          <Text style={styles.chatHandle}>{thread.handle}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatMessages}>
        {messages.map((message) => (
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
        ))}
      </ScrollView>

      <View style={styles.chatComposer}>
        <TextInput
          placeholder={`Message ${thread.ownerName}...`}
          placeholderTextColor="#B1A294"
          style={styles.chatInput}
        />
        <TouchableOpacity style={styles.sendButton} activeOpacity={0.9}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function InboxScreen({
  publicTrips,
  followedProfileNames,
  selectedProfileName,
  isThreadOpen,
  onSelectThread,
  onCloseThread
}) {
  const threads = buildInboxThreads(publicTrips, followedProfileNames);
  const activeThread = threads.find((thread) => thread.ownerName === selectedProfileName) ?? null;

  if (isThreadOpen && activeThread) {
    return <ChatScreen thread={activeThread} onBack={onCloseThread} />;
  }

  return (
    <ThreadList
      threads={threads}
      selectedProfileName={selectedProfileName}
      onSelectThread={onSelectThread}
    />
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#FFF8F0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2D3BF',
    padding: 14
  },
  threadCardActive: {
    borderColor: '#E6A6B3',
    backgroundColor: '#FAEEE7'
  },
  threadAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D9E7D1',
    alignItems: 'center',
    justifyContent: 'center'
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  threadName: {
    color: '#4B3A32',
    fontSize: 15,
    fontWeight: '800'
  },
  threadTime: {
    color: '#A8998A',
    fontSize: 11,
    fontWeight: '700'
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
  backButton: {
    backgroundColor: '#F1E7DA',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2D3BF'
  },
  backButtonText: {
    color: '#A97C50',
    fontWeight: '800'
  },
  chatHeaderText: {
    flex: 1
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
    paddingBottom: 20
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8
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
