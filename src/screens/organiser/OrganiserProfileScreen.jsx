import React, {useEffect, useState, useRef} from 'react';
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
  Animated,
} from 'react-native';
import API from '../../api/api';
import MainLayout from '../../components/MainLayout';
import {launchImageLibrary} from 'react-native-image-picker';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';
import {useAuth} from '../../context/AuthContext';

// ─── DESIGN TOKENS ───────────────────────────
const C = {
  blue:        '#2563EB',
  blueDark:    '#1D4ED8',
  blueSoft:    '#EFF6FF',
  borderBlue:  '#DBEAFE',
  pageBg:      '#F1F5F9',
  cardBg:      '#FFFFFF',
  cardAlt:     '#F8FAFC',
  textPrimary: '#0F172A',
  textSecond:  '#475569',
  textMuted:   '#94A3B8',
  textWhite:   '#FFFFFF',
  border:      '#E2E8F0',
  green:       '#10B981',
  greenSoft:   '#ECFDF5',
};

const R = {
  sm: ms(8), md: ms(12), lg: ms(16), xl: ms(20), pill: ms(50),
};

// ─────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────
function HeroSection({displayLogo, editMode, form, pickLogo, setPreviewImage, onEdit}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  {toValue: 1, duration: 450, useNativeDriver: true}),
      Animated.spring(slideAnim, {toValue: 0, damping: 15,   useNativeDriver: true}),
    ]).start();
  }, []);

  return (
    <Animated.View style={[heroStyles.card, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>
      {/* Top blue accent strip */}
      <View style={heroStyles.topStrip} />

      <View style={heroStyles.content}>
        {/* Logo */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => editMode ? pickLogo() : displayLogo && setPreviewImage(displayLogo)}>
          <View style={heroStyles.logoRing}>
            {displayLogo ? (
              <Image source={{uri: displayLogo}} style={heroStyles.logoImg} resizeMode="cover" />
            ) : (
              <View style={heroStyles.logoFallback}>
                <Text style={heroStyles.logoEmoji}>🏢</Text>
                <Text style={heroStyles.logoFallbackTxt}>Add Logo</Text>
              </View>
            )}
            {editMode && (
              <View style={heroStyles.cameraBadge}>
                <Text style={heroStyles.cameraIcon}>📷</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {editMode && (
          <Text style={heroStyles.uploadHint}>
            {displayLogo ? 'Tap to change logo' : 'Tap to upload logo'}
          </Text>
        )}

        <Text style={heroStyles.orgName}>{form.name || 'Organisation'}</Text>

        <View style={heroStyles.metaRow}>
          {!!form.location && (
            <View style={heroStyles.metaPill}>
              <Text style={heroStyles.metaIcon}>📍</Text>
              <Text style={heroStyles.metaTxt}>{form.location}</Text>
            </View>
          )}
          {!!form.contactEmail && !editMode && (
            <View style={heroStyles.metaPill}>
              <Text style={heroStyles.metaIcon}>✉️</Text>
              <Text style={heroStyles.metaTxt}>{form.contactEmail}</Text>
            </View>
          )}
        </View>

        {!editMode && (
          <TouchableOpacity style={heroStyles.editBtn} onPress={onEdit} activeOpacity={0.85}>
            <Text style={heroStyles.editBtnTxt}>✏️  Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const heroStyles = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg,
    marginHorizontal: s(16),
    marginTop: vs(14),
    marginBottom: vs(14),
    borderRadius: R.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderBlue,
    shadowColor: C.blue,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  topStrip: {
    height: vs(4),
    backgroundColor: C.blue,
  },
  content: {
    alignItems: 'center',
    paddingTop: vs(24),
    paddingBottom: vs(22),
    paddingHorizontal: s(20),
  },
  logoRing: {
    width: s(100), height: s(100), borderRadius: s(50),
    borderWidth: 3, borderColor: C.borderBlue,
    overflow: 'hidden', backgroundColor: C.blueSoft,
    shadowColor: C.blue, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  logoImg:      {width: '100%', height: '100%'},
  logoFallback: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.blueSoft,
  },
  logoEmoji:      {fontSize: ms(28)},
  logoFallbackTxt:{fontSize: rf(10), color: C.textMuted, fontWeight: '600', marginTop: vs(3)},
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: s(26), height: s(26), borderRadius: s(13),
    backgroundColor: C.blue,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.textWhite,
  },
  cameraIcon:  {fontSize: rf(11)},
  uploadHint:  {fontSize: rf(12), color: C.textMuted, marginTop: vs(6), fontWeight: '600'},
  orgName: {
    marginTop: vs(12), fontSize: ms(20), fontWeight: '900',
    color: C.textPrimary, textAlign: 'center', letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: s(6), marginTop: vs(8),
  },
  metaPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.blueSoft,
    paddingHorizontal: s(10), paddingVertical: vs(4),
    borderRadius: R.pill, gap: s(4),
    borderWidth: 1, borderColor: C.borderBlue,
  },
  metaIcon: {fontSize: rf(11)},
  metaTxt:  {fontSize: rf(12), color: C.blue, fontWeight: '600'},
  editBtn: {
    marginTop: vs(14),
    backgroundColor: C.blue,
    paddingHorizontal: s(22), paddingVertical: vs(9),
    borderRadius: R.pill,
    shadowColor: C.blue, shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
  editBtnTxt: {color: C.textWhite, fontWeight: '800', fontSize: rf(14)},
});

// ─────────────────────────────────────────────
// SECTION WRAPPER
// ─────────────────────────────────────────────
function Section({title, icon, children}) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.header}>
        <View style={sectionStyles.iconWrap}>
          <Text style={sectionStyles.icon}>{icon}</Text>
        </View>
        <Text style={sectionStyles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {marginBottom: vs(24)},
  header: {
    flexDirection: 'row', alignItems: 'center',
    gap: s(8), marginBottom: vs(14),
  },
  iconWrap: {
    width: s(28), height: s(28), borderRadius: R.sm,
    backgroundColor: C.blueSoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.borderBlue,
  },
  icon:  {fontSize: rf(13)},
  title: {fontSize: rf(13), fontWeight: '800', color: C.textSecond, letterSpacing: 0.5, textTransform: 'uppercase'},
});

// ─────────────────────────────────────────────
// PROFILE INPUT
// ─────────────────────────────────────────────
function ProfileInput({label, value, onChange, editable, multiline, keyboardType = 'default'}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={inputStyles.group}>
      <Text style={inputStyles.label}>{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={editable}
          multiline={multiline}
          keyboardType={keyboardType}
          placeholder={`Enter ${label}`}
          placeholderTextColor={C.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            inputStyles.input,
            multiline && inputStyles.multiline,
            focused && inputStyles.inputFocused,
          ]}
        />
      ) : (
        <View style={inputStyles.readOnlyWrap}>
          <Text style={[inputStyles.readOnlyTxt, !value && inputStyles.readOnlyEmpty]}>
            {value || `No ${label.toLowerCase()} added`}
          </Text>
        </View>
      )}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  group:    {marginBottom: vs(14)},
  label:    {fontSize: rf(13), fontWeight: '700', color: C.textPrimary, marginBottom: vs(6)},
  input: {
    backgroundColor: C.cardAlt,
    borderRadius: R.md,
    paddingHorizontal: s(14), paddingVertical: vs(12),
    borderWidth: 1.5, borderColor: C.border,
    color: C.textPrimary, fontSize: rf(14), fontWeight: '500',
  },
  inputFocused: {
    borderColor: C.blue,
    backgroundColor: C.blueSoft,
    shadowColor: C.blue, shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 1,
  },
  multiline:      {height: vs(90), textAlignVertical: 'top'},
  readOnlyWrap: {
    backgroundColor: C.cardAlt,
    borderRadius: R.md,
    paddingHorizontal: s(14), paddingVertical: vs(12),
    borderWidth: 1, borderColor: C.border,
  },
  readOnlyTxt:   {fontSize: rf(14), color: C.textSecond, fontWeight: '500'},
  readOnlyEmpty: {color: C.textMuted, fontStyle: 'italic'},
});

// ─────────────────────────────────────────────
// DETAILS CARD
// ─────────────────────────────────────────────
function DetailsCard({form, setForm, editMode, loading, profileExists, onSave, onCancel}) {
  return (
    <View style={detailStyles.card}>
      <Section title="Organisation Details" icon="🏢">
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

      <Section title="Contact Information" icon="📬">
        <ProfileInput
          label="Contact Email"
          value={form.contactEmail}
          editable={editMode}
          keyboardType="email-address"
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

      {editMode && (
        <View style={detailStyles.btnRow}>
          {profileExists && (
            <TouchableOpacity
              style={detailStyles.cancelBtn}
              disabled={loading}
              onPress={onCancel}
              activeOpacity={0.85}>
              <Text style={detailStyles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[detailStyles.saveBtn, loading && detailStyles.disabled]}
            disabled={loading}
            onPress={onSave}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={C.textWhite} size="small" />
            ) : (
              <Text style={detailStyles.saveTxt}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const detailStyles = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg,
    marginHorizontal: s(16),
    marginBottom: vs(12),
    borderRadius: R.lg,
    padding: s(18),
    borderWidth: 1, borderColor: C.border,
    elevation: 1,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  btnRow: {
    flexDirection: 'row', gap: s(12), marginTop: vs(4),
  },
  cancelBtn: {
    flex: 1, backgroundColor: C.cardAlt,
    paddingVertical: vs(14), borderRadius: R.md,
    alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  cancelTxt: {color: C.textSecond, fontWeight: '800', fontSize: rf(14)},
  saveBtn: {
    flex: 2, backgroundColor: C.blue,
    paddingVertical: vs(14), borderRadius: R.md,
    alignItems: 'center',
    shadowColor: C.blue, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveTxt:  {color: C.textWhite, fontWeight: '800', fontSize: rf(15)},
  disabled: {opacity: 0.6},
});

// ─────────────────────────────────────────────
// PREVIEW MODAL
// ─────────────────────────────────────────────
function PreviewModal({uri, onClose}) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose}>
          <Text style={modalStyles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <Image source={{uri}} style={modalStyles.image} resizeMode="contain" />
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute', top: vs(44), right: s(20), zIndex: 10,
    width: s(36), height: s(36), borderRadius: s(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: {color: C.textWhite, fontSize: ms(16), fontWeight: '700'},
  image:    {width: '100%', height: '80%'},
});

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────
export default function OrganiserProfileScreen() {
  const nav          = useNavigationHelper();
  const {user, updateUser} = useAuth();
  const [loading,       setLoading]       = useState(false);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [editMode,      setEditMode]      = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [previewImage,  setPreviewImage]  = useState(null);
  const [newLogo,       setNewLogo]       = useState(null);
  const [savedLogoUrl,  setSavedLogoUrl]  = useState(null);

  const [form, setForm] = useState({
    name: '', description: '', contactEmail: '', contactPhone: '', location: '',
  });

  const pickLogo = () => {
    launchImageLibrary({mediaType: 'photo', quality: 0.7}, response => {
      if (response.didCancel) return;
      if (response.errorCode) { Alert.alert('Error', response.errorMessage); return; }
      setNewLogo(response.assets[0]);
    });
  };

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setPageLoading(true);
      const res = await API.get('/api/organiser/profile');
      setForm({
        name:         res.data.name         || '',
        description:  res.data.description  || '',
        contactEmail: res.data.contactEmail || '',
        contactPhone: res.data.contactPhone || '',
        location:     res.data.location     || '',
      });
      setSavedLogoUrl(res.data.logoUrl || null);
      setNewLogo(null);
      setProfileExists(true);
      setEditMode(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setForm(prev => ({
          ...prev,
          name:         user?.name   || '',
          contactEmail: user?.email  || '',
          contactPhone: user?.mobile || '',
        }));
      }
      setProfileExists(false);
      setEditMode(true);
    } finally {
      setPageLoading(false);
    }
  };

  const submit = async () => {
    if (!form.name.trim()) { Alert.alert('Validation', 'Organisation name is required'); return; }

    const data = new FormData();
    data.append('name',         form.name);
    data.append('description',  form.description);
    data.append('contactEmail', form.contactEmail);
    data.append('contactPhone', form.contactPhone);
    data.append('location',     form.location);

    if (newLogo) {
      data.append('logo', {
        uri:  newLogo.uri.startsWith('file://') ? newLogo.uri : `file://${newLogo.uri}`,
        type: newLogo.type || 'image/jpeg',
        name: newLogo.fileName || 'logo.jpg',
      });
    }

    setLoading(true);
    try {
      const response = await API.post('/api/organiser/profile', data, {
        headers: {'Content-Type': 'multipart/form-data'},
        timeout: 30000,
      });
      if (response.data?.organiser?.logoUrl) {
        await updateUser({profileImage: response.data.organiser.logoUrl});
      }
      await loadProfile();
      Alert.alert('Success', 'Profile saved successfully');
    } catch (e) {
      let msg = 'Failed to save profile';
      if (e.message === 'Network Error') msg = 'Upload failed. Check your connection.';
      else if (e.response?.data?.message) msg = e.response.data.message;
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <MainLayout title="Organiser Profile" forceBack>
        <View style={screenStyles.center}>
          <ActivityIndicator size="large" color={C.blue} />
          <Text style={screenStyles.loadingTxt}>Loading profile...</Text>
        </View>
      </MainLayout>
    );
  }

  const displayLogo = newLogo ? newLogo.uri : savedLogoUrl;

  return (
    <MainLayout title="Organiser Profile" forceBack>
      <ScrollView
        style={screenStyles.root}
        contentContainerStyle={screenStyles.scroll}
        showsVerticalScrollIndicator={false}>

        <HeroSection
          displayLogo={displayLogo}
          editMode={editMode}
          form={form}
          pickLogo={pickLogo}
          setPreviewImage={setPreviewImage}
          onEdit={() => setEditMode(true)}
        />

        <DetailsCard
          form={form}
          setForm={setForm}
          editMode={editMode}
          loading={loading}
          profileExists={profileExists}
          onSave={submit}
          onCancel={loadProfile}
        />

        <View style={{height: vs(24)}} />
      </ScrollView>

      <PreviewModal uri={previewImage} onClose={() => setPreviewImage(null)} />
    </MainLayout>
  );
}

const screenStyles = StyleSheet.create({
  root:       {backgroundColor: C.pageBg},
  scroll:     {backgroundColor: C.pageBg, paddingBottom: vs(40)},
  center:     {flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(10)},
  loadingTxt: {fontSize: rf(13), color: C.textSecond, fontWeight: '500'},
});