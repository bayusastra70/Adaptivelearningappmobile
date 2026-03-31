import React, { useState, useCallback } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../../lib/api";

export default function Home() {
  const [skills, setSkills] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]); // State baru untuk progres
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      // Menggunakan Promise.all agar fetch data profile, skills, dan progress berjalan paralel (lebih cepat)
      const [profileRes, skillsRes, progressRes] = await Promise.all([
        API.get("/profile"),
        API.get("/skills/my-skills"),
        API.get("/learning/my-progress"),
      ]);

      setUserName(profileRes.data.name || "User");
      setSkills(skillsRes.data);
      setProgressData(progressRes.data);
    } catch (err: any) {
      console.log("Load Data Error:", err);
      if (err.response?.status === 401) {
        await AsyncStorage.clear();
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  return (
    <View className="flex-1 bg-slate-50">
      {/* ===== HEADER BANNER ===== */}
      <LinearGradient
        colors={["#1e40af", "#3b82f6"]}
        className="pt-16 px-6 pb-12 rounded-b-[35px]"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white text-2xl font-extrabold">
              Halo, {userName} 👋
            </Text>
            <Text className="text-blue-100 text-sm mt-1">
              Siap mengasah skill baru hari ini?
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* ===== PROGRESS SECTION (FLOATING CARDS) ===== */}
      {!loading && progressData.length > 0 && (
        <View className="mt-[-35px] mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 10 }}
          >
            {progressData.map((item) => (
              <TouchableOpacity
                key={item.path_id}
                activeOpacity={0.9}
                onPress={() => router.push({
                  pathname: "/path-detail",
                  params: { skillId: item.id, skillName: item.name },
                })}
                className="bg-white w-64 p-5 rounded-[28px] mr-4 shadow-xl shadow-blue-900/10 border border-slate-50"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-2">
                    <Text className="font-bold text-slate-800 text-sm" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {item.completed_steps} / {item.total_steps} Langkah
                    </Text>
                  </View>
                  <View className="bg-blue-50 px-2 py-1 rounded-lg">
                    <Text className="text-blue-600 font-black text-[10px]">
                      {item.progress_percentage}%
                    </Text>
                  </View>
                </View>

                {/* Progress Bar Container */}
                <View className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${item.progress_percentage}%` }}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ===== ACTION BAR ===== */}
      <View className="flex-row justify-between items-center px-6 mt-4 mb-4">
        <Text className="text-lg font-bold text-slate-800">Daftar Skill</Text>
        <TouchableOpacity
          className="bg-blue-600 flex-row py-2.5 px-4 rounded-full items-center shadow-lg shadow-blue-600/30"
          onPress={() => router.push("/addskill")}
        >
          <Ionicons name="add-circle" size={18} color="#fff" />
          <Text className="text-white font-bold text-xs ml-1.5">Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* ===== SKILL LIST ===== */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-2 text-slate-500 text-sm">Sinkronisasi data...</Text>
        </View>
      ) : skills.length === 0 ? (
        <View className="flex-1 items-center justify-center pb-24">
          <Ionicons name="rocket-outline" size={80} color="#e2e8f0" />
          <Text className="text-base font-bold text-slate-500 mt-5">
            Mulai Belajar Sekarang!
          </Text>
          <Text className="text-sm text-slate-400 mt-2 text-center px-10">
            Pilih skill yang ingin kamu kuasai dan AI akan memandu jalanmu.
          </Text>
        </View>
      ) : (
        <FlatList
          data={skills}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white flex-row items-center justify-between p-4 rounded-[24px] mb-4 shadow-sm shadow-slate-200 border border-slate-50"
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/path-detail",
                  params: { skillId: item.id, skillName: item.name },
                })
              }
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-slate-50 p-3 rounded-2xl">
                  <Ionicons name="extension-puzzle-outline" size={24} color="#3b82f6" />
                </View>
                <View className="ml-4">
                  <Text className="text-base font-bold text-slate-700">
                    {item.name}
                  </Text>
                  <View className="bg-blue-50 self-start px-2 py-0.5 rounded-md mt-1">
                    <Text className="text-[10px] text-blue-500 font-bold uppercase">
                      Level {item.level}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="bg-slate-50 p-2 rounded-full">
                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}