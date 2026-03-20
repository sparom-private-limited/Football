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

      // ✅ SIZE CHECK
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

      // ✅ ONLY AFTER CONFIRMED SUCCESS
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
      console.log('URL:', endpoint);
      console.log('Status:', err.response?.status);
      console.log('Message:', err.response?.data?.message);
      console.log('Full response:', err.response);
      console.log('Request:', err.request);
      console.log('Error:', err.message);

      // ✅ NETWORK ERROR (no response)
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

  const isFormReady =
    form.position && form.jerseyNumber && !saving && !isSubmittingRef.current;

  return (
    <View style={{flex: 1, backgroundColor: '#F1F5F9'}}>
      <ScrollView contentContainerStyle={styles.container}>
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
        {/* FORM CARD */}
        <View style={styles.card}>
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

          <Input
            label="Jersey Number"
            placeholder="Enter number"
            keyboardType="numeric"
            value={form.jerseyNumber}
            onChange={v => setForm({...form, jerseyNumber: v})}
          />

          <Input
            label="Age"
            keyboardType="numeric"
            placeholder="Enter age"
            value={form.age}
            onChange={v => setForm({...form, age: v})}
          />

          <Input
            label="Height (cm)"
            keyboardType="numeric"
            placeholder="Enter height"
            value={form.height}
            onChange={v => setForm({...form, height: v})}
          />

          <Input
            label="Weight (kg)"
            keyboardType="numeric"
            placeholder="Enter weight"
            value={form.weight}
            onChange={v => setForm({...form, weight: v})}
          />
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

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

/* INPUT COMPONENT */
function Input({label, value, onChange, ...rest}) {
  return (
    <View style={{marginBottom: 14}}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
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
// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//     backgroundColor: '#F1F5F9',
//   },

//   title: {
//     fontSize: 24,
//     fontWeight: '700',
//     textAlign: 'center',
//     marginBottom: 20,
//     color: '#0F172A',
//   },

//   /* IMAGE */
//   imageContainer: {
//     height: 130,
//     width: 130,
//     borderRadius: 70,
//     backgroundColor: '#E2E8F0',
//     alignSelf: 'center',
//     marginBottom: 22,
//     alignItems: 'center',
//     justifyContent: 'center',
//     overflow: 'hidden',
//     elevation: 4,
//   },
//   image: {
//     height: '100%',
//     width: '100%',
//   },
//   imagePlaceholder: {
//     color: '#64748B',
//     fontSize: 14,
//   },

//   /* CARD */
//   card: {
//     backgroundColor: '#fff',
//     padding: 18,
//     borderRadius: 14,
//     elevation: 2,
//     marginBottom: 20,
//   },
//   cardTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#0F172A',
//     marginBottom: 16,
//   },

//   /* INPUTS */
//   inputLabel: {
//     color: '#475569',
//     fontSize: 14,
//     marginBottom: 6,
//   },
//   input: {
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: '#CBD5E1',
//     fontSize: 16,
//     color: '#0F172A',
//   },

//   /* SAVE BUTTON */
//   saveButton: {
//     backgroundColor: '#1D4ED8',
//     padding: 15,
//     borderRadius: 12,
//   },
//   saveText: {
//     textAlign: 'center',
//     color: '#fff',
//     fontSize: 17,
//     fontWeight: '700',
//   },
//   imageOverlay: {
//     position: 'absolute',
//     bottom: 8,
//     right: 8,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 10,
//   },
//   imageOverlayText: {
//     color: '#fff',
//     fontSize: 15,
//     fontWeight: '700',
//   },

//   choiceRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 10,
//   },
//   choice: {
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#CBD5E1',
//   },
//   choiceActive: {
//     backgroundColor: '#1D4ED8',
//     borderColor: '#1D4ED8',
//   },
//   choiceText: {
//     fontWeight: '700',
//     color: '#334155',
//   },
//   sectionTitle: {
//     fontWeight: '800',
//     marginBottom: 10,
//     marginTop: 12,
//     color: '#0F172A',
//   },
// });

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

  /* IMAGE */
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

  /* CARD */
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

  /* INPUTS */
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

  /* SAVE BUTTON */
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
