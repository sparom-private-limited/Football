import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import API from '../api/api';
import {launchImageLibrary} from 'react-native-image-picker';
import useNavigationHelper from '../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../utils/responsive';
import {useAuth} from '../context/AuthContext';

export default function PlayerProfileEdit() {
  const [player, setPlayer] = useState(null);
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const MAX_IMAGE_SIZE_MB = 2;
  const {updateUser} = useAuth();

  const [form, setForm] = useState({
    age: '',
    position: '',
    jerseyNumber: '',
    footed: '',
    height: '',
    weight: '',
  });

  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const isSubmittingRef = useRef(false);
  const nav = useNavigationHelper();
  const scrollRef = useRef(null);

  // ✅ Track Y positions of inputs inside scroll content
  const inputPositions = useRef({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await API.get('/api/player/me');

      if (res.data.isProfileCompleted) {
        const p = res.data.player;
        setPlayer(p);
        setIsExistingProfile(true);

        setForm({
          age: p.age?.toString() || '',
          position: p.position || '',
          jerseyNumber: p.jerseyNumber?.toString() || '',
          footed: p.footed || '',
          height: p.height?.toString() || '',
          weight: p.weight?.toString() || '',
        });

        setImage(p.profileImageUrl || null);
      } else {
        setIsExistingProfile(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile.');
    }
  };

  const normalizeUri = uri => {
    return uri.startsWith('file://') ? uri : 'file://' + uri;
  };

  const chooseImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) return;

      const file = result.assets?.[0];
      if (!file) return;

      const sizeInMB = file.fileSize / (1024 * 1024);

      if (sizeInMB > MAX_IMAGE_SIZE_MB) {
        Alert.alert(
          'Image too large',
          `Please select an image smaller than ${MAX_IMAGE_SIZE_MB} MB`,
        );
        return;
      }

      setImage(file.uri);

      setImageFile({
        uri: normalizeUri(file.uri),
        name: file.fileName || `profile_${Date.now()}.jpg`,
        type: file.type || 'image/jpeg',
      });
    } catch (err) {
      Alert.alert('Image Error', 'Unable to choose an image.');
    }
  };

  const validate = () => {
    if (!isExistingProfile) {
      if (!form.position)
        return Alert.alert('Validation', 'Position required.');
      if (!form.jerseyNumber)
        return Alert.alert('Validation', 'Jersey number required.');
    }
    return true;
  };

  const saveProfile = async () => {
    if (isSubmittingRef.current) return;

    if (!validate()) return;

    try {
      isSubmittingRef.current = true;
      setSaving(true);

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (value !== '') {
          formData.append(key, value);
        }
      });

      if (imageFile) {
        formData.append('profileImage', imageFile);
      }

      const endpoint = isExistingProfile
        ? '/api/player/update-profile'
        : '/api/player/create-profile';

      const res = await API.post(endpoint, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
        timeout: 30000,
      });

      if (res.data?.player?.profileImageUrl) {
        await updateUser({profileImage: res.data.player.profileImageUrl});
      }

      Alert.alert(
        'Success',
        isExistingProfile
          ? 'Profile updated successfully'
          : 'Profile created successfully',
        [
          {
            text: 'OK',
            onPress: () => nav.back(),
          },
        ],
      );
    } catch (err) {
      console.log('❌ API Error Details:');
      console.log('Status:', err.response?.status);
      console.log('Message:', err.response?.data?.message);

      if (!err.response && err.request) {
        Alert.alert(
          'Network Error',
          'Upload failed due to network interruption.\n\nPlease check your connection and try again.',
        );
        return;
      }

      Alert.alert(
        'Error',
        err.response?.data?.message || 'Upload failed. Please try again.',
      );
    } finally {
      setSaving(false);
      isSubmittingRef.current = false;
    }
  };

  // ✅ Scroll to a specific input when focused
  const scrollToInput = (fieldName) => {
    const y = inputPositions.current[fieldName];
    if (y != null && scrollRef.current) {
      // Delay to let keyboard fully open
      setTimeout(() => {
        scrollRef.current.scrollTo({
          y: Math.max(0, y - 120),
          animated: true,
        });
      }, 350);
    }
  };

  // ✅ Track input position inside scroll content
  const onInputLayout = (fieldName, event) => {
    // This gives Y relative to the parent card, we need Y relative to ScrollView
    // So we use measureLayout — but simpler: just use the nativeEvent layout
    const {y} = event.nativeEvent.layout;
    // We store the approximate scroll Y (card offset + input offset within card)
    inputPositions.current[fieldName] = y;
  };

  const isFormReady =
    form.position && form.jerseyNumber && !saving && !isSubmittingRef.current;

  return (
    <View style={{flex: 1, backgroundColor: '#F1F5F9'}}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* IMAGE UPLOAD */}
        <Text style={styles.sectionTitle}>Basic Info</Text>
        <TouchableOpacity onPress={chooseImage} style={styles.imageContainer}>
          {image ? (
            <Image source={{uri: image}} style={styles.image} />
          ) : (
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>Edit</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Physical Attributes</Text>
        {/* FORM CARD — we measure each input's Y within this card,
            then add the card's own Y to get absolute scroll position */}
        <View
          style={styles.card}
          onLayout={(e) => {
            // Store the card's Y offset within the ScrollView
            inputPositions.current._cardY = e.nativeEvent.layout.y;
          }}>
          <Text style={styles.cardTitle}>Player Information</Text>

          <ChoiceGroup
            label="Position"
            options={['GK', 'DEF', 'MID', 'FW']}
            value={form.position}
            onChange={v => setForm({...form, position: v})}
          />

          <ChoiceGroup
            label="Footed"
            options={['Left', 'Right', 'Both']}
            value={form.footed}
            onChange={v => setForm({...form, footed: v})}
          />

          <View onLayout={(e) => {
            inputPositions.current.jerseyNumber =
              (inputPositions.current._cardY || 0) + e.nativeEvent.layout.y;
          }}>
            <Input
              label="Jersey Number"
              placeholder="Enter number"
              keyboardType="numeric"
              value={form.jerseyNumber}
              onChange={v => setForm({...form, jerseyNumber: v})}
              onFocus={() => scrollToInput('jerseyNumber')}
            />
          </View>

          <View onLayout={(e) => {
            inputPositions.current.age =
              (inputPositions.current._cardY || 0) + e.nativeEvent.layout.y;
          }}>
            <Input
              label="Age"
              keyboardType="numeric"
              placeholder="Enter age"
              value={form.age}
              onChange={v => setForm({...form, age: v})}
              onFocus={() => scrollToInput('age')}
            />
          </View>

          <View onLayout={(e) => {
            inputPositions.current.height =
              (inputPositions.current._cardY || 0) + e.nativeEvent.layout.y;
          }}>
            <Input
              label="Height (cm)"
              keyboardType="numeric"
              placeholder="Enter height"
              value={form.height}
              onChange={v => setForm({...form, height: v})}
              onFocus={() => scrollToInput('height')}
            />
          </View>

          <View onLayout={(e) => {
            inputPositions.current.weight =
              (inputPositions.current._cardY || 0) + e.nativeEvent.layout.y;
          }}>
            <Input
              label="Weight (kg)"
              keyboardType="numeric"
              placeholder="Enter weight"
              value={form.weight}
              onChange={v => setForm({...form, weight: v})}
              onFocus={() => scrollToInput('weight')}
            />
          </View>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormReady || saving) && {opacity: 0.5},
          ]}
          onPress={saveProfile}
          disabled={!isFormReady || saving}>
          <Text style={styles.saveText}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>

        {/* ✅ Large bottom padding so last inputs can scroll well above keyboard */}
        <View style={{height: vs(300)}} />
      </ScrollView>
    </View>
  );
}

/* INPUT COMPONENT */
function Input({label, value, onChange, onFocus, ...rest}) {
  return (
    <View style={{marginBottom: 14}}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        {...rest}
      />
    </View>
  );
}

function ChoiceGroup({label, options, value, onChange}) {
  return (
    <View style={{marginBottom: 18}}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.choice, value === opt && styles.choiceActive]}
            onPress={() => onChange(opt)}>
            <Text style={[styles.choiceText, value === opt && {color: '#fff'}]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    padding: s(20),
    backgroundColor: '#F1F5F9',
  },

  title: {
    fontSize: ms(24),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: vs(20),
    color: '#0F172A',
  },

  imageContainer: {
    height: s(130),
    width: s(130),
    borderRadius: s(70),
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: vs(22),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imagePlaceholder: {
    color: '#64748B',
    fontSize: rf(14),
  },

  card: {
    backgroundColor: '#fff',
    padding: s(18),
    borderRadius: ms(14),
    elevation: 2,
    marginBottom: vs(20),
  },
  cardTitle: {
    fontSize: rf(18),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: vs(16),
  },

  inputLabel: {
    color: '#475569',
    fontSize: rf(14),
    marginBottom: vs(6),
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: ms(10),
    padding: s(12),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: rf(16),
    color: '#0F172A',
  },

  saveButton: {
    backgroundColor: '#1D4ED8',
    padding: s(15),
    borderRadius: ms(12),
  },
  saveText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: rf(17),
    fontWeight: '700',
  },

  imageOverlay: {
    position: 'absolute',
    bottom: vs(8),
    right: s(8),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: ms(10),
  },
  imageOverlayText: {
    color: '#fff',
    fontSize: rf(15),
    fontWeight: '700',
  },

  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(10),
  },
  choice: {
    paddingVertical: vs(10),
    paddingHorizontal: s(16),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  choiceActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  choiceText: {
    fontWeight: '700',
    color: '#334155',
    fontSize: rf(14),
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: vs(10),
    marginTop: vs(12),
    color: '#0F172A',
    fontSize: rf(15),
  },
});