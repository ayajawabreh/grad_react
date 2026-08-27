import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { C, F } from "@/constants/tokens";
import { apiRequest } from "@/imports/api";
import { SyncResource, useSyncRefresh } from "@/context/SyncContext";

type Props = {
  title: string;
  subtitle: string;
  endpoint: string;
  responseKeys?: string[];
};

type Resource = Record<string, unknown> & { id?: string | number };

export default function AdminResourceScreen({
  title,
  subtitle,
  endpoint,
  responseKeys = [],
}: Props) {
  const [items, setItems] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const responsePath = responseKeys.join(".");

  const load = useCallback(async () => {
    try {
      setError("");
      const response = await apiRequest(endpoint, { method: "GET" });
      const data = response?.data ?? response;
      const nested = responsePath.split(".").filter(Boolean).reduce<unknown>(
        (value, key) =>
          Array.isArray(value)
            ? value
            : (value as Record<string, unknown> | null)?.[key] ?? value,
        data
      );
      const list = Array.isArray(nested)
        ? nested
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setItems(list);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ??
          "Could not load this admin section."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint, responsePath]);

  const syncResource = (endpoint.match(/\/(jobs|applications|students|companies|interviews)/)?.[1] ?? "admin")
    .replace("students", "student")
    .replace("companies", "company") as SyncResource;
  useSyncRefresh(["admin", syncResource], load);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? items.filter((item) =>
          JSON.stringify(item).toLowerCase().includes(query)
        )
      : items;
  }, [items, search]);

  const getTitle = (item: Resource) =>
    String(item.name ?? item.title ?? item.email ?? `#${item.id ?? "-"}`);

  const getSubtitle = (item: Resource) =>
    String(
      item.company_name ??
        item.description ??
        item.status ??
        item.email ??
        ""
    );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color={C.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${title.toLowerCase()}`}
            placeholderTextColor={C.textMuted}
            style={styles.input}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={styles.stateText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.state}>
          <Ionicons name="alert-circle-outline" size={34} color={C.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => String(item.id ?? index)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={C.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.state}>
              <Ionicons name="file-tray-outline" size={34} color={C.textMuted} />
              <Text style={styles.stateText}>No records found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{getTitle(item)}</Text>
              {!!getSubtitle(item) && (
                <Text style={styles.cardSubtitle}>{getSubtitle(item)}</Text>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  title: { fontFamily: F, fontSize: 26, fontWeight: "800", color: C.text },
  subtitle: { fontFamily: F, fontSize: 13, color: C.textSec, marginTop: 5 },
  searchBox: { height: 48, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 13, marginTop: 17 },
  input: { flex: 1, fontFamily: F, color: C.text, fontSize: 14 },
  list: { paddingHorizontal: 18, paddingBottom: 30, gap: 10 },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16 },
  cardTitle: { fontFamily: F, color: C.text, fontSize: 15, fontWeight: "700" },
  cardSubtitle: { fontFamily: F, color: C.textSec, fontSize: 12, marginTop: 5 },
  state: { flex: 1, minHeight: 220, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  stateText: { fontFamily: F, color: C.textMuted, textAlign: "center" },
  errorText: { fontFamily: F, color: C.error, textAlign: "center", lineHeight: 20 },
});
