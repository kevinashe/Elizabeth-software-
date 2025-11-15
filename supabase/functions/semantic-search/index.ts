import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SemanticSearchRequest {
  query: string;
  searchType: "code" | "conversation" | "knowledge";
  projectId?: string;
  limit?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { query, searchType, projectId, limit = 10 }: SemanticSearchRequest = await req.json();

    let embedding;
    if (openaiKey) {
      embedding = await generateEmbedding(query, openaiKey);
    }

    let results;
    switch (searchType) {
      case "code":
        if (!projectId) {
          throw new Error("projectId required for code search");
        }
        results = await searchCodebase(supabase, projectId, query, embedding, limit);
        break;
      case "conversation":
        results = await searchConversations(supabase, user.id, query, embedding, limit);
        break;
      case "knowledge":
        results = await searchKnowledge(supabase, query, embedding, limit);
        break;
      default:
        throw new Error("Invalid search type");
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        count: results.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error performing semantic search:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-ada-002",
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
}

async function searchCodebase(
  supabase: any,
  projectId: string,
  query: string,
  embedding: number[] | undefined,
  limit: number
) {
  if (embedding && embedding.length > 0) {
    const { data, error } = await supabase.rpc("match_codebase", {
      query_embedding: embedding,
      match_project: projectId,
      match_count: limit,
    });

    if (!error && data) {
      return data;
    }
  }

  const { data, error } = await supabase
    .from("codebase_index")
    .select("*")
    .eq("project_id", projectId)
    .or(`file_path.ilike.%${query}%,summary.ilike.%${query}%`)
    .limit(limit);

  return data || [];
}

async function searchConversations(
  supabase: any,
  userId: string,
  query: string,
  embedding: number[] | undefined,
  limit: number
) {
  if (embedding && embedding.length > 0) {
    const { data, error } = await supabase.rpc("match_conversations", {
      query_embedding: embedding,
      match_user: userId,
      match_count: limit,
    });

    if (!error && data) {
      return data;
    }
  }

  const { data, error } = await supabase
    .from("conversation_memory")
    .select("*")
    .eq("user_id", userId)
    .ilike("message_content", `%${query}%`)
    .limit(limit)
    .order("created_at", { ascending: false });

  return data || [];
}

async function searchKnowledge(
  supabase: any,
  query: string,
  embedding: number[] | undefined,
  limit: number
) {
  if (embedding && embedding.length > 0) {
    const { data, error } = await supabase.rpc("match_knowledge", {
      query_embedding: embedding,
      match_count: limit,
    });

    if (!error && data) {
      return data;
    }
  }

  const { data, error } = await supabase
    .from("knowledge_base")
    .select("*")
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(limit)
    .order("relevance_score", { ascending: false });

  return data || [];
}
