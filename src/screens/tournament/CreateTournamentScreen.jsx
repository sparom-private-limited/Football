import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import API from "../../api/api";
import MainLayout from "../../components/MainLayout";
import {s, vs, ms, rf} from "../../utils/responsive";
import useNavigationHelper from '../../navigation/Navigationhelper';

export default function CreateTournamentScreen() {
   const nav = useNavigationHelper();
  const [form, setForm] = useState({
    name: "",
    description: "",
    format: "KNOCKOUT",
    venue: "",
    entryFee: "",
    maxTeams: "",
    startDate: null,
    endDate: null,
  });

  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
const [dateType, setDateType] = useState(null); // "start" | "end"




  /* ---------------- VALIDATION ---------------- */

  const validate = () => {
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Tournament name is required");
      return false;
    }

    if (!form.startDate || !form.endDate) {
      Alert.alert("Validation Error", "Start and End dates are required");
      return false;
    }

    if (form.startDate > form.endDate) {
      Alert.alert(
        "Validation Error",
        "End date must be after start date"
      );
      return false;
    }

    if (form.entryFee && isNaN(form.entryFee)) {
      Alert.alert("Validation Error", "Entry fee must be a number");
      return false;
    }

    if (form.maxTeams && isNaN(form.maxTeams)) {
      Alert.alert("Validation Error", "Max teams must be a number");
      return false;
    }

    return true;
  };

  /* ---------------- SUBMIT ---------------- */

  const submit = async () => {
    if (!validate() || loading) return;

    setLoading(true);
    try {
      await API.post("/api/tournament/create", {
        name: form.name.trim(),
        description: form.description.trim(),
        format: form.format,
        venue: form.venue.trim(),
        entryFee: Number(form.entryFee) || 0,
        maxTeams: form.maxTeams ? Number(form.maxTeams) : null,
        startDate: form.startDate,
        endDate: form.endDate,
      });

      nav.toTournament("MyTournaments");
    } catch (err) {
      // Alert.alert(
      //   "Error",
      //   err.response?.data?.message || "Failed to create tournament"
      // );
  console.log("ERR RESPONSE:", err.response?.data);
  console.log("ERR STATUS:", err.response?.status);
  console.log("ERR MESSAGE:", err.message);
  Alert.alert("Error", err.message || "Failed"); // ✅ show err.message not response

    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DATE PICKER ---------------- */

const openDatePicker = (type) => {
  if (showPicker) return; // ⛔ prevent double open
  setDateType(type);
  setShowPicker(true);
};



const onDateChange = (event, selectedDate) => {
  if (Platform.OS === "android") {
    setShowPicker(false);
  }

  if (event.type === "dismissed") {
    return;
  }

  setForm((prev) => ({
    ...prev,
    [dateType === "start" ? "startDate" : "endDate"]: selectedDate,
  }));
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const getMinDate = () => {
  // Start date: today (no past)
  if (dateType === "start") return today;

  // End date: must be >= selected start date
  if (dateType === "end") {
    return form.startDate || today;
  }

  return today;
};




  return (
    <MainLayout title="Create Tournament" forceBack>
      <ScrollView contentContainerStyle={styles.container}>
        {/* BASIC INFO */}
        <Card title="Basic Information">
          <Label text="Tournament Name *" />
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />

          <Label text="Description" />
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
          />
        </Card>

        {/* FORMAT */}
        <Card title="Format">
          <View style={styles.row}>
            {["KNOCKOUT", "LEAGUE"].map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.formatBtn,
                  form.format === f && styles.formatBtnActive,
                ]}
                onPress={() => setForm({ ...form, format: f })}
              >
                <Text
                  style={[
                    styles.formatText,
                    form.format === f && styles.formatTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* DATES */}
<Card title="Schedule">
  <Label text="Start Date *" />
  <TouchableOpacity
    style={styles.dateBtn}
    onPress={() => openDatePicker("start")}
  >
    <Text style={styles.dateText}>
      {form.startDate
        ? new Date(form.startDate).toDateString()
        : "Select start date"}
    </Text>
  </TouchableOpacity>

  <Label text="End Date *" />
  <TouchableOpacity
    style={styles.dateBtn}
    onPress={() => openDatePicker("end")}
  >
    <Text style={styles.dateText}>
      {form.endDate
        ? new Date(form.endDate).toDateString()
        : "Select end date"}
    </Text>
  </TouchableOpacity>
</Card>



        {/* DETAILS */}
        <Card title="Additional Details">
          <Label text="Venue" />
          <TextInput
            style={styles.input}
            value={form.venue}
            onChangeText={(v) => setForm({ ...form, venue: v })}
          />

          <Label text="Entry Fee (₹)" />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.entryFee}
            onChangeText={(v) => setForm({ ...form, entryFee: v })}
          />

          <Label text="Maximum Teams" />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.maxTeams}
            onChangeText={(v) => setForm({ ...form, maxTeams: v })}
          />
        </Card>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Create Tournament</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

 {showPicker && (
  <DateTimePicker
    value={
      dateType === "start"
        ? form.startDate || today
        : form.endDate || form.startDate || today
    }
    mode="date"
    minimumDate={getMinDate()}   // ✅ disables past & invalid end dates
    display={Platform.OS === "ios" ? "spinner" : "calendar"}
    onChange={onDateChange}
  />
)}



    </MainLayout>
  );
}

/* ---------------- REUSABLE UI ---------------- */

const Card = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Label = ({ text }) => (
  <Text style={styles.label}>{text}</Text>
);

const DateBtn = ({ value, onPress }) => (
  <TouchableOpacity style={styles.dateBtn} onPress={onPress}>
    <Text style={styles.dateText}>
      {value ? new Date(value).toDateString() : "Select date"}
    </Text>
  </TouchableOpacity>
);

/* ---------------- STYLES ---------------- */

// const styles = StyleSheet.create({
//   container: { paddingBottom: 40 },

//   card: {
//     backgroundColor: "#FFFFFF",
//     marginHorizontal: 16,
//     marginTop: 16,
//     padding: 16,
//     borderRadius: 14,
//     elevation: 2,
//   },

//   sectionTitle: {
//     fontSize: 15,
//     fontWeight: "600",
//     marginBottom: 12,
//     color: "#1E293B",
//   },

//   label: {
//     fontSize: 13,
//     fontWeight: "500",
//     color: "#475569",
//     marginBottom: 6,
//   },

//   input: {
//     backgroundColor: "#F8FAFC",
//     padding: 14,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: "#E2E8F0",
//     marginBottom: 14,
//     fontSize: 14,
//   },

//   textArea: {
//     height: 100,
//     textAlignVertical: "top",
//   },

//   row: {
//     flexDirection: "row",
//     gap: 10,
//   },

//   formatBtn: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: "#CBD5E1",
//     alignItems: "center",
//   },

//   formatBtnActive: {
//     backgroundColor: "#2563EB",
//     borderColor: "#2563EB",
//   },

//   formatText: {
//     fontWeight: "600",
//     color: "#334155",
//   },

//   formatTextActive: {
//     color: "#FFFFFF",
//   },

//  dateBtn: {
//   backgroundColor: "#F8FAFC",
//   borderWidth: 1,
//   borderColor: "#CBD5E1",
//   padding: 14,
//   borderRadius: 12,
//   marginBottom: 14,
//   justifyContent: "center",
// },


// dateText: {
//   color: "#0F172A",
//   fontSize: 14,
// },


//   btn: {
//     backgroundColor: "#2563EB",
//     marginHorizontal: 16,
//     marginTop: 24,
//     paddingVertical: 16,
//     borderRadius: 14,
//   },

//   btnText: {
//     color: "#FFFFFF",
//     fontWeight: "700",
//     textAlign: "center",
//     fontSize: 16,
//   },
// });


const styles = StyleSheet.create({
  container: { paddingBottom: vs(40) },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: s(16),
    marginTop: vs(16),
    padding: s(16),
    borderRadius: ms(14),
    elevation: 2,
  },

  sectionTitle: {
    fontSize: rf(15),
    fontWeight: "600",
    marginBottom: vs(12),
    color: "#1E293B",
  },

  label: {
    fontSize: rf(13),
    fontWeight: "500",
    color: "#475569",
    marginBottom: vs(6),
  },

  input: {
    backgroundColor: "#F8FAFC",
    padding: s(14),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: vs(14),
    fontSize: rf(14),
     color: "#0F172A",  
  },

  textArea: {
    height: vs(100),
    textAlignVertical: "top",
  },

  row: {
    flexDirection: "row",
    gap: s(10),
  },

  formatBtn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
  },

  formatBtnActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  formatText: {
    fontWeight: "600",
    color: "#334155",
    fontSize: rf(14),
  },

  formatTextActive: {
    color: "#FFFFFF",
  },

  dateBtn: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    padding: s(14),
    borderRadius: ms(12),
    marginBottom: vs(14),
    justifyContent: "center",
  },

  dateText: {
    color: "#0F172A",
    fontSize: rf(14),
  },

  btn: {
    backgroundColor: "#2563EB",
    marginHorizontal: s(16),
    marginTop: vs(24),
    paddingVertical: vs(16),
    borderRadius: ms(14),
  },

  btnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    fontSize: rf(16),
  },
});