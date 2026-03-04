import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import {launchImageLibrary} from 'react-native-image-picker';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';
import {useAuth} from '../../context/AuthContext';

export default function OrganiserProfileScreen() {
  const nav = useNavigationHelper();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const {user} = useAuth();

  const [form, setForm] = useState({
    name: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    location: '',
  });

  const [newLogo, setNewLogo] = useState(null); // ✅ Newly picked logo
  const [savedLogoUrl, setSavedLogoUrl] = useState(null); // ✅ Logo from server

  const pickLogo = () => {
    launchImageLibrary({mediaType: 'photo', quality: 0.7}, response => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage);
        return;
      }

      setNewLogo(response.assets[0]);
    });
  };

  // ✅ Load profile on screen focus
  // useFocusEffect(
  //   React.useCallback(() => {
  //     loadProfile();
  //   }, []),
  // );

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setPageLoading(true);
      const res = await API.get('/api/organiser/profile');
      setForm({
        name: res.data.name || '',
        description: res.data.description || '',
        contactEmail: res.data.contactEmail || '',
        contactPhone: res.data.contactPhone || '',
        location: res.data.location || '',
      });
      setSavedLogoUrl(res.data.logoUrl || null);
      setNewLogo(null);
      setProfileExists(true);
      setEditMode(false);
    } catch (err) {
      if (err.response?.status === 404) {
        // ✅ Pre-fill from auth context user data
        setForm(prev => ({
          ...prev,
          name: user?.name || '',
          contactEmail: user?.email || '',
          contactPhone: user?.mobile || '',
        }));
      }
      setProfileExists(false);
      setEditMode(true);
    } finally {
      setPageLoading(false);
    }
  };

  /* ---------------- SAVE PROFILE ---------------- */
  const submit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Organisation name is required');
      return;
    }

    const data = new FormData();
    data.append('name', form.name);
    data.append('description', form.description);
    data.append('contactEmail', form.contactEmail);
    data.append('contactPhone', form.contactPhone);
    data.append('location', form.location);

    if (newLogo) {
      data.append('logo', {
        uri: newLogo.uri.startsWith('file://')
          ? newLogo.uri
          : `file://${newLogo.uri}`,
        type: newLogo.type || 'image/jpeg',
        name: newLogo.fileName || 'logo.jpg',
      });
    }

    setLoading(true);
    try {
      const response = await API.post('/api/organiser/profile', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      await loadProfile();
      Alert.alert('Success', 'Profile saved successfully');
    } catch (e) {
      console.error('❌ UPLOAD ERROR:', e.response?.data || e.message);

      // ✅ Better error messages
      let errorMessage = 'Failed to save profile';

      if (e.message === 'Network Error') {
        errorMessage =
          'Upload is taking longer than expected. Please check your connection and try again.';
      } else if (e.response?.data?.message) {
        errorMessage = e.response.data.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show loading state while fetching profile
  if (pageLoading) {
    return (
      <MainLayout title="Organiser Profile" forceBack>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </MainLayout>
    );
  }

  // ✅ Determine which logo to display
  const displayLogo = newLogo ? newLogo.uri : savedLogoUrl;

  return (
    <MainLayout title="Organiser Profile" forceBack>
      <ScrollView contentContainerStyle={styles.container}>
        {/* PROFILE CARD */}
        {/* ===== HERO SECTION ===== */}
        <View style={styles.hero}>
          {/* Logo — tap to preview OR pick in edit mode */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              editMode
                ? pickLogo()
                : displayLogo && setPreviewImage(displayLogo)
            }>
            <View style={styles.heroLogo}>
              {displayLogo ? (
                <Image source={{uri: displayLogo}} style={styles.heroLogoImg} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoPlaceholderIcon}>🏢</Text>
                  <Text style={styles.logoPlaceholderText}>Add Logo</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Show upload hint text in edit mode */}
          {editMode && (
            <Text style={styles.uploadHint}>
              {displayLogo ? 'Tap logo to change' : 'Tap logo to upload'}
            </Text>
          )}

          <Text style={styles.heroTitle}>{form.name || 'Organisation'}</Text>

          {!!form.location && (
            <Text style={styles.heroSubtitle}>{form.location}</Text>
          )}

          {!editMode && (
            <TouchableOpacity
              style={styles.heroEditBtn}
              onPress={() => setEditMode(true)}>
              <Text style={styles.heroEditText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ===== DETAILS CARD ===== */}
        <View style={styles.card}>
          <Section title="Organisation Details">
            <ProfileInput
              label="Organisation Name"
              value={form.name}
              editable={editMode}
              onChange={v => setForm({...form, name: v})}
            />

            <ProfileInput
              label="Description"
              value={form.description}
              editable={editMode}
              multiline
              onChange={v => setForm({...form, description: v})}
            />
          </Section>

          <Section title="Contact Information">
            <ProfileInput
              label="Contact Email"
              value={form.contactEmail}
              editable={editMode}
              onChange={v => setForm({...form, contactEmail: v})}
            />

            <ProfileInput
              label="Contact Phone"
              value={form.contactPhone}
              editable={editMode}
              keyboardType="phone-pad"
              onChange={v => setForm({...form, contactPhone: v})}
            />

            <ProfileInput
              label="Location"
              value={form.location}
              editable={editMode}
              onChange={v => setForm({...form, location: v})}
            />
          </Section>

          {/* ===== ACTIONS ===== */}
          {editMode && (
            <View style={styles.buttonRow}>
              {profileExists && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  disabled={loading}
                  onPress={loadProfile}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabled]}
                disabled={loading}
                onPress={submit}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setPreviewImage(null)}>
            <Text style={styles.previewCloseText}>✕</Text>
          </TouchableOpacity>

          <Image
            source={{uri: previewImage}}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </MainLayout>
  );
}

/* ---------------- REUSABLE INPUT ---------------- */

function ProfileInput({
  label,
  value,
  onChange,
  editable,
  multiline,
  keyboardType = 'default',
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        editable={editable}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={editable ? `Enter ${label}` : ''}
        placeholderTextColor="#94A3B8"
        style={[
          styles.input,
          multiline && styles.multiline,
          !editable && styles.readOnly,
        ]}
      />
    </View>
  );
}

function Section({title, children}) {
  return (
    <View style={{marginBottom: 24}}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    padding: s(16),
    paddingBottom: vs(40),
    backgroundColor: '#F1F5F9',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: s(16),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  /* LOGO */
  logoSection: {
    alignItems: 'center',
    marginBottom: vs(24),
  },

  logoCircle: {
    width: s(96),
    height: s(96),
    borderRadius: s(48),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(8),
    overflow: 'hidden',
  },

  logoImg: {
    width: s(96),
    height: s(96),
  },

  logoPlaceholder: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: rf(14),
  },

  logoAction: {
    color: '#2563EB',
    fontWeight: '600',
    marginTop: vs(4),
    fontSize: rf(14),
  },

  logoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholderIcon: {
    fontSize: ms(28),
  },
  logoPlaceholderText: {
    fontSize: rf(11),
    color: '#94A3B8',
    marginTop: vs(4),
    fontWeight: '500',
  },

  /* INPUTS */
  inputGroup: {
    marginBottom: vs(16),
  },

  label: {
    fontWeight: '600',
    marginBottom: vs(6),
    color: '#334155',
    fontSize: rf(14),
  },

  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: ms(12),
    padding: s(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#0F172A',
    fontSize: rf(14),
  },

  multiline: {
    height: vs(90),
    textAlignVertical: 'top',
  },

  readOnly: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
  },

  /* BUTTONS */
  buttonRow: {
    flexDirection: 'row',
    gap: s(12),
    marginTop: vs(16),
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: vs(14),
    borderRadius: ms(14),
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: rf(16),
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: vs(14),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: rf(16),
  },

  secondaryBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: vs(14),
    borderRadius: ms(14),
    marginTop: vs(16),
  },

  secondaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: rf(16),
  },

  disabled: {
    opacity: 0.6,
  },

  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewImage: {
    width: '100%',
    height: '80%',
  },

  previewClose: {
    position: 'absolute',
    top: vs(40),
    right: s(20),
    zIndex: 10,
  },

  previewCloseText: {
    color: '#fff',
    fontSize: ms(26),
    fontWeight: '700',
  },

  hero: {
    alignItems: 'center',
    marginBottom: vs(28),
  },

  heroLogo: {
    width: s(110),
    height: s(110),
    borderRadius: s(55),
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },

  heroLogoImg: {
    width: '100%',
    height: '100%',
    borderRadius: s(55),
  },

  heroLogoText: {
    color: '#fff',
    fontSize: ms(42),
    fontWeight: '900',
  },

  heroTitle: {
    marginTop: vs(14),
    fontSize: ms(22),
    fontWeight: '800',
    color: '#020617',
    textAlign: 'center',
  },

  heroSubtitle: {
    marginTop: vs(4),
    fontSize: rf(14),
    color: '#64748B',
  },

  heroEditBtn: {
    marginTop: vs(14),
    paddingHorizontal: s(20),
    paddingVertical: vs(8),
    borderRadius: ms(999),
    backgroundColor: '#1D4ED8',
  },

  heroEditText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: rf(14),
  },

  sectionTitle: {
    fontSize: rf(13),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: vs(12),
    letterSpacing: 0.4,
  },
});
