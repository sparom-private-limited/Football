import React, { useState } from 'react';
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
} from 'react-native';
import API from '../../../api/api';
import RoleSelector from '../RoleSelector';

export default function SignupPage({ navigation }) {
  const [role, setRole] = useState('player');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [toast, setToast] = useState(null);
  const [toastAnim] = useState(new Animated.Value(0));

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
  });

  // Toast notification function
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  };

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
    // Clear error for this field when user starts typing
    if (errors[key]) {
      setErrors({ ...errors, [key]: null });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Mobile validation
    if (!form.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(form.mobile.trim())) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!form.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    // Clear previous errors
    setErrors({});

    // Validate inputs
    if (!validate()) {
      showToast('Please fix the errors before continuing', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await API.post('/api/auth/signup', {
        ...form,
        role,
      });

      // Show success toast
      showToast('🎉 Account created successfully!', 'success');

      // Navigate to login after toast
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1500);

    } catch (err) {
      console.log('SIGNUP ERROR:', err.response?.data || err);

      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message;

        if (status === 400) {
          if (message?.includes('mobile')) {
            setErrors({ mobile: 'Mobile number already registered' });
            showToast('Mobile number already registered', 'error');
          } else if (message?.includes('email')) {
            setErrors({ email: 'Email already registered' });
            showToast('Email already registered', 'error');
          } else {
            showToast(message || 'Please check your inputs', 'error');
          }
        } else if (status === 409) {
          showToast('User already exists. Please login.', 'error');
        } else if (status === 500) {
          showToast('Server error. Please try again later.', 'error');
        } else {
          showToast(message || 'Unable to create account', 'error');
        }
      } else if (err.request) {
        // Network error
        showToast('No internet connection. Please check and try again.', 'error');
      } else {
        showToast('An unexpected error occurred. Please try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account ✨</Text>
            <Text style={styles.subtitle}>Join us today!</Text>
          </View>

          {/* Role Selector */}
          <View style={styles.roleContainer}>
            <Text style={styles.label}>I am a</Text>
            <RoleSelector role={role} setRole={setRole} />
          </View>

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'name' && styles.inputFocused,
                errors.name && styles.inputError,
              ]}
            >
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                value={form.name}
                onChangeText={v => handleChange('name', v)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
            </View>
            {errors.name && (
              <Text style={styles.errorText}>⚠️ {errors.name}</Text>
            )}
          </View>

          {/* Mobile Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'mobile' && styles.inputFocused,
                errors.mobile && styles.inputError,
              ]}
            >
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                placeholder="Enter mobile number"
                placeholderTextColor="#94A3B8"
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
            {errors.mobile && (
              <Text style={styles.errorText}>⚠️ {errors.mobile}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                focusedField === 'email' && styles.inputFocused,
                errors.email && styles.inputError,
              ]}
            >
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
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
            {errors.email && (
              <Text style={styles.errorText}>⚠️ {errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.passwordWrapper,
                focusedField === 'password' && styles.inputFocused,
                errors.password && styles.inputError,
              ]}
            >
              <TextInput
                placeholder="Create a password"
                placeholderTextColor="#94A3B8"
                value={form.password}
                onChangeText={v => handleChange('password', v)}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                disabled={loading}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>⚠️ {errors.password}</Text>
            )}
            <Text style={styles.passwordHint}>
              Must be at least 6 characters
            </Text>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.buttonText}> Creating account...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms Text */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>

      {/* Toast Notification */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            toast.type === 'success' && styles.toastSuccess,
            toast.type === 'error' && styles.toastError,
            toast.type === 'info' && styles.toastInfo,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastIcon}>
            {toast.type === 'success' ? '✅' : toast.type === 'info' ? 'ℹ️' : '❌'}
          </Text>
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },

  roleContainer: {
    marginBottom: 20,
  },

  inputContainer: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },

  inputFocused: {
    borderColor: '#1C5CFF',
    backgroundColor: '#F0F7FF',
  },

  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },

  prefix: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },

  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },

  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },

  eyeButton: {
    padding: 12,
  },

  eyeIcon: {
    fontSize: 20,
  },

  errorText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 6,
    fontWeight: '600',
  },

  passwordHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },

  button: {
    backgroundColor: '#1C5CFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#1C5CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  buttonDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  footerText: {
    fontSize: 14,
    color: '#64748B',
  },

  link: {
    fontSize: 14,
    color: '#1C5CFF',
    fontWeight: '700',
  },

  termsContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },

  termsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Toast Notification Styles
  toast: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  toastSuccess: {
    backgroundColor: '#10B981',
  },

  toastError: {
    backgroundColor: '#EF4444',
  },

  toastInfo: {
    backgroundColor: '#3B82F6',
  },

  toastIcon: {
    fontSize: 20,
    marginRight: 12,
  },

  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});