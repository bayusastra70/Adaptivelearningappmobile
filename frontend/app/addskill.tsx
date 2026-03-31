import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../lib/api";

export default function AddSkill() {
  const router = useRouter();
  const [skills, setSkills] = useState<any[]>([]);
  const [skillId, setSkillId] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const loadSkills = async () => {
    try {
      setFetching(true);
      const res = await API.get("/skills/");
      setSkills(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      Alert.alert("Error", "Gagal mengambil daftar skill dari server.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { loadSkills(); }, []);

  const submitSkill = async () => {
    if (skillId === 0) return Alert.alert("Pilih Skill", "Pilih salah satu keahlian dulu ya!");
    try {
      setLoading(true);
      await API.post("/skills/my-skills", { skill_id: skillId, level: level });
      Alert.alert("Berhasil!", "Keahlian baru telah ditambahkan.");
      router.back();
    } catch (err: any) {
      Alert.alert("Gagal", err.response?.data?.detail || "Gagal menyimpan keahlian.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50 p-6">
      <View className="items-center mt-4 mb-8">
        <View className="bg-blue-600 p-4 rounded-full mb-4 shadow-lg shadow-blue-200">
          <Ionicons name="medal" size={32} color="white" />
        </View>
        <Text className="text-2xl font-black text-slate-800">Tambah Keahlian</Text>
        <Text className="text-slate-400 mt-1">Pilih skill yang ingin kamu pelajari</Text>
      </View>

      <View className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100">
        {fetching ? (
          <View className="py-10">
            <ActivityIndicator color="#2563eb" size="large" />
            <Text className="text-center text-slate-400 mt-4">Mengambil data...</Text>
          </View>
        ) : (
          <>
            <View className="mb-6">
              <Text className="text-slate-600 font-bold mb-3 ml-1 uppercase text-[10px] tracking-widest">Pilih Keahlian</Text>
              <View className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                <Picker
                  selectedValue={String(skillId)}
                  onValueChange={(itemValue) => setSkillId(Number(itemValue))}
                  mode="dropdown"
                  dropdownIconColor="#2563eb"
                  // Style untuk memastikan teks terlihat (terutama di Android)
                  style={{ color: '#1e293b' }}
                >
                  <Picker.Item label="-- Klik untuk Pilih --" value="0" color="#94a3b8" />
                  {skills.map((s) => (
                    <Picker.Item
                      key={s.id.toString()}
                      label={s.name}
                      value={s.id.toString()}
                      color="#1e293b" // Warna teks item (Hitam Pekat)
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View className="mb-10">
              <Text className="text-slate-600 font-bold mb-3 ml-1 uppercase text-[10px] tracking-widest">Tingkat Kemahiran</Text>
              <View className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                <Picker
                  selectedValue={level}
                  onValueChange={(itemValue) => setLevel(Number(itemValue))}
                  mode="dropdown"
                  dropdownIconColor="#2563eb"
                  style={{ color: '#1e293b' }}
                >
                  {[1, 2, 3, 4, 5].map((l) => (
                    <Picker.Item
                      key={l}
                      label={`Level ${l} ${l === 1 ? '(Pemula)' : l === 5 ? '(Ahli)' : ''}`}
                      value={l}
                      color="#1e293b" // Warna teks item
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <TouchableOpacity
              onPress={submitSkill}
              disabled={loading || skillId === 0}
              className={`py-4 rounded-2xl items-center flex-row justify-center shadow-lg ${skillId === 0 || loading ? 'bg-slate-200 shadow-none' : 'bg-blue-600 shadow-blue-200'
                }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">Simpan Keahlian</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity onPress={() => router.back()} className="mt-8 items-center mb-10">
        <Text className="text-slate-400 font-bold">Batal dan Kembali</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}