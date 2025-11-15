import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface DiagramRequest {
  description: string;
  diagramType: "architecture" | "flowchart" | "sequence" | "class";
  style?: string;
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

    const { description, diagramType, style }: DiagramRequest = await req.json();

    let diagramMarkdown = "";

    switch (diagramType) {
      case "architecture":
        diagramMarkdown = generateArchitectureDiagram(description);
        break;
      case "flowchart":
        diagramMarkdown = generateFlowchart(description);
        break;
      case "sequence":
        diagramMarkdown = generateSequenceDiagram(description);
        break;
      case "class":
        diagramMarkdown = generateClassDiagram(description);
        break;
      default:
        diagramMarkdown = generateArchitectureDiagram(description);
    }

    if (openaiKey) {
      try {
        const enhancedDiagram = await enhanceWithAI(description, diagramType, openaiKey);
        if (enhancedDiagram) {
          diagramMarkdown = enhancedDiagram;
        }
      } catch (aiError) {
        console.error("AI enhancement failed, using fallback:", aiError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        diagram: diagramMarkdown,
        type: diagramType,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating diagram:", error);
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

function generateArchitectureDiagram(description: string): string {
  return `graph TB
    A[Client] -->|API Requests| B[Load Balancer]
    B --> C[API Server 1]
    B --> D[API Server 2]
    C --> E[Database]
    D --> E
    C --> F[Cache]
    D --> F
    E --> G[Storage]

    style A fill:#e1f5ff
    style B fill:#fff3cd
    style C fill:#d4edda
    style D fill:#d4edda
    style E fill:#f8d7da
    style F fill:#d1ecf1
    style G fill:#e2e3e5`;
}

function generateFlowchart(description: string): string {
  return `graph TD
    Start([Start]) --> Input[/User Input/]
    Input --> Process[Process Data]
    Process --> Decision{Valid?}
    Decision -->|Yes| Success[Success Response]
    Decision -->|No| Error[Error Handler]
    Error --> Retry{Retry?}
    Retry -->|Yes| Input
    Retry -->|No| End([End])
    Success --> End

    style Start fill:#d4edda
    style End fill:#f8d7da
    style Decision fill:#fff3cd
    style Success fill:#d4edda
    style Error fill:#f8d7da`;
}

function generateSequenceDiagram(description: string): string {
  return `sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database

    User->>Frontend: Action
    Frontend->>API: Request
    API->>Database: Query
    Database-->>API: Data
    API-->>Frontend: Response
    Frontend-->>User: Display Result`;
}

function generateClassDiagram(description: string): string {
  return `classDiagram
    class User {
        +String id
        +String email
        +String name
        +login()
        +logout()
    }

    class Project {
        +String id
        +String name
        +Date createdAt
        +create()
        +update()
        +delete()
    }

    class Task {
        +String id
        +String title
        +String status
        +complete()
    }

    User "1" --> "*" Project
    Project "1" --> "*" Task`;
}

async function enhanceWithAI(description: string, diagramType: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert at creating Mermaid diagram syntax. Generate a detailed ${diagramType} diagram based on the user's description.`,
          },
          {
            role: "user",
            content: `Create a ${diagramType} diagram for: ${description}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("AI enhancement error:", error);
    return null;
  }
}
