import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme';
import { BackButton } from '../components/BackButton';

export function WelcomeScreen({ onLoginPress, onCreateAccountPress }) {
  return (
    <View style={styles.welcomeScreen}>
      <Text style={styles.welcomeBrandText}>
        Atlas<Text style={styles.welcomeBrandDot}>.</Text>
      </Text>

      <View style={styles.welcomeTextGroup}>
        <Text style={styles.welcomeHeading}>
          Organize trips into boards. Discover journeys shared by travelers like you.
        </Text>
        <Text style={styles.welcomeDescription}>
          A personal, thoughtful space to plan your next adventure, save inspiring itineraries from fellow explorers, and connect with trip creators around the world.
        </Text>
      </View>

      <View style={styles.welcomeActions}>
        <TouchableOpacity style={styles.welcomePrimaryButton} activeOpacity={0.85} onPress={onLoginPress}>
          <Text style={styles.welcomePrimaryButtonText}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.welcomeSecondaryButton} activeOpacity={0.85} onPress={onCreateAccountPress}>
          <Text style={styles.welcomeSecondaryButtonText}>Create account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function LoginScreen({ onBack, onSubmit, onCreateAccountPress }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView style={styles.authScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.authScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authBrand}>
          <View style={styles.authBrandPill}>
            <Text style={styles.authBrandText}>
              Atlas<Text style={styles.authBrandDot}>.</Text>
            </Text>
          </View>
        </View>

        <View style={styles.authBackRow}>
          <BackButton onPress={onBack} />
        </View>

        <View style={styles.authFormCenter}>
          <View style={styles.editFieldGroup}>
            <Text style={styles.editLabel}>Email</Text>
            <TextInput
              style={styles.editInput}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={styles.editFieldGroup}>
            <Text style={styles.editLabel}>Password</Text>
            <TextInput
              style={styles.editInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity
            style={styles.authPrimaryButton}
            activeOpacity={0.85}
            onPress={() => onSubmit?.({ email, password })}
          >
            <Text style={styles.authPrimaryButtonText}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.authSwitchLink} activeOpacity={0.7} onPress={onCreateAccountPress}>
            <Text style={styles.authSwitchLinkText}>
              Don't have an account? <Text style={styles.authSwitchLinkAccent}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function CreateAccountScreen({ onBack, onSubmit, onLoginPress }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView style={styles.authScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.authScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authHeader}>
          <BackButton onPress={onBack} />
          <Text style={styles.authTitle}>Create account</Text>
          <View style={styles.authHeaderSpacer} />
        </View>

        <View style={styles.editFieldGroup}>
          <Text style={styles.editLabel}>Name</Text>
          <TextInput
            style={styles.editInput}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            returnKeyType="next"
          />
        </View>

        <View style={styles.editFieldGroup}>
          <Text style={styles.editLabel}>Email</Text>
          <TextInput
            style={styles.editInput}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
        </View>

        <View style={styles.editFieldGroup}>
          <Text style={styles.editLabel}>Password</Text>
          <TextInput
            style={styles.editInput}
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          style={styles.authPrimaryButton}
          activeOpacity={0.85}
          onPress={() => onSubmit?.({ name, email, password })}
        >
          <Text style={styles.authPrimaryButtonText}>Create account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.authSwitchLink} activeOpacity={0.7} onPress={onLoginPress}>
          <Text style={styles.authSwitchLinkText}>
            Already have an account? <Text style={styles.authSwitchLinkAccent}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  welcomeScreen: {
    flex: 1,
    backgroundColor: colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28
  },
  welcomeTextGroup: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 32
  },
  welcomeBrandText: {
    marginBottom: 32,
    fontSize: 72,
    fontFamily: 'Gaya',
    color: '#FF3C37',
    letterSpacing: -1.4
  },
  welcomeBrandDot: {
    color: '#FF3C37'
  },
  welcomeHeading: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Biro',
    textAlign: 'center'
  },
  welcomeDescription: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 23,
    fontFamily: 'Biro',
    textAlign: 'center'
  },
  welcomeActions: {
    alignItems: 'center',
    width: '100%',
    gap: 12
  },
  welcomePrimaryButton: {
    width: '58%',
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: '#F26B64',
    alignItems: 'center',
    justifyContent: 'center'
  },
  welcomePrimaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  welcomeSecondaryButton: {
    width: '58%',
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center'
  },
  welcomeSecondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  authScreen: {
    flex: 1,
    backgroundColor: colors.background
  },
  authScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 28
  },
  authFormCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 90
  },
  authHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26
  },
  authTitle: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 26,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800'
  },
  authBackRow: {
    marginBottom: 8
  },
  authHeaderSpacer: {
    width: 36,
    height: 36
  },
  authBrand: {
    alignItems: 'flex-start',
    marginBottom: 18
  },
  authBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceDeep
  },
  authBrandText: {
    fontSize: 22,
    fontFamily: 'Gaya',
    color: '#FF3C37',
    letterSpacing: -0.4
  },
  authBrandDot: {
    color: '#FF3C37'
  },
  editFieldGroup: {
    marginBottom: 16
  },
  editLabel: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
    marginLeft: 4,
    fontFamily: 'Nunito_700Bold',
    fontWeight: Platform.OS === 'ios' ? '700' : '800'
  },
  editInput: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceDeep,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular'
  },
  authPrimaryButton: {
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: '#F26B64',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  authPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  authSwitchLink: {
    alignItems: 'center',
    marginTop: 20
  },
  authSwitchLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular'
  },
  authSwitchLinkAccent: {
    color: '#F26B64',
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  }
});
