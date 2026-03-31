import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Modal, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import API from "../lib/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const router = useRouter();

  const register = async () => {
    if (!name || !email || !password) {
      Toast.show({ type: "error", text1: "Validasi gagal", text2: "Semua field wajib diisi" });
      return;
    }

    try {
      setLoading(true);
      await API.post("/register", { name, email, password });
      setSuccessModal(true);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Register gagal",
        text2: err.response?.data?.detail || "Terjadi kesalahan",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-8">
        <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-6 bg-slate-50 p-2 rounded-xl">
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <View className="items-center mb-10 mt-10">
          <Text className="text-3xl font-black text-slate-800">Buat Akun</Text>
          <Text className="text-slate-400 mt-2 text-center">Mulai perjalanan belajarmu hari ini!</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-slate-600 font-bold mb-2 ml-1">Nama Lengkap</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1">
              <Ionicons name="person-outline" size={20} color="#64748b" />
              <TextInput className="flex-1 p-3 text-slate-800" placeholder="Made Bayu..." value={name} onChangeText={setName} />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-slate-600 font-bold mb-2 ml-1">Email</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1">
              <Ionicons name="mail-outline" size={20} color="#64748b" />
              <TextInput className="flex-1 p-3 text-slate-800" placeholder="nama@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-slate-600 font-bold mb-2 ml-1">Password</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1">
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
              <TextInput className="flex-1 p-3 text-slate-800" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={register} 
          disabled={loading}
          className="bg-blue-600 p-4 rounded-2xl items-center shadow-xl shadow-blue-400 mt-10"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Daftar Akun</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/login")} className="mt-8 mb-10">
          <Text className="text-center text-slate-500">Sudah punya akun? <Text className="text-blue-600 font-bold">Masuk</Text></Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SUCCESS MODAL */}
      <Modal visible={successModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center px-8">
          <View className="bg-white w-full rounded-[40px] p-10 items-center">
            <View className="bg-green-100 p-4 rounded-full mb-6">
              <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
            </View>
            <Text className="text-2xl font-black text-slate-800">Registrasi Berhasil</Text>
            <Text className="text-slate-500 text-center mt-2 leading-5">Akun kamu sudah aktif. Mari mulai belajar sesuatu yang baru!</Text>

            <TouchableOpacity
              className="bg-blue-600 w-full p-4 rounded-2xl items-center mt-8 shadow-lg shadow-blue-200"
              onPress={() => {
                setSuccessModal(false);
                router.replace("/login");
              }}
            >
              <Text className="text-white font-bold text-lg">Masuk ke Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </KeyboardAvoidingView>
  );
}