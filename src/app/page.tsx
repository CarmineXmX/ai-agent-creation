"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentConfig {
  systemPrompt: string;
  description: string;
  model: string;
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function createAgent() {
    if (!description.trim()) return;
    setIsLoading(true);
    setStatus("🔧 Sto creando il tuo agent personalizzato...");

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", description, model: "qwen3.5" }),
      });
      const data = await res.json();

      if (data.success) {
        setAgentConfig({ systemPrompt: data.systemPrompt, description: data.description, model: data.model });
        setMessages([]);
        setStatus("✅ Agent creato! Puoi iniziare a chattare.");
      } else {
        setStatus("❌ Errore: " + data.error);
      }
    } catch {
      setStatus("❌ Errore di connessione. Ollama è avviato?");
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !agentConfig || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          systemPrompt: agentConfig.systemPrompt,
          description: agentConfig.description,
          model: agentConfig.model,
          history: messages,
          message: userMessage,
        }),
      });
      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.success ? data.response : "Errore: " + data.error },
      ]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Errore di connessione." }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">

        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-400">🤖 AI Agent Builder</h1>
          <p className="text-gray-400 mt-2">Descrivi che tipo di agente vuoi e inizia a chattarci</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 space-y-3">
          <label className="text-sm font-medium text-gray-300">Descrivi il tuo agent</label>
          <textarea
            className="w-full bg-gray-800 text-white rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Es: Crea un agente che mi aiuta a pianificare viaggi economici in Europa"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium py-2 rounded-lg transition-colors"
            onClick={createAgent}
            disabled={isLoading || !description.trim()}
          >
            {isLoading && !agentConfig ? "⏳ Creando..." : "✨ Crea Agent"}
          </button>
          {status && <p className="text-sm text-gray-400">{status}</p>}
        </div>

        {agentConfig && (
          <div className="bg-gray-900 rounded-xl p-4 border border-blue-800">
            <p className="text-sm font-medium text-blue-400">🎯 Agent attivo: {agentConfig.description}</p>
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
                Mostra system prompt generato
              </summary>
              <pre className="mt-2 text-xs text-gray-400 whitespace-pre-wrap">{agentConfig.systemPrompt}</pre>
            </details>
          </div>
        )}

        {agentConfig && (
          <div className="bg-gray-900 rounded-xl flex flex-col" style={{ height: "400px" }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-gray-500 text-sm text-center mt-8">Inizia la conversazione con il tuo agent 👆</p>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-400 px-4 py-2 rounded-2xl text-sm">⏳ Sto pensando...</div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-800 flex gap-2">
              <input
                className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Scrivi un messaggio..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isLoading}
              />
              <button
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
              >
                Invia
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
