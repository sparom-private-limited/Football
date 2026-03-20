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
import RoleSelector from '../RoleSelector';

// ─── DESIGN TOKENS (identical to LoginPage) ──
const C = {
  blue:        '#1C5CFF',
  blueDark:    '#1348D4',
  blueSoft:    '#EFF6FF',
  pageBg:      '#FFFFFF',
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

export default function SignupPage({navigation}) {
  const [role,          setRole]          = useState('player');
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [errors,        setErrors]        = useState({});
  const [focusedField,  setFocusedField]  = useState(null);
  const [toast,         setToast]         = useState(null);

  const [form, setForm] = useState({
    name: '', mobile: '', email: '', password: '',
  });

  // ── Entrance animations ──
  const logoAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
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

  // ── Field change ──
  const handleChange = (key, value) => {
    setForm({...form, [key]: value});
    if (errors[key]) setErrors({...errors, [key]: null});
  };

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!form.name.trim())                              e.name     = 'Name is required';
    else if (form.name.trim().length < 2)               e.name     = 'Minimum 2 characters';
    if (!form.mobile.trim())                            e.mobile   = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(form.mobile.trim()))  e.mobile   = 'Enter a valid 10-digit number';
    if (!form.email.trim())                             e.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email';
    if (!form.password.trim())                          e.password = 'Password is required';
    else if (form.password.length < 6)                  e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Signup ──
  const handleSignup = async () => {
    setErrors({});
    if (!validate()) {
      showToast('Please fix the errors before continuing', 'error');
      return;
    }
    setLoading(true);
    try {
      await API.post('/api/auth/signup', {...form, role});
      showToast('🎉 Account created successfully!', 'success');
      setTimeout(() => navigation.navigate('Login'), 1500);
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 400) {
        if (message?.includes('mobile')) { setErrors({mobile: 'Mobile already registered'}); showToast('Mobile number already registered', 'error'); }
        else if (message?.includes('email')) { setErrors({email: 'Email already registered'}); showToast('Email already registered', 'error'); }
        else showToast(message || 'Please check your inputs', 'error');
      } else if (status === 409) { showToast('User already exists. Please login.', 'error'); }
      else if (status === 500)   { showToast('Server error. Try again later.', 'error'); }
      else if (err.request)      { showToast('No internet connection.', 'error'); }
      else                       { showToast('Unexpected error. Try again.', 'error'); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={C.pageBg} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── LOGO + APP NAME ── */}
        <Animated.View style={[styles.logoWrap, {
          opacity: fadeAnim,
          transform: [{scale: logoAnim.interpolate({inputRange: [0, 1], outputRange: [0.7, 1]})}],
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

        {/* ── SIGNUP CARD ── */}
        <Animated.View style={[styles.card, {
          opacity: fadeAnim,
          transform: [{translateY: cardAnim}],
        }]}>

          <Text style={styles.cardTitle}>Create Account ✨</Text>
          <Text style={styles.cardSubtitle}>Join us today!</Text>

          {/* Role Selector */}
          <View style={styles.roleWrap}>
            <Text style={styles.label}>I am a</Text>
            <RoleSelector role={role} setRole={setRole} />
          </View>

          {/* Full Name */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'name' && styles.inputFocused,
              errors.name && styles.inputError,
            ]}>
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor={C.textMuted}
                style={styles.input}
                value={form.name}
                onChangeText={v => handleChange('name', v)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
            </View>
            {errors.name && <Text style={styles.errorTxt}>⚠️ {errors.name}</Text>}
          </View>

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
                value={form.mobile}
                onChangeText={v => handleChange('mobile', v)}
                keyboardType="numeric"
                maxLength={10}
                onFocus={() => setFocusedField('mobile')}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
            </View>
            {errors.mobile && <Text style={styles.errorTxt}>⚠️ {errors.mobile}</Text>}
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[
              styles.inputRow,
              focusedField === 'email' && styles.inputFocused,
              errors.email && styles.inputError,
            ]}>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor={C.textMuted}
                style={styles.input}
                value={form.email}
                onChangeText={v => handleChange('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
            </View>
            {errors.email && <Text style={styles.errorTxt}>⚠️ {errors.email}</Text>}
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
                placeholder="Create a password"
                placeholderTextColor={C.textMuted}
                value={form.password}
                onChangeText={v => handleChange('password', v)}
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
            {errors.password
              ? <Text style={styles.errorTxt}>⚠️ {errors.password}</Text>
              : <Text style={styles.hintTxt}>Must be at least 6 characters</Text>
            }
          </View>

          {/* Signup button */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <View style={styles.btnInner}>
                <ActivityIndicator color={C.white} size="small" />
                <Text style={styles.btnTxt}> Creating account...</Text>
              </View>
            ) : (
              <Text style={styles.btnTxt}>Sign Up →</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerTxt}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginTxt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>

        {/* Terms */}
        <Animated.View style={[styles.termsWrap, {opacity: fadeAnim}]}>
          <Text style={styles.termsTxt}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
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
            transform: [{translateY: toastAnim.interpolate({inputRange: [0, 1], outputRange: [-20, 0]})}],
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
    backgroundColor: C.pageBg,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: C.pageBg,
  },

  // ── Logo ──
  logoWrap: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 5,
    
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
    marginBottom: 24,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Role ──
  roleWrap: {
    marginBottom: 20,
  },

  // ── Fields ──
  fieldWrap: {
    marginBottom: 16,
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
  eyeIcon:  {fontSize: 18},
  errorTxt: {fontSize: 12, color: C.errorText, marginTop: 6, fontWeight: '600'},
  hintTxt:  {fontSize: 12, color: C.textMuted,  marginTop: 4},

  // ── Button ──
  btn: {
    backgroundColor: C.blue,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
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
  btnInner: {flexDirection: 'row', alignItems: 'center'},
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
  dividerLine: {flex: 1, height: 1, backgroundColor: C.border},
  dividerTxt:  {fontSize: 13, color: C.textMuted, fontWeight: '600'},

  // ── Login link ──
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginTxt:  {fontSize: 14, color: C.textSecond},
  loginLink: {fontSize: 14, color: C.blue, fontWeight: '800'},

  // ── Terms ──
  termsWrap: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  termsTxt: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

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