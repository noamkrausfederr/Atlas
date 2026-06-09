import { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { BackButton } from '../components/BackButton';

export function WelcomeScreen({ onLoginPress, onCreateAccountPress, onTermsPress, hideTerms = false }) {
  return (
    <View style={styles.welcomeScreen}>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeMainContent}>
          <Text style={styles.welcomeBrandText}>
            Atlas<Text style={styles.welcomeBrandDot}>.</Text>
          </Text>

          <Image
            source={require('../../assets/welcome/ChatGPT Image Jun 9, 2026, 04_16_41 PM.png')}
            style={styles.welcomeImage}
            resizeMode="contain"
          />

          <View style={styles.welcomeActions}>
            <TouchableOpacity style={styles.welcomePrimaryButton} activeOpacity={0.85} onPress={onLoginPress}>
              <Ionicons name="mail" size={19} color="#ffffff" />
              <Text style={styles.welcomePrimaryButtonText}>LOGIN WITH EMAIL</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.welcomeSignupRow} activeOpacity={0.7} onPress={onCreateAccountPress}>
            <Text style={styles.welcomeSignupText}>{"Don't have an account ? "}</Text>
            <Text style={styles.welcomeSignupAccent}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {!hideTerms ? (
          <TouchableOpacity style={styles.welcomeTermsWrap} activeOpacity={0.75} onPress={onTermsPress}>
            <Text style={styles.welcomeTermsText}>By continuing you agree to our</Text>
            <Text style={styles.welcomeTermsAccent}>Terms & Privacy Policy</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function LoginScreen({ onBack, onSubmit, onCreateAccountPress, isPopup = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');

  const handleForgotPasswordPress = () => {
    const trimmedEmail = email.trim().toLowerCase();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!trimmedEmail || !isEmailValid) {
      setForgotPasswordMessage('');
      setForgotPasswordError('Enter a valid email first.');
      return;
    }

    setForgotPasswordError('');
    setForgotPasswordMessage(`Password reset link sent to ${trimmedEmail}.`);
  };

  return (
    <KeyboardAvoidingView style={isPopup ? styles.loginOverlayScreen : styles.signupScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.loginPopupScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginPopupCard}>
          <View style={styles.loginPopupHeader}>
            <BackButton onPress={onBack} />
          </View>

          <View style={styles.loginPopupContent}>
            <Text style={styles.signupTitle}>Log in</Text>
            <Text style={styles.signupSubtitle}>Welcome back!</Text>

            <View style={styles.signupFieldGroup}>
              <TextInput
                style={styles.signupInput}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (forgotPasswordMessage) setForgotPasswordMessage('');
                  if (forgotPasswordError) setForgotPasswordError('');
                }}
                placeholder="Email"
                placeholderTextColor="#B8B8B8"
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            <View style={styles.signupFieldGroup}>
              <TextInput
                style={styles.signupInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#B8B8B8"
                secureTextEntry
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity style={styles.loginForgotLink} activeOpacity={0.7} onPress={handleForgotPasswordPress}>
              <Text style={styles.loginForgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {forgotPasswordError ? (
              <Text style={styles.loginForgotErrorText}>{forgotPasswordError}</Text>
            ) : null}

            {forgotPasswordMessage ? (
              <Text style={styles.loginForgotSuccessText}>{forgotPasswordMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.signupButton}
              activeOpacity={0.85}
              onPress={() => onSubmit?.({ email, password })}
            >
              <Text style={styles.signupButtonText}>LOG IN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signupSwitchLink} activeOpacity={0.7} onPress={onCreateAccountPress}>
              <Text style={styles.signupSwitchText}>
                Don't have an account? <Text style={styles.signupSwitchAccent}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function CreateAccountScreen({ onBack, onSubmit, onLoginPress, existingUsernames = [], existingEmails = [], isPopup = false }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupAttemptFailed, setSignupAttemptFailed] = useState(false);
  const [signupErrorMessage, setSignupErrorMessage] = useState('');
  const trimmedName = name.trim();
  const trimmedUsername = username.trim().toLowerCase();
  const trimmedEmail = email.trim().toLowerCase();
  const normalizedTakenUsernames = existingUsernames.map((item) => item.trim().toLowerCase());
  const normalizedTakenEmails = existingEmails.map((item) => item.trim().toLowerCase());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const isUsernameAvailable = trimmedUsername.length > 0 && !normalizedTakenUsernames.includes(trimmedUsername);
  const isEmailAvailable = trimmedEmail.length > 0 && !normalizedTakenEmails.includes(trimmedEmail);
  const isSignupReady =
    trimmedName.length > 0 &&
    trimmedUsername.length > 0 &&
    trimmedEmail.length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    isEmailValid &&
    isUsernameAvailable &&
    isEmailAvailable &&
    password === confirmPassword;

  const handleSignupPress = () => {
    if (!isSignupReady) {
      setSignupAttemptFailed(true);
      if (!isUsernameAvailable) {
        setSignupErrorMessage('That username is already taken.');
      } else if (!isEmailAvailable) {
        setSignupErrorMessage('That email is already taken.');
      } else if (!isEmailValid) {
        setSignupErrorMessage('Please enter a valid email address.');
      } else if (password !== confirmPassword) {
        setSignupErrorMessage('Passwords do not match.');
      } else {
        setSignupErrorMessage('Please fill in all fields.');
      }
      return;
    }

    setSignupAttemptFailed(false);
    setSignupErrorMessage('');
    onSubmit?.({ name: trimmedName, username: trimmedUsername, email: trimmedEmail, password, confirmPassword });
  };

  return (
    <KeyboardAvoidingView style={isPopup ? styles.loginOverlayScreen : styles.signupScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={isPopup ? styles.loginPopupScrollContent : styles.signupScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={isPopup ? [styles.loginPopupCard, styles.signupPopupCard] : null}>
          <View style={isPopup ? styles.loginPopupHeader : styles.signupTopSpace}>
            <View style={isPopup ? undefined : styles.signupBackWrap}>
              <BackButton onPress={onBack} />
            </View>
            {!isPopup ? (
              <View style={styles.signupHeroCard}>
                <Image
                  source={require('../../assets/welcome/ChatGPT Image Jun 9, 2026, 04_16_41 PM.png')}
                  style={styles.signupTopImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}
          </View>

          <View style={isPopup ? styles.loginPopupContent : styles.signupContent}>
            <Text style={styles.signupTitle}>Sign up</Text>
            <Text style={styles.signupSubtitle}>Create an account, It's free!</Text>

          <View style={styles.signupFieldGroup}>
            <TextInput
              style={styles.signupInput}
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor="#B8B8B8"
              returnKeyType="next"
            />
          </View>

          <View style={styles.signupFieldGroup}>
            <TextInput
              style={styles.signupInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor="#B8B8B8"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.signupFieldGroup}>
            <TextInput
              style={styles.signupInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#B8B8B8"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={styles.signupFieldGroup}>
            <TextInput
              style={styles.signupInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#B8B8B8"
              secureTextEntry
              returnKeyType="next"
            />
          </View>

          <View style={styles.signupFieldGroup}>
            <TextInput
              style={styles.signupInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password"
              placeholderTextColor="#B8B8B8"
              secureTextEntry
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity
            style={[styles.signupButton, signupAttemptFailed && !isSignupReady && styles.signupButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleSignupPress}
          >
            <Text style={styles.signupButtonText}>SIGN UP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupSwitchLink} activeOpacity={0.7} onPress={onLoginPress}>
            <Text style={styles.signupSwitchText}>
              Already have an account? <Text style={styles.signupSwitchAccent}>Log In</Text>
            </Text>
          </TouchableOpacity>

          {signupErrorMessage ? (
            <Text style={styles.signupErrorText}>{signupErrorMessage}</Text>
          ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const policySections = [
  {
    title: 'Terms of Use',
    body:
      'By using Atlas, you agree to use the app responsibly, provide accurate account information, and keep your login details secure. You may not misuse the app, copy other people’s content without permission, or use Atlas for unlawful activity.'
  },
  {
    title: 'Your Content',
    body:
      'You keep ownership of the trips, notes, links, and profile details you add to Atlas. By posting content in the app, you give Atlas permission to display and organize it inside the product so your boards, profile, and shared experiences work as expected.'
  },
  {
    title: 'Privacy',
    body:
      'Atlas may store account details such as your name, username, email address, profile information, saved trips, and content you create in the app. This information is used to run your account, personalize the product, and support core features like profiles, boards, and sign in.'
  },
  {
    title: 'Sharing and Visibility',
    body:
      'Trips and profile content you choose to make public can be visible to other people in the app. Content marked private should stay visible only to you within the app experience.'
  },
  {
    title: 'Security and Contact',
    body:
      'Atlas works to protect your information, but no service can promise perfect security. If you believe your account has been compromised or you need help with privacy questions, contact the Atlas support team before continuing to use the app.'
  }
];

export function TermsPrivacyOverlay({ onClose }) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.policyOverlay}>
        <View style={styles.policyCard}>
          <View style={styles.policyHeader}>
            <BackButton onPress={onClose} />
            <View style={styles.policyHeaderTextWrap}>
              <Text style={styles.policyTitle}>Terms & Privacy</Text>
              <Text style={styles.policySubtitle}>Atlas app policy</Text>
            </View>
          </View>

          <ScrollView
            style={styles.policyScroll}
            contentContainerStyle={styles.policyScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.policyIntro}>
              These terms explain how Atlas should be used and how your information is handled inside the app.
            </Text>

            {policySections.map((section) => (
              <View key={section.title} style={styles.policySection}>
                <Text style={styles.policySectionTitle}>{section.title}</Text>
                <Text style={styles.policySectionBody}>{section.body}</Text>
              </View>
            ))}

            <Text style={styles.policyFootnote}>
              Continued use of Atlas means you agree to these terms and privacy practices.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  welcomeScreen: {
    flex: 1,
    backgroundColor: '#FCF3EC',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 28
  },
  welcomeCard: {
    flex: 1,
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'transparent',
    borderRadius: 34,
    paddingHorizontal: 26,
    paddingTop: 110,
    paddingBottom: 18,
    alignItems: 'center',
  },
  welcomeMainContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  welcomeImage: {
    width: 340,
    height: 207,
    marginTop: 18,
    marginBottom: 0
  },
  welcomeActions: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: 18
  },
  welcomeBrandText: {
    marginBottom: -6,
    fontSize: 56,
    lineHeight: 60,
    fontFamily: 'Gaya',
    color: '#FF3C37',
    letterSpacing: -1.2
  },
  welcomeBrandDot: {
    color: '#FF3C37'
  },
  welcomePrimaryButton: {
    width: '76%',
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: '#F26B64',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  welcomePrimaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    letterSpacing: 1.6
  },
  welcomeSecondaryButton: {
    width: '86%',
    minHeight: 52,
    borderRadius: 999,
    backgroundColor: '#FF3C37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  welcomeSecondaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    letterSpacing: 1.5
  },
  welcomeSignupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 24
  },
  welcomeSignupText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400'
  },
  welcomeSignupAccent: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  welcomeTermsWrap: {
    marginTop: 'auto',
    marginBottom: 24,
    alignItems: 'center'
  },
  welcomeTermsText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400'
  },
  welcomeTermsAccent: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    marginTop: 2
  },
  authScreen: {
    flex: 1,
    backgroundColor: colors.background
  },
  signupScreen: {
    flex: 1,
    backgroundColor: '#FCF3EC'
  },
  loginOverlayScreen: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  loginPopupScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 28,
    justifyContent: 'center'
  },
  loginPopupCard: {
    width: '100%',
    maxWidth: 332,
    height: '69%',
    alignSelf: 'center',
    backgroundColor: '#FCF3EC',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    shadowColor: '#B9A09B',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  signupPopupCard: {
    height: '90%'
  },
  loginPopupHeader: {
    paddingTop: 14,
    paddingHorizontal: 14,
    alignItems: 'flex-start'
  },
  loginPopupContent: {
    flex: 1,
    width: '80%',
    alignSelf: 'center',
    paddingTop: 8,
    paddingBottom: 22
  },
  signupScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 34,
    paddingTop: 0,
    paddingBottom: 0
  },
  signupTopSpace: {
    height: 156,
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative'
  },
  signupBackWrap: {
    alignSelf: 'flex-start',
    position: 'absolute',
    top: 18,
    left: 0,
    zIndex: 3
  },
  signupHeroCard: {
    marginTop: -54,
    width: '100%',
    height: 186,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  signupTopImage: {
    width: '100%',
    height: 186,
    alignSelf: 'center',
    marginTop: 10
  },
  signupContent: {
    flex: 1,
    width: '88%',
    alignSelf: 'center',
    marginTop: -8
  },
  signupTitle: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    marginTop: 0
  },
  signupSubtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Nunito_500Medium',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 38
  },
  signupFieldGroup: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E4',
    marginBottom: 36
  },
  signupInput: {
    height: 36,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito_500Medium',
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  signupButton: {
    width: 265,
    minHeight: 52,
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#F26B64',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18
  },
  loginForgotLink: {
    alignSelf: 'flex-end',
    marginTop: -18,
    marginBottom: 8
  },
  loginForgotText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_500Medium',
    fontWeight: '500'
  },
  loginForgotErrorText: {
    alignSelf: 'flex-end',
    color: '#C9524E',
    fontSize: 13,
    lineHeight: 17,
    marginBottom: 6,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600'
  },
  loginForgotSuccessText: {
    alignSelf: 'flex-end',
    color: '#6B8A48',
    fontSize: 13,
    lineHeight: 17,
    marginBottom: 6,
    textAlign: 'right',
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600'
  },
  signupButtonDisabled: {
    opacity: 0.45
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    letterSpacing: 1.6
  },
  signupSwitchLink: {
    alignItems: 'center',
    marginTop: 12
  },
  signupSwitchText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Nunito_500Medium',
    fontWeight: '500'
  },
  signupSwitchAccent: {
    color: colors.text,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700'
  },
  signupErrorText: {
    marginTop: 14,
    textAlign: 'center',
    color: '#C65B5B',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_600SemiBold',
    fontWeight: '600'
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
  },
  policyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(63, 36, 28, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32
  },
  policyCard: {
    width: '100%',
    maxWidth: 360,
    height: '82%',
    backgroundColor: '#FCF3EC',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    shadowColor: '#B9A09B',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10
  },
  policyHeaderTextWrap: {
    flex: 1
  },
  policyTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 29,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800'
  },
  policySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Nunito_500Medium',
    fontWeight: '500',
    marginTop: 2
  },
  policyScroll: {
    flex: 1,
    minHeight: 0
  },
  policyScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24
  },
  policyIntro: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Nunito_500Medium',
    fontWeight: '500',
    marginBottom: 18
  },
  policySection: {
    marginBottom: 16
  },
  policySectionTitle: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 21,
    fontFamily: 'Nunito_700Bold',
    fontWeight: '700',
    marginBottom: 6
  },
  policySectionBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Nunito_400Regular',
    fontWeight: '400'
  },
  policyFootnote: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Nunito_500Medium',
    fontWeight: '500',
    marginTop: 2
  }
});
