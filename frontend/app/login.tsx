import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import API from "@/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Fungsi Login Manual
  const login = async () => {
    if (!email || !password) return Alert.alert("Ups!", "Email dan password harus diisi.");
    try {
      setLoading(true);
      const res = await API.post("/login", { email, password });
      await AsyncStorage.setItem("access_token", res.data.access_token);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login Gagal", "Cek kembali email atau password kamu.");
    } finally {
      setLoading(false);
    }
  };

  // Handler Login Google (Simulasi/Integrasi)
  const handleGoogleLogin = async () => {
    Alert.alert("Info", "Menghubungkan ke Google...");
    // Integrasi library di sini
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-8">
        
        {/* Header Baru: Logo di Samping Text */}
        <View className="flex-row items-center justify-center mb-12">
          <View className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-300 mr-4">
            <Ionicons name="school" size={32} color="white" />
          </View>
          <View>
            <Text className="text-2xl font-black text-slate-800">Selamat Datang di</Text>
            <Text className="text-xl font-bold text-blue-600 -mt-1">AdaptiveLearning</Text>
          </View>
        </View>

        {/* Form Inputs */}
        <View className="space-y-4">
          <View>
            <Text className="text-slate-600 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">Email</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-1">
              <Ionicons name="mail-outline" size={18} color="#64748b" />
              <TextInput 
                placeholder="nama@email.com"
                className="flex-1 p-3 text-slate-800"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-slate-600 font-bold mb-2 ml-1 text-xs uppercase tracking-widest">Password</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-1">
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
              <TextInput 
                placeholder="••••••••"
                secureTextEntry={!showPass}
                className="flex-1 p-3 text-slate-800"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={login} 
          disabled={loading}
          className="bg-blue-600 p-4 rounded-2xl items-center shadow-xl shadow-blue-400 mt-10"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Masuk</Text>}
        </TouchableOpacity>

        {/* Social Login Section */}
        <View className="flex-row items-center my-10">
          <View className="flex-1 h-[1px] bg-slate-100" />
          <Text className="mx-4 text-slate-300 text-[10px] font-bold uppercase tracking-tighter">Atau lanjut dengan</Text>
          <View className="flex-1 h-[1px] bg-slate-100" />
        </View>

        <View className="flex-row gap-4">
          <TouchableOpacity 
            onPress={handleGoogleLogin}
            className="flex-1 flex-row justify-center items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm"
          >
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text className="ml-2 font-bold text-slate-700">Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-1 flex-row justify-center items-center bg-slate-900 p-4 rounded-2xl shadow-sm">
            <Ionicons name="logo-github" size={20} color="white" />
            <Text className="ml-2 font-bold text-white">GitHub</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-12 mb-6">
          <Text className="text-slate-400">Baru di sini? </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text className="text-blue-600 font-bold">Buat Akun</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}