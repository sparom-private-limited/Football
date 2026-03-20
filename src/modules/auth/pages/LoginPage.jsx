import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Image,
  StatusBar,
} from 'react-native';
import API from '../../../api/api';
import {useAuth} from '../../../context/AuthContext';

// ─── DESIGN TOKENS ───────────────────────────
const C = {
  blue:        '#1C5CFF',
  blueDark:    '#1348D4',
  blueSoft:    '#EFF6FF',
  blueGlow:    'rgba(28,92,255,0.15)',
  pageBg:      '#F0F4FF',
  cardBg:      '#FFFFFF',
  textPrimary: '#0F172A',
  textSecond:  '#475569',
  textMuted:   '#94A3B8',
  border:      '#E2E8F0',
  borderFocus: '#1C5CFF',
  errorBg:     '#FEF2F2',
  errorBorder: '#EF4444',
  errorText:   '#EF4444',
  success:     '#10B981',
  white:       '#FFFFFF',
};

export default function LoginPage({navigation}) {
  const [mobile,        setMobile]        = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [errors,        setErrors]        = useState({});
  const [focusedField,  setFocusedField]  = useState(null);
  const [toast,         setToast]         = useState(null);

  const {login} = useAuth();

  // ── Entrance animations ──
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const cardAnim  = useRef(new Animated.Value(30)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(fadeAnim,  {toValue: 1, duration: 500, useNativeDriver: true}),
      Animated.spring(logoAnim,  {toValue: 1, damping: 14,   useNativeDriver: true}),
      Animated.spring(cardAnim,  {toValue: 0, damping: 16,   useNativeDriver: true}),
    ]).start();
  }, []);

  // ── Toast ──
  const showToast = (message, type = 'error') => {
    setToast({message, type});
    Animated.sequence([
      Animated.timing(toastAnim, {toValue: 1, duration: 300, useNativeDriver: true}),
      Animated.delay(3000),
      Animated.timing(toastAnim, {toValue: 0, duration: 300, useNativeDriver: true}),
    ]).start(() => setToast(null));
  };

  // ── Validation ──
  const validateMobile = text => {
    setMobile(text);
    if (errors.mobile) setErrors({...errors, mobile: null});
  };

  const validatePassword = text => {
    setPassword(text);
    if (errors.password) setErrors({...errors, password: null});
  };

  const validate = () => {
    const e = {};
    if (!mobile.trim())                          e.mobile   = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(mobile.trim())) e.mobile   = 'Enter a valid 10-digit number';
    if (!password.trim())                        e.password = 'Password is required';
    else if (password.length < 6)                e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Login ──
  const handleLogin = async () => {
    setErrors({});
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await API.post('/api/auth/login', {
        mobile:   mobile.trim(),
        password: password.trim(),
      });
      login(res.data.token, res.data.user);
      showToast(`Welcome back, ${res.data.user.name || 'User'}! 🎉`, 'success');
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 404)      { setErrors({mobile: 'Mobile number not registered'}); showToast('Mobile not registered. Please sign up.', 'error'); }
      else if (status === 401) { setErrors({password: 'Incorrect password'});         showToast('Incorrect password. Try again.', 'error'); }
      else if (status === 400) { showToast(message || 'Please check your inputs', 'error'); }
      else if (status === 500) { showToast('Server error. Try again later.', 'error'); }
      else if (err.request)    { showToast('No internet connection.', 'error'); }
      else                     { showToast('Unexpected error. Try again.', 'error'); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content"  />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── LOGO + APP NAME ── */}
        <Animated.View style={[styles.logoWrap, {
          opacity: fadeAnim,
          transform: [{scale: logoAnim.interpolate({inputRange: [0,1], outputRange: [0.7, 1]})}],
        }]}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../../assets/logo2.png')}
              style={styles.logoImg}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.appName}>FTBL-XI</Text>
          <Text style={styles.appTagline}>Your game. Your stats. Your team.</Text>
        </Animated.View>

        {/* ── LOGIN CARD ── */}
        <Animated.View style={[styles.card, {
          opacity: fadeAnim,
          transform: [{translateY: cardAnim}],
        }]}>

          <Text style={styles.cardTitle}>Welcome back 👋</Text>
          <Text style={styles.cardSubtitle}>Login to your account</Text>

          {/* Mobile */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'mobile' && styles.inputFocused,
              errors.mobile && styles.inputError,
            ]}>
              <View style={styles.prefixWrap}>
                <Text style={styles.prefix}>+91</Text>
                <View style={styles.prefixDivider} />
              </View>
              <TextInput
                placeholder="Enter mobile number"
                placeholderTextColor={C.textMuted}
                style={styles.input}
                value={mobile}
                onChangeText={validateMobile}
                keyboardType="numeric"
                maxLength={10}
                onFocus={() => setFocusedField('mobile')}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
            </View>
            {errors.mobile && <Text style={styles.errorTxt}>⚠️ {errors.mobile}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'password' && styles.inputFocused,
              errors.password && styles.inputError,
            ]}>
              <TextInput
                placeholder="Enter password"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={validatePassword}
                secureTextEntry={!showPassword}
                style={[styles.input, {flex: 1}]}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                disabled={loading}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorTxt}>⚠️ {errors.password}</Text>}
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <View style={styles.btnInner}>
                <ActivityIndicator color={C.white} size="small" />
                <Text style={styles.btnTxt}> Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.btnTxt}>Login →</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign up */}
          <View style={styles.signupRow}>
            <Text style={styles.signupTxt}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={loading}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>


      </ScrollView>

      {/* ── TOAST ── */}
      {toast && (
        <Animated.View style={[
          styles.toast,
          toast.type === 'success' && styles.toastSuccess,
          toast.type === 'error'   && styles.toastError,
          toast.type === 'info'    && styles.toastInfo,
          {
            opacity: toastAnim,
            transform: [{translateY: toastAnim.interpolate({inputRange: [0,1], outputRange: [-20, 0]})}],
          },
        ]}>
          <Text style={styles.toastIcon}>
            {toast.type === 'success' ? '✅' : toast.type === 'info' ? 'ℹ️' : '❌'}
          </Text>
          <Text style={styles.toastTxt}>{toast.message}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── STYLES ──────────────────────────────────
const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#FFFFFF', // ✅ add this
  },

  // ── Logo ──
  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 3,
    marginBottom: 12,
    shadowColor: C.blue,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  appTagline: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },

  // ── Card ──
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 24,
    padding: 28,
    shadowColor: 'rgba(28,92,255,0.12)',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(28,92,255,0.08)',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: C.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: C.textSecond,
    marginBottom: 28,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Fields ──
  fieldWrap: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    backgroundColor: '#FAFBFF',
    overflow: 'hidden',
    minHeight: 52,
  },
  inputFocused: {
    borderColor: C.blue,
    backgroundColor: C.blueSoft,
    shadowColor: C.blue,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: {
    borderColor: C.errorBorder,
    backgroundColor: C.errorBg,
  },
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
  },
  prefix: {
    fontSize: 14,
    fontWeight: '700',
    color: C.blue,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    backgroundColor: C.border,
    marginLeft: 10,
    marginRight: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: C.textPrimary,
    fontWeight: '500',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyeIcon: {fontSize: 18},
  errorTxt: {
    fontSize: 12,
    color: C.errorText,
    marginTop: 6,
    fontWeight: '600',
  },

  // ── Button ──
  btn: {
    backgroundColor: C.blue,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: C.blue,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  btnDisabled: {
    backgroundColor: C.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnTxt: {
    color: C.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerTxt: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },

  // ── Sign up ──
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupTxt:  {fontSize: 14, color: C.textSecond},
  signupLink: {fontSize: 14, color: C.blue, fontWeight: '800'},



  // ── Toast ──
  toast: {
    position: 'absolute',
    top: 56,
    left: 20, right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  toastSuccess: {backgroundColor: C.success},
  toastError:   {backgroundColor: '#EF4444'},
  toastInfo:    {backgroundColor: C.blue},
  toastIcon:    {fontSize: 18, marginRight: 10},
  toastTxt: {
    flex: 1,
    color: C.white,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});