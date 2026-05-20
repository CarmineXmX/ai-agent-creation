import { ChatOllama } from "@langchain/ollama";

// Factory: crea e restituisce un'istanza del modello Ollama
export function createOllamaModel(model: string = "llama3") {
  return new ChatOllama({
    baseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL ,
    model,
    temperature: 0.7,
  });
}
