// src/screens/CreateTeamScreen.jsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import API from '../../api/api';
import {launchImageLibrary} from 'react-native-image-picker';
import MainLayout from '../../components/MainLayout';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useNavigationHelper from '../../navigation/Navigationhelper';
import {s, vs, ms, rf} from '../../utils/responsive';

export default function CreateTeamScreen() {
  const [form, setForm] = useState({
    teamName: '',
    description: '',
    location: '',
    foundedYear: '',
  });

  useEffect(() => {
    loadUserName();
  }, []);
  const [logo, setLogo] = useState(null);
  const [cover, setCover] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const nav = useNavigationHelper();

  const loadUserName = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setForm(prev => ({...prev, teamName: user.name}));
      }
    } catch (err) {
      console.log('Error loading user name:', err);
    }
  };

  const pickImg = async type => {
    const result = await launchImageLibrary({mediaType: 'photo'});
    if (result.didCancel) return;
    const file = result.assets[0];
    const formatted = {uri: file.uri, name: file.fileName, type: file.type};
    if (type === 'logo') {
      setLogo(file.uri);
      setLogoFile(formatted);
    } else {
      setCover(file.uri);
      setCoverFile(formatted);
    }
  };

  const createTeam = async () => {
    if (!form.teamName || form.teamName.trim() === '') {
      return Alert.alert('Validation', 'Team name is required.');
    }
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (logoFile) formData.append('teamLogo', logoFile);
      if (coverFile) formData.append('coverImage', coverFile);

      await API.post('/api/team/create', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });

      Alert.alert('Success', 'Team created successfully');
      nav.to('TeamHome');
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to create team',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout title="Create Team">
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create Team</Text>

        <TouchableOpacity
          onPress={() => pickImg('cover')}
          style={styles.coverBox}>
          {cover ? (
            <Image source={{uri: cover}} style={styles.coverImg} />
          ) : (
            <Text style={styles.placeholder}>Upload Cover Image</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => pickImg('logo')}
          style={styles.logoBox}>
          {logo ? (
            <Image source={{uri: logo}} style={styles.logoImg} />
          ) : (
            <Text style={styles.placeholder}>Team Logo</Text>
          )}
        </TouchableOpacity>

        <Input
          label="Team Name"
          value={form.teamName}
          onChange={v => setForm({...form, teamName: v})}
        />
        <Input
          label="Description"
          value={form.description}
          onChange={v => setForm({...form, description: v})}
        />
        <Input
          label="Location"
          value={form.location}
          onChange={v => setForm({...form, location: v})}
        />
        <Input
          label="Founded Year"
          keyboardType="numeric"
          value={form.foundedYear}
          onChange={v => setForm({...form, foundedYear: v})}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, saving && {opacity: 0.7}]}
          onPress={createTeam}
          disabled={saving}>
          <Text style={styles.primaryBtnText}>
            {saving ? 'Creating...' : 'Create Team'}
          </Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </MainLayout>
  );
}

function Input({label, value, onChange, ...rest}) {
  return (
    <View style={{marginBottom: 15}}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {padding: s(20), backgroundColor: '#F1F5F9'},
  title: {
    fontSize: ms(26),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: vs(20),
  },

  coverBox: {
    height: vs(160),
    backgroundColor: '#E2E8F0',
    borderRadius: ms(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(20),
    overflow: 'hidden',
  },
  coverImg: {width: '100%', height: '100%'},

  logoBox: {
    height: s(100),
    width: s(100),
    borderRadius: ms(60),
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: vs(25),
  },
  logoImg: {width: '100%', height: '100%'},

  placeholder: {color: '#475569'},

  label: {fontSize: rf(14), marginBottom: vs(5), color: '#475569'},
  input: {
    backgroundColor: '#fff',
    padding: s(14),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  primaryBtn: {
    backgroundColor: '#1D4ED8',
    padding: s(15),
    borderRadius: ms(12),
    marginTop: vs(10),
  },
  primaryBtnText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: rf(16),
  },
});
