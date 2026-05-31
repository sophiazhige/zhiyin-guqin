import { createContext, useContext, useState } from "react";
import type { Track } from "./store";

export interface IntakeData {
  symptoms: string[];
  emotion: string;      // 后端格式的情绪标签
  intensity: number;
  freeText: string;
}

export interface DiagnosisResult {
  element: string;      // wood/fire/earth/metal/water
  syndrome: string;     // 主证型，如"失眠多梦"
  principle: string;    // 调理原则
  tracks: Track[];      // 推荐3首
  courseTracks: Track[];// 疗程7首（从推荐列表扩展）
}

interface IntakeContextType {
  intake: IntakeData;
  setSymptoms: (v: string[]) => void;
  setEmotion: (v: string) => void;
  setIntensity: (v: number) => void;
  setFreeText: (v: string) => void;
  diagnosis: DiagnosisResult | null;
  setDiagnosis: (v: DiagnosisResult) => void;
}

const IntakeContext = createContext<IntakeContextType>({
  intake: { symptoms: [], emotion: "", intensity: 5, freeText: "" },
  setSymptoms: () => {},
  setEmotion: () => {},
  setIntensity: () => {},
  setFreeText: () => {},
  diagnosis: null,
  setDiagnosis: () => {},
});

export function IntakeProvider({ children }: { children: React.ReactNode }) {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [emotion, setEmotion] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [freeText, setFreeText] = useState("");
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  return (
    <IntakeContext.Provider value={{
      intake: { symptoms, emotion, intensity, freeText },
      setSymptoms, setEmotion, setIntensity, setFreeText,
      diagnosis, setDiagnosis,
    }}>
      {children}
    </IntakeContext.Provider>
  );
}

export function useIntake() {
  return useContext(IntakeContext);
}

// 前端情绪标签 → 后端期望标签
export const EMOTION_BACKEND_MAP: Record<string, string> = {
  "烦躁易怒": "烦躁",
  "心慌不安": "惶恐不安",
  "思虑不止": "思绪放不下",
  "悲伤低落": "低落",
  "恐惧空虚": "惶恐不安",
  "平和安宁": "还算平和",
};
