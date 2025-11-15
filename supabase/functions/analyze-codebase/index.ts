import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeRequest {
  projectId: string;
  files: Array<{
    path: string;
    content: string;
    type: string;
  }>;
}

interface FileAnalysis {
  summary: string;
  symbols: {
    functions: string[];
    classes: string[];
    exports: string[];
  };
  dependencies: string[];
  complexity: number;
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

    const { projectId, files }: AnalyzeRequest = await req.json();

    const analysisResults = [];

    for (const file of files) {
      const analysis = analyzeFile(file.content, file.type);
      const contentHash = await hashContent(file.content);

      const { error: upsertError } = await supabase
        .from("codebase_index")
        .upsert({
          project_id: projectId,
          file_path: file.path,
          file_type: file.type,
          content_hash: contentHash,
          summary: analysis.summary,
          symbols: analysis.symbols,
          dependencies: analysis.dependencies,
          last_indexed: new Date().toISOString(),
        }, {
          onConflict: "project_id,file_path",
        });

      if (upsertError) {
        console.error("Error upserting codebase index:", upsertError);
      }

      analysisResults.push({
        path: file.path,
        analysis,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        analyzed: analysisResults.length,
        results: analysisResults,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error analyzing codebase:", error);
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

function analyzeFile(content: string, fileType: string): FileAnalysis {
  const analysis: FileAnalysis = {
    summary: "",
    symbols: {
      functions: [],
      classes: [],
      exports: [],
    },
    dependencies: [],
    complexity: 0,
  };

  const functionRegex = /(?:function|const|let|var)\s+(\w+)\s*(?:=\s*)?(?:\([^)]*\)|=>)/g;
  const classRegex = /class\s+(\w+)/g;
  const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*(\w+)/g;
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;

  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    analysis.symbols.functions.push(match[1]);
  }

  while ((match = classRegex.exec(content)) !== null) {
    analysis.symbols.classes.push(match[1]);
  }

  while ((match = exportRegex.exec(content)) !== null) {
    analysis.symbols.exports.push(match[1]);
  }

  while ((match = importRegex.exec(content)) !== null) {
    analysis.dependencies.push(match[1]);
  }

  const lines = content.split("\n");
  analysis.complexity = lines.length;

  const functionCount = analysis.symbols.functions.length;
  const classCount = analysis.symbols.classes.length;

  if (functionCount > 0 || classCount > 0) {
    analysis.summary = `Contains ${functionCount} functions and ${classCount} classes. `;
  }

  if (analysis.dependencies.length > 0) {
    analysis.summary += `Imports from ${analysis.dependencies.length} modules.`;
  }

  return analysis;
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
