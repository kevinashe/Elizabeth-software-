import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchRequest {
  query: string;
  maxResults?: number;
  category?: string;
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

    const { query, maxResults = 5, category }: SearchRequest = await req.json();

    const { data: cachedResults, error: cacheError } = await supabase
      .from("web_search_cache")
      .select("*")
      .eq("query", query)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cachedResults && !cacheError) {
      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          results: cachedResults.results,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const searchResults = await performWebSearch(query, maxResults);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await supabase
      .from("web_search_cache")
      .insert({
        query,
        results: searchResults,
        expires_at: expiresAt.toISOString(),
      });

    if (category) {
      await supabase
        .from("knowledge_base")
        .insert({
          category,
          title: query,
          content: JSON.stringify(searchResults),
          tags: [category, "web-search"],
          relevance_score: 0.8,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        cached: false,
        results: searchResults,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error performing web search:", error);
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

async function performWebSearch(query: string, maxResults: number) {
  const results = [
    {
      title: `Latest documentation for: ${query}`,
      url: `https://example.com/docs/${encodeURIComponent(query)}`,
      snippet: `This is a simulated search result for ${query}. In production, integrate with real search APIs like Google Custom Search, Bing, or specialized tech documentation search.`,
      relevance: 0.95,
    },
    {
      title: `Best practices: ${query}`,
      url: `https://example.com/best-practices/${encodeURIComponent(query)}`,
      snippet: `Industry best practices and patterns related to ${query}.`,
      relevance: 0.85,
    },
    {
      title: `Tutorial: Getting started with ${query}`,
      url: `https://example.com/tutorial/${encodeURIComponent(query)}`,
      snippet: `Step-by-step guide for implementing ${query} in your projects.`,
      relevance: 0.80,
    },
  ].slice(0, maxResults);

  return results;
}
