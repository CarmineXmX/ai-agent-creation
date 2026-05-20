import { NextRequest, NextResponse } from "next/server";
import { generateSystemPrompt, chatWithAgent, ChatMessage } from "@/lib/agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, description, systemPrompt, history, message, model } = body;

    // ACTION: "create" → genera il system prompt dalla descrizione
    if (action === "create") {
      if (!description) {
        return NextResponse.json({ error: "Descrizione mancante" }, { status: 400 });
      }

      console.log("🔧 Creando agent per:", description);

      const generatedSystemPrompt = await generateSystemPrompt(
        description,
        model || "llama3"
      );

      return NextResponse.json({
        success: true,
        systemPrompt: generatedSystemPrompt,
        description,
        model: model || "llama3",
      });
    }

    // ACTION: "chat" → invia messaggio all'agent già creato
    if (action === "chat") {
      if (!systemPrompt || !message) {
        return NextResponse.json(
          { error: "systemPrompt e message sono richiesti" },
          { status: 400 }
        );
      }

      console.log("💬 Chat con agent:", message);

      const response = await chatWithAgent(
        { systemPrompt, model: model || "llama3", description: description || "" },
        (history as ChatMessage[]) || [],
        message
      );

      return NextResponse.json({ success: true, response });
    }

    return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
  } catch (error) {
    console.error("Errore API agent:", error);
    return NextResponse.json(
      { error: "Errore interno del server", details: String(error) },
      { status: 500 }
    );
  }
}
