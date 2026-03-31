import React, { useState, useCallback } from "react";
import { View, Alert, Image, ScrollView, ActivityIndicator, Platform, TouchableOpacity, Text, TextInput } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import API from "@/lib/api";
import axios from "axios";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", bio: "", phone: "" });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("/profile");
      const profileData = res.data;
      if (profileData.avatar) profileData.avatar = `${profileData.avatar}?t=${new Date().getTime()}`;
      setProfile(profileData);
      setForm({ name: profileData.name || "", bio: profileData.bio || "", phone: profileData.phone || "" });
    } catch (err: any) {
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProfile(); }, []));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const token = await AsyncStorage.getItem("access_token");
      try {
        const formData = new FormData();
        const localUri = asset.uri;
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        // @ts-ignore
        formData.append("file", {
          uri: Platform.OS === "android" ? localUri : localUri.replace("file://", ""),
          name: filename,
          type: asset.mimeType || "image/jpeg",
        });

        const res = await axios.post("http://192.168.1.14:8000/upload-avatar", formData, {
          headers: { "Authorization": `Bearer ${token}` },
          transformRequest: (data) => data,
        });

        if (res.data.avatar) {
          fetchProfile();
          Alert.alert("Sukses", "Foto profil diperbarui!");
        }
      } catch (err) { Alert.alert("Error", "Gagal upload."); }
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/login");
  };

  if (loading && !profile) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <LinearGradient colors={["#1e40af", "#3b82f6"]} className="h-40 pt-10 items-center">
        <Text className="text-white text-xl font-extrabold tracking-wider">Profil Saya</Text>
      </LinearGradient>

      <View className="items-center -mt-12 mb-2">
        <View className="bg-white p-1 rounded-full shadow-lg relative">
          <Image 
            source={{ uri: profile?.avatar || "https://i.pravatar.cc/150" }} 
            className="w-28 h-28 rounded-full" 
          />
          <TouchableOpacity 
            onPress={pickImage}
            className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-2 border-white"
          >
            <Ionicons name="camera" size={18} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-xl font-bold text-slate-800 mt-3">{profile?.name || "User"}</Text>
        <Text className="text-slate-500 text-sm">{profile?.email}</Text>
      </View>

      <View className="mx-5 mt-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        {!editing ? (
          <View>
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Bio</Text>
            <Text className="text-slate-700 mt-1 mb-4">{profile?.bio || "Belum ada bio"}</Text>
            
            <View className="h-[1px] bg-slate-100 mb-4" />
            
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Phone</Text>
            <Text className="text-slate-700 mt-1 mb-6">{profile?.phone || "-"}</Text>

            <TouchableOpacity 
              onPress={() => setEditing(true)}
              className="bg-blue-600 py-3 rounded-xl flex-row justify-center items-center"
            >
              <Ionicons name="pencil" size={16} color="white" className="mr-2" />
              <Text className="text-white font-bold ml-2">Edit Profil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <TextInput 
              placeholder="Nama" 
              className="border border-slate-200 p-3 rounded-xl mb-4"
              value={form.name}
              onChangeText={(t) => setForm({...form, name: t})}
            />
            <TextInput 
              placeholder="Bio" 
              multiline 
              className="border border-slate-200 p-3 rounded-xl mb-4 h-20"
              value={form.bio}
              onChangeText={(t) => setForm({...form, bio: t})}
            />
            <TextInput 
              placeholder="Phone" 
              keyboardType="phone-pad"
              className="border border-slate-200 p-3 rounded-xl mb-6"
              value={form.phone}
              onChangeText={(t) => setForm({...form, phone: t})}
            />
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => setEditing(false)} className="flex-1 bg-slate-100 py-3 rounded-xl items-center">
                <Text className="text-slate-600 font-bold">Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { /* updateProfile logic */ setEditing(false); }} className="flex-1 bg-blue-600 py-3 rounded-xl items-center">
                <Text className="text-white font-bold">Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={logout} className="mt-8 items-center">
        <Text className="text-red-500 font-bold">Keluar dari Akun</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}