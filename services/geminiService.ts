
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMedicalInsights = async (patientData: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a brief clinical summary and suggested follow-up questions for this patient history: ${patientData}`,
      config: {
        systemInstruction: "You are a senior medical consultant assistant. Be concise, professional, and highlight critical concerns.",
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Could not generate insights at this time.";
  }
};

export const suggestSchedule = async (existingAppointments: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on these scheduled appointments: ${existingAppointments}, suggest 3 optimal slots for tomorrow morning starting from 9 AM.`,
      config: {
        systemInstruction: "You are an expert clinic coordinator.",
      },
    });
    return response.text;
  } catch (error) {
    return "Scheduling assistant unavailable.";
  }
};
