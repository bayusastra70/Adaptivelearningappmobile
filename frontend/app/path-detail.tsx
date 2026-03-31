import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../lib/api";

export default function PathDetail() {
  const { skillId, skillName } = useLocalSearchParams();
  const router = useRouter();

  // State Utama
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<any[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);

  // State Fitur AI Quiz
  const [quizVisible, setQuizVisible] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // State Fitur Ask AI (Chat)
  const [askAiVisible, setAskAiVisible] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const completedCount = steps.filter(s => s.is_completed).length;
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  const loadPath = async () => {
    try {
      setLoading(true);
      const res = await API.post(`/learning/generate/${skillId}`);
      if (res.data?.steps) setSteps(res.data.steps);
    } catch (err) {
      Alert.alert("Error", "Gagal muat kurikulum AI. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPath(); }, [skillId]);

  const toggleComplete = async (stepId: number) => {
    try {
      const res = await API.patch(`/learning/step/${stepId}/complete`);
      if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSteps(prev => prev.map(s => s.id === stepId ? { ...s, is_completed: res.data.is_completed } : s));
    } catch (err) {
      Alert.alert("Gagal", "Error update progress");
    }
  };

  // Logic AI Quiz
  const startQuiz = async (stepId: number) => {
    try {
      setSelectedStepId(stepId);
      setQuizLoading(true);
      const res = await API.get(`/learning/step/${stepId}/quiz`);
      setCurrentQuiz(res.data);
      setQuizVisible(true);
    } catch (err) {
      Alert.alert("Error", "Gagal memuat kuis AI");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizAnswer = (index: number) => {
    if (index === currentQuiz.answer_index) {
      Alert.alert("Bagus!", "Jawaban benar! Materi ini selesai dikuasai.", [
        {
          text: "Mantap", onPress: () => {
            setQuizVisible(false);
            if (selectedStepId) toggleComplete(selectedStepId);
          }
        }
      ]);
    } else {
      Alert.alert("Ups!", "Jawaban kurang tepat. Coba baca lagi materinya ya!");
    }
  };

  // Logic Ask AI
  const handleAskAi = async () => {
    if (!userQuestion.trim()) return;
    try {
      setIsAsking(true);
      const res = await API.post(`/learning/step/${selectedStepId}/ask-ai`, {
        question: userQuestion
      });
      setAiAnswer(res.data.answer);
      Keyboard.dismiss();
    } catch (err) {
      Alert.alert("Error", "Gagal menghubungi Mentor AI");
    } finally {
      setIsAsking(false);
    }
  };

  if (loading) return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#2563eb" />
      <Text className="mt-4 text-slate-500 font-medium italic">Menyusun materi dengan AI...</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      {/* HEADER */}
      <View className="pt-14 px-6 pb-4 bg-white flex-row items-center border-b border-slate-100 shadow-sm">
        <TouchableOpacity onPress={() => router.back()} className="bg-slate-100 p-2 rounded-xl mr-4">
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-black text-slate-800" numberOfLines={1}>{skillName}</Text>
          <Text className="text-[10px] text-blue-600 font-bold tracking-[2px] uppercase">Learning Journey</Text>
        </View>
      </View>

      {/* PROGRESS BAR */}
      <View className="bg-white px-6 py-4 border-b border-slate-100">
        <View className="flex-row justify-between mb-2">
          <Text className="text-xs text-slate-400 font-bold">{completedCount}/{steps.length} Materi Selesai</Text>
          <Text className="text-xs text-blue-600 font-black">{Math.round(progressPercent)}%</Text>
        </View>
        <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <View style={{ width: `${progressPercent}%` }} className="h-full bg-blue-600 rounded-full" />
        </View>
      </View>

      <ScrollView className="p-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {steps.map((step, index) => (
          <View key={step.id || index} className="flex-row mb-6 relative">
            {index !== steps.length - 1 && <View className="absolute left-[17px] top-10 bottom-[-30px] w-[2px] bg-slate-200" />}

            <View className={`w-9 h-9 rounded-full items-center justify-center border-4 border-slate-50 z-10 shadow-sm ${step.is_completed ? 'bg-green-500' : 'bg-white border-blue-100'}`}>
              {step.is_completed ? (
                <Ionicons name="checkmark" size={16} color="white" />
              ) : (
                <Text className="text-blue-600 text-[10px] font-black">{step.step_number}</Text>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              className={`flex-1 ml-4 p-5 rounded-[25px] bg-white shadow-sm border-2 ${expandedStep === step.id ? 'border-blue-500' : 'border-transparent'}`}
            >
              <View className="flex-row justify-between items-center">
                <Text className={`text-sm font-bold flex-1 ${step.is_completed ? 'text-green-700' : 'text-slate-800'}`}>{step.title}</Text>
                <Ionicons name={expandedStep === step.id ? "chevron-up" : "chevron-down"} size={16} color="#94a3b8" />
              </View>

              {expandedStep === step.id && (
                <View className="mt-4 pt-4 border-t border-slate-50">
                  <Text className="text-xs text-slate-600 leading-6 mb-4 italic">{step.content}</Text>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedStepId(step.id);
                      setAiAnswer("");
                      setUserQuestion("");
                      setAskAiVisible(true);
                    }}
                    className="bg-blue-50 flex-row items-center justify-center py-2.5 rounded-xl mb-3"
                  >
                    <Ionicons name="chatbubble-ellipses" size={14} color="#2563eb" />
                    <Text className="text-[10px] font-bold text-blue-600 ml-2">Tanya Mentor AI</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={quizLoading}
                    onPress={() => step.is_completed ? toggleComplete(step.id) : startQuiz(step.id)}
                    className={`py-3.5 rounded-2xl flex-row justify-center items-center shadow-lg ${step.is_completed ? 'bg-green-500 shadow-green-200' : 'bg-blue-600 shadow-blue-200'}`}
                  >
                    {quizLoading && selectedStepId === step.id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name={step.is_completed ? "checkmark-circle" : "trophy-outline"} size={18} color="white" />
                        <Text className="text-white font-black text-xs ml-2">
                          {step.is_completed ? "Lulus Materi" : "Ambil Kuis AI"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}
        <View className="h-10" />
      </ScrollView>

      {/* MODAL QUIZ */}
      <Modal visible={quizVisible} animationType="fade" transparent={true} onRequestClose={() => setQuizVisible(false)}>
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white w-full p-8 rounded-[40px] shadow-2xl">
            <Text className="text-blue-600 font-black mb-2 text-[10px] uppercase tracking-widest text-center">🧠 Challenge Time</Text>
            <Text className="text-lg font-bold text-slate-800 text-center mb-8">{currentQuiz?.question}</Text>
            {currentQuiz?.options.map((opt: string, idx: number) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleQuizAnswer(idx)}
                className="bg-slate-50 p-5 rounded-2xl mb-3 border border-slate-100 active:bg-blue-600"
              >
                <Text className="text-slate-700 font-bold text-center text-xs">{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setQuizVisible(false)} className="mt-4">
              <Text className="text-center text-slate-400 font-bold text-xs">Nanti Saja</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ASK AI (FIXED) */}
      <Modal
        visible={askAiVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAskAiVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-end bg-black/50">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="bg-white rounded-t-[40px] p-8 h-[80%]"
            >
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-xl font-black text-slate-800">Mentor AI 🤖</Text>
                  <Text className="text-xs text-slate-400">Tanyakan apapun tentang materi ini</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAskAiVisible(false)}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Ionicons name="close-circle" size={32} color="#f1f5f9" />
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 mb-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {aiAnswer ? (
                  <View className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
                    <Text className="text-slate-700 leading-6 font-medium">{aiAnswer}</Text>
                  </View>
                ) : (
                  <View className="items-center mt-20">
                    <Ionicons name="bulb-outline" size={60} color="#e2e8f0" />
                    <Text className="text-slate-400 text-center mt-4 font-medium">
                      Ketik bagian yang kamu bingung,{"\n"}AI akan menjelaskan lebih simpel.
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View className="flex-row items-center bg-slate-50 p-3 rounded-[25px] border border-slate-100 mb-8">
                <TextInput
                  className="flex-1 px-4 py-2 text-slate-700 font-medium min-h-[40px]"
                  placeholder="Tanya mentor..."
                  placeholderTextColor="#94a3b8"
                  value={userQuestion}
                  onChangeText={setUserQuestion}
                  multiline={true}
                />
                <TouchableOpacity
                  onPress={handleAskAi}
                  disabled={isAsking}
                  className={`w-12 h-12 rounded-2xl items-center justify-center ${isAsking ? 'bg-slate-200' : 'bg-blue-600'}`}
                >
                  {isAsking ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="paper-plane" size={20} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}