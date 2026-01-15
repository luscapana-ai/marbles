import { GoogleGenAI, Type } from "@google/genai";

// Standard client for general tasks (using process.env.API_KEY)
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Encyclopedia: Search Grounding ---
export const searchMarbles = async (query: string) => {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a knowledgeable marble enthusiast and historian. Provide accurate information about marbles, their history, manufacturing, and gameplay. Format your response in Markdown.",
      },
    });

    const text = response.text || "No information found.";
    // Extract sources if available
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map((chunk: any) => chunk.web)
      .filter((web: any) => web)
      .map((web: any) => ({ title: web.title, uri: web.uri }));

    return { text, sources };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

// --- Analyzer: Image Understanding ---
export const analyzeMarbleImage = async (base64Image: string, promptText: string) => {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: promptText }
        ]
      },
      config: {
        systemInstruction: "You are an expert appraiser of marbles. Analyze the image to determine the type, likely era, manufacturer (e.g., Akro Agate, Christensen, etc.), and condition. Estimate a price range if possible.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Analysis error:", error);
    throw error;
  }
};

// --- Marketplace: Sell Description Helper ---
export const generateListingDescription = async (base64Image: string) => {
   try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
           {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: "Write a catchy, short sales description for this marble to be listed on a marketplace. Include a suggested name." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedPrice: { type: Type.NUMBER }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Listing helper error:", error);
    return { name: "Unknown Marble", description: "A beautiful marble.", suggestedPrice: 5 };
  }
};

// --- Studio: Marble Design ---
export const generateMarbleDesign = async (prompt: string, size: '1K' | '2K' | '4K') => {
  // Create a new instance to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Design generation error:", error);
    throw error;
  }
};

// --- Marketplace: Video Generation (Veo) ---
export const generateMarketingVideo = async (base64Image: string) => {
  // Create a new instance to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      image: {
        imageBytes: base64Image,
        mimeType: 'image/jpeg',
      },
      prompt: "A cinematic, slow-motion close-up 360 degree orbit view of this marble, photorealistic, highly detailed, professional lighting.",
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");

    // Fetch the actual video bytes using the key
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
    
  } catch (error) {
    console.error("Video generation error:", error);
    throw error;
  }
};