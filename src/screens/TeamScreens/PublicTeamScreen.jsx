// src/screens/PublicTeamScreen.jsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import MainLayout from "../../components/MainLayout";
import API from "../../api";
import { useNavigation } from "@react-navigation/native";
import useNavigationHelper from "../../navigation/Navigationhelper";

export default function PublicTeamScreen() {
  const teamId = route.params?.teamId;
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
const nav = useNavigationHelper();

  useEffect(() => {
    load();
  }, [teamId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/team/get/${teamId}`);
      setTeam(res.data);
    } catch (err) {
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      </MainLayout>
    );
  }

  if (!team) {
    return (
      <MainLayout>
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 18, color: "#475569" }}>Team not found</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView style={{ backgroundColor: "#F1F5F9" }}>
        {team.coverImageUrl ? <Image source={{ uri: team.coverImageUrl }} style={styles.cover} /> : <View style={[styles.cover, { backgroundColor: "#E2E8F0" }]} />}

        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            {team.teamLogoUrl ? <Image source={{ uri: team.teamLogoUrl }} style={styles.logo} /> : <View style={[styles.logo, styles.logoPlaceholder]}><Text style={{ color: "#fff", fontWeight: "700" }}>{team.teamName?.[0]}</Text></View>}
          </View>

          <View style={{ marginLeft: 12 }}>
            <Text style={styles.teamName}>{team.teamName}</Text>
            <Text style={styles.location}>{team.location}</Text>
            <Text style={styles.founded}>Founded: {team.foundedYear || "—"}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Squad</Text>
          {team.players?.map((p) => (
            <View key={p._id} style={styles.playerRow}>
              <Image source={{ uri: p.profileImageUrl }} style={styles.playerImg} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.playerName}>{p.name}</Text>
                <Text style={styles.playerPos}>{p.position}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  cover: { height: 160, width: "100%" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, paddingTop: 8 },
  logoWrapper: { width: 84, height: 84, borderRadius: 48, overflow: "hidden", backgroundColor: "#fff", elevation: 4 },
  logo: { width: "100%", height: "100%" },
  logoPlaceholder: { backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center" },

  teamName: { fontSize: 20, fontWeight: "700" },
  location: { color: "#475569", marginTop: 4 },
  founded: { color: "#475569", marginTop: 2 },

  card: { backgroundColor: "#fff", margin: 16, padding: 16, borderRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },

  playerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  playerImg: { width: 48, height: 48, borderRadius: 24 },
  playerName: { fontSize: 16, fontWeight: "700" },
  playerPos: { color: "#475569", marginTop: 4 },
});
