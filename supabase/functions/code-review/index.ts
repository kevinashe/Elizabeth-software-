import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CodeReviewRequest {
  code: string;
  language: string;
  context?: string;
}

interface SecurityIssue {
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  line?: number;
  description: string;
  suggestion: string;
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

    const { code, language, context }: CodeReviewRequest = await req.json();

    const securityIssues = performSecurityScan(code, language);
    const codeQuality = analyzeCodeQuality(code, language);
    const bestPractices = checkBestPractices(code, language);

    let aiReview = null;
    if (openaiKey) {
      try {
        aiReview = await getAIReview(code, language, context, openaiKey);
      } catch (aiError) {
        console.error("AI review failed:", aiError);
      }
    }

    const review = {
      security: {
        issues: securityIssues,
        score: calculateSecurityScore(securityIssues),
      },
      quality: codeQuality,
      bestPractices,
      aiReview,
      summary: generateSummary(securityIssues, codeQuality, bestPractices),
    };

    return new Response(
      JSON.stringify({
        success: true,
        review,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error performing code review:", error);
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

function performSecurityScan(code: string, language: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  if (code.includes("eval(") || code.includes("Function(")) {
    issues.push({
      severity: "critical",
      type: "Code Injection",
      description: "Use of eval() or Function() constructor detected",
      suggestion: "Avoid using eval() and Function() constructor. Use safer alternatives.",
    });
  }

  if (code.match(/password|secret|key|token/i) && code.includes("=")) {
    issues.push({
      severity: "high",
      type: "Hardcoded Credentials",
      description: "Possible hardcoded credentials detected",
      suggestion: "Use environment variables or secure vaults for sensitive data.",
    });
  }

  if (code.includes("innerHTML") || code.includes("dangerouslySetInnerHTML")) {
    issues.push({
      severity: "medium",
      type: "XSS Vulnerability",
      description: "Direct HTML injection detected",
      suggestion: "Sanitize user input or use textContent instead of innerHTML.",
    });
  }

  if (language === "javascript" || language === "typescript") {
    if (code.match(/fetch\([^)]*\)/g) && !code.includes("try")) {
      issues.push({
        severity: "low",
        type: "Error Handling",
        description: "Network request without error handling",
        suggestion: "Wrap fetch calls in try-catch blocks.",
      });
    }
  }

  return issues;
}

function analyzeCodeQuality(code: string, language: string) {
  const lines = code.split("\n");
  const complexity = calculateComplexity(code);

  return {
    linesOfCode: lines.length,
    complexity,
    maintainability: complexity < 10 ? "good" : complexity < 20 ? "moderate" : "poor",
    suggestions: [
      complexity > 20 ? "Consider breaking down complex functions" : null,
      lines.length > 300 ? "File is too long, consider splitting" : null,
    ].filter(Boolean),
  };
}

function calculateComplexity(code: string): number {
  let complexity = 1;
  const complexityKeywords = ["if", "else", "for", "while", "case", "catch", "&&", "||"];

  for (const keyword of complexityKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "g");
    const matches = code.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  }

  return complexity;
}

function checkBestPractices(code: string, language: string) {
  const issues = [];

  if (!code.includes("const") && !code.includes("let")) {
    issues.push("Consider using const/let instead of var");
  }

  if (code.match(/console\.log/g)) {
    issues.push("Remove console.log statements before production");
  }

  if (!code.match(/\/\/|\/\*|\*/)) {
    issues.push("Add comments to explain complex logic");
  }

  return {
    issues,
    score: Math.max(0, 100 - (issues.length * 10)),
  };
}

function calculateSecurityScore(issues: SecurityIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    switch (issue.severity) {
      case "critical":
        score -= 30;
        break;
      case "high":
        score -= 20;
        break;
      case "medium":
        score -= 10;
        break;
      case "low":
        score -= 5;
        break;
    }
  }
  return Math.max(0, score);
}

function generateSummary(securityIssues: SecurityIssue[], quality: any, bestPractices: any) {
  const criticalCount = securityIssues.filter(i => i.severity === "critical").length;
  const overallScore = Math.round(
    (calculateSecurityScore(securityIssues) + bestPractices.score) / 2
  );

  return {
    overallScore,
    criticalIssues: criticalCount,
    recommendation: overallScore >= 80
      ? "Code looks good with minor improvements needed"
      : overallScore >= 60
      ? "Several issues need attention"
      : "Significant improvements required",
  };
}

async function getAIReview(code: string, language: string, context: string | undefined, apiKey: string) {
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
            content: "You are an expert code reviewer. Provide constructive feedback on code quality, security, and best practices.",
          },
          {
            role: "user",
            content: `Review this ${language} code${context ? ` (Context: ${context})` : ""}:\n\n${code}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("AI review error:", error);
    return null;
  }
}
