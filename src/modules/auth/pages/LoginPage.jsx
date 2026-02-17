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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../context/AuthContext';

export default function LoginPage({ navigation }) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [toast, setToast] = useState(null);
  const [toastAnim] = useState(new Animated.Value(0));

  const { login } = useAuth();

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

  // Validation functions
  const validateMobile = (text) => {
    setMobile(text);
    if (errors.mobile) {
      setErrors({ ...errors, mobile: null });
    }
  };

  const validatePassword = (text) => {
    setPassword(text);
    if (errors.password) {
      setErrors({ ...errors, password: null });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Mobile validation
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(mobile.trim())) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    // Password validation
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Clear previous errors
    setErrors({});

    // Validate inputs
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const res = await API.post('/api/auth/login', {
        mobile: mobile.trim(),
        password: password.trim(),
      });

      // Save token and user data
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));

      // Show success toast
      showToast(
        `Welcome back, ${res.data.user.name || 'User'}! 🎉`,
        'success'
      );

      // Update auth context after toast starts
      setTimeout(() => {
        login(res.data.token, res.data.user);
      }, 500);

    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);

      // Handle different error types
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message;

        if (status === 404) {
          setErrors({
            mobile: 'Mobile number not registered',
          });
          showToast('Mobile number not registered. Please sign up first.', 'error');
        } else if (status === 401) {
          setErrors({
            password: 'Incorrect password',
          });
          showToast('Incorrect password. Please try again.', 'error');
        } else if (status === 400) {
          showToast(message || 'Please check your inputs', 'error');
        } else if (status === 500) {
          showToast('Server error. Please try again later.', 'error');
        } else {
          showToast(message || 'Unable to login. Please try again.', 'error');
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
            <Text style={styles.title}>Welcome Back 👋</Text>
            <Text style={styles.subtitle}>Login to continue</Text>
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
                value={mobile}
                onChangeText={validateMobile}
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
                placeholder="Enter password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={validatePassword}
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
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => showToast('Contact support to reset your password', 'info')}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.buttonText}> Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              disabled={loading}
            >
              <Text style={styles.link}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 Need help? Contact support@yourapp.com
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
    marginBottom: 32,
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

  inputContainer: {
    marginBottom: 20,
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

  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },

  forgotPasswordText: {
    fontSize: 14,
    color: '#1C5CFF',
    fontWeight: '600',
  },

  button: {
    backgroundColor: '#1C5CFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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

  helpContainer: {
    marginTop: 24,
    alignItems: 'center',
  },

  helpText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
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