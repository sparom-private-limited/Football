// // src/screens/EditTeamScreen.jsx
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   StyleSheet,
//   ScrollView,
//   Alert,
// } from "react-native";
// import MainLayout from "../../components/MainLayout";
// import API from "../../api/api";
// import { launchImageLibrary } from "react-native-image-picker";
// import { useNavigation , useRoute  } from "@react-navigation/native";

// export default function EditTeamScreen() {
//    const [team, setTeam] = useState(null);
//   const [form, setForm] = useState({
//     teamName: "",
//     description: "",
//     location: "",
//     foundedYear: "",
//   });
//   const [logo, setLogo] = useState(null);
//   const [cover, setCover] = useState(null);
//   const [logoFile, setLogoFile] = useState(null);
//   const [coverFile, setCoverFile] = useState(null);
//   const [saving, setSaving] = useState(false);
//     const nav = useNavigationHelper();
//       const route = useRoute(); 

      
//   useEffect(() => {
//   if (route?.params?.team) {
//     setTeam(route.params.team);
//     prefill(route.params.team);
//   } else {
//     loadTeam(); // fallback API call
//   }
// }, [route?.params]);


//   const loadTeam = async () => {
//     try {
//       setTeam(res.data);
//       prefill(res.data);
//     } catch (err) {
//       Alert.alert("Error", "Unable to load team.");
//     }
//   };

//   const prefill = (t) => {
//     setForm({
//       teamName: t.teamName || "",
//       description: t.description || "",
//       location: t.location || "",
//       foundedYear: t.foundedYear?.toString() || "",
//     });
//     setLogo(t.teamLogoUrl || null);
//     setCover(t.coverImageUrl || null);
//   };

//   const pickImg = async (type) => {
//     const result = await launchImageLibrary({ mediaType: "photo" });
//     if (result.didCancel) return;
//     const file = result.assets[0];
//     const formatted = { uri: file.uri, name: file.fileName, type: file.type };
//     if (type === "logo") {
//       setLogo(file.uri);
//       setLogoFile(formatted);
//     } else {
//       setCover(file.uri);
//       setCoverFile(formatted);
//     }
//   };

//   const save = async () => {
//     if (!form.teamName || form.teamName.trim() === "") {
//       return Alert.alert("Validation", "Team name is required.");
//     }
//     setSaving(true);
//     try {
//       const formData = new FormData();
//       Object.entries(form).forEach(([k, v]) => {
//         if (v !== undefined && v !== null) formData.append(k, v);
//       });
//       if (logoFile) formData.append("teamLogo", logoFile);
//       if (coverFile) formData.append("coverImage", coverFile);

//       await API.put("/api/team/update", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       Alert.alert("Success", "Team updated");
//       navigation.navigate("TeamHome");
//     } catch (err) {
//       Alert.alert("Error", err.response?.data?.message || "Update failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <MainLayout>
//        <View style={styles.container}>
//         <Text style={styles.title}>Edit Team</Text>

//         <TouchableOpacity onPress={() => pickImg("cover")} style={styles.coverBox}>
//           {cover ? <Image source={{ uri: cover }} style={styles.coverImg} /> : <Text style={styles.placeholder}>Upload Cover Image</Text>}
//         </TouchableOpacity>

//         <TouchableOpacity onPress={() => pickImg("logo")} style={styles.logoBox}>
//           {logo ? <Image source={{ uri: logo }} style={styles.logoImg} /> : <Text style={styles.placeholder}>Team Logo</Text>}
//         </TouchableOpacity>

//         <Input label="Team Name" value={form.teamName} onChange={(v) => setForm({ ...form, teamName: v })} />
//         <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
//         <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
//         <Input label="Founded Year" value={form.foundedYear} keyboardType="numeric" onChange={(v) => setForm({ ...form, foundedYear: v })} />

//         <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
//           <Text style={styles.primaryBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
//         </TouchableOpacity>

//         <View style={{ height: 40 }} />
//       </View>
//     </MainLayout>
//   );
// }

// function Input({ label, value, onChange, ...rest }) {
//   return (
//     <View style={{ marginBottom: 15 }}>
//       <Text style={styles.label}>{label}</Text>
//       <TextInput style={styles.input} value={value} onChangeText={onChange} {...rest} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 20, backgroundColor: "#F1F5F9" },
//   title: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 20 },

//   coverBox: { height: 160, backgroundColor: "#E2E8F0", borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 20, overflow: "hidden" },
//   coverImg: { width: "100%", height: "100%" },

//   logoBox: { height: 100, width: 100, borderRadius: 60, backgroundColor: "#E2E8F0", alignSelf: "center", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: 25 },
//   logoImg: { width: "100%", height: "100%" },

//   placeholder: { color: "#475569" },

//   label: { fontSize: 14, marginBottom: 5, color: "#475569" },
//   input: { backgroundColor: "#fff", padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1" },

//   primaryBtn: { backgroundColor: "#1D4ED8", padding: 15, borderRadius: 12, marginTop: 10 },
//   primaryBtnText: { textAlign: "center", color: "#fff", fontWeight: "700", fontSize: 16 },
// });

// src/screens/EditTeamScreen.jsx - IMPROVED VERSION
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import MainLayout from "../../components/MainLayout";
import API from "../../api/api";
import { launchImageLibrary } from "react-native-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import useNavigationHelper from "../../navigation/Navigationhelper";

export default function EditTeamScreen() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    teamName: "",
    description: "",
    location: "",
    foundedYear: "",
  });
  const [logo, setLogo] = useState(null);
  const [cover, setCover] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);
const nav = useNavigationHelper();
  const route = useRoute();

  useEffect(() => {
    if (route?.params?.team) {
      // Team passed via navigation params
      setTeam(route.params.team);
      prefill(route.params.team);
      setLoading(false);
    } else {
      // Fallback: fetch from API
      loadTeam();
    }
  }, [route?.params]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/team/my-team");
      
      if (!res.data) {
        Alert.alert("Error", "No team found");
        nav.back();
        return;
      }
      
      setTeam(res.data);
      prefill(res.data);
    } catch (err) {
      console.error("Load team error:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Unable to load team."
      );
      nav.back();
    } finally {
      setLoading(false);
    }
  };

  const prefill = (t) => {
    setForm({
      teamName: t.teamName || "",
      description: t.description || "",
      location: t.location || "",
      foundedYear: t.foundedYear?.toString() || "",
    });
    setLogo(t.teamLogoUrl || null);
    setCover(t.coverImageUrl || null);
  };

  const pickImg = async (type) => {
    try {
      const result = await launchImageLibrary({ 
        mediaType: "photo",
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      
      if (result.didCancel) return;
      
      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage || "Failed to pick image");
        return;
      }

      const file = result.assets[0];
      const formatted = { 
        uri: file.uri, 
        name: file.fileName || `image_${Date.now()}.jpg`, 
        type: file.type || "image/jpeg"
      };

      if (type === "logo") {
        setLogo(file.uri);
        setLogoFile(formatted);
      } else {
        setCover(file.uri);
        setCoverFile(formatted);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const validateForm = () => {
    if (!form.teamName || form.teamName.trim() === "") {
      Alert.alert("Validation", "Team name is required.");
      return false;
    }

    if (form.foundedYear && (isNaN(form.foundedYear) || form.foundedYear < 1800 || form.foundedYear > new Date().getFullYear())) {
      Alert.alert("Validation", "Please enter a valid founding year.");
      return false;
    }

    return true;
  };

  const save = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const formData = new FormData();
      
      // Only append changed fields
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      if (logoFile) formData.append("teamLogo", logoFile);
      if (coverFile) formData.append("coverImage", coverFile);

      const res = await API.put("/api/team/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Success", "Team updated successfully", [
        {
          text: "OK",
          onPress: () => {
            // Navigate back and refresh
            nav.to("TeamHome", { refresh: true });
          },
        },
      ]);
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to update team"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="Edit Team">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Edit Team">
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Edit Team</Text>

        <TouchableOpacity
          onPress={() => pickImg("cover")}
          style={styles.coverBox}
        >
          {cover ? (
            <Image source={{ uri: cover }} style={styles.coverImg} />
          ) : (
            <Text style={styles.placeholder}>Upload Cover Image</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => pickImg("logo")} style={styles.logoBox}>
          {logo ? (
            <Image source={{ uri: logo }} style={styles.logoImg} />
          ) : (
            <Text style={styles.placeholder}>Team Logo</Text>
          )}
        </TouchableOpacity>

        <Input
          label="Team Name *"
          value={form.teamName}
          onChange={(v) => setForm({ ...form, teamName: v })}
          placeholder="Enter team name"
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
          placeholder="Brief description about your team"
          multiline
        />
        <Input
          label="Location"
          value={form.location}
          onChange={(v) => setForm({ ...form, location: v })}
          placeholder="City, Country"
        />
        <Input
          label="Founded Year"
          keyboardType="numeric"
          value={form.foundedYear}
          onChange={(v) => setForm({ ...form, foundedYear: v })}
          placeholder="e.g., 2020"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.primaryBtnText}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </MainLayout>
  );
}

// Input component
function Input({ label, value, onChange, ...props }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, props.multiline && { height: 80 }]}
        value={value}
        onChangeText={onChange}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  coverBox: {
    height: 160,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  coverImg: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  logoBox: {
    width: 100,
    height: 100,
    backgroundColor: "#e5e7eb",
    borderRadius: 50,
    alignSelf: "center",
    marginTop: -50,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  placeholder: {
    color: "#6b7280",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: "#1D4ED8",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
