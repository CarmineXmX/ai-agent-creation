import { createOllamaModel } from "./ollama";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Genera un system prompt strutturato a partire dalla descrizione dell'utente
// Usa l'LLM stesso per "programmare" il comportamento dell'agent
export async function generateSystemPrompt(
  description: string,
  model: string = "qwen3.5"
): Promise<string> {
  const llm = createOllamaModel(model);

  const response = await llm.invoke([
    new SystemMessage(
      `Sei un esperto nel creare system prompt per AI agent.
Il tuo compito è trasformare una descrizione dell'utente in un system prompt dettagliato e professionale.

Rispondi SOLO con il system prompt, senza spiegazioni aggiuntive.
Il system prompt deve:
- Definire chiaramente il ruolo dell'agent
- Specificare lo stile di risposta
- Indicare cosa l'agent sa fare e non sa fare
- Essere scritto in italiano se la descrizione è in italiano`
    ),
    new HumanMessage(`Crea un system prompt per questo agent: ${description}`),
  ]);

  return response.content as string;
}

export interface AgentConfig {
  systemPrompt: string;
  model: string;
  description: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Invia un messaggio all'agent e restituisce la risposta
// Mantiene la cronologia della conversazione per il contesto
export async function chatWithAgent(
  agentConfig: AgentConfig,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const llm = createOllamaModel(agentConfig.model);

  const messages = [
    new SystemMessage(agentConfig.systemPrompt),
    // Converti la history nel formato LangChain
    ...history.map((msg) =>
      msg.role === "user"
        ? new HumanMessage(msg.content)
        : new SystemMessage(msg.content)
    ),
    new HumanMessage(userMessage),
  ];

  const response = await llm.invoke(messages);
  return response.content as string;
}
