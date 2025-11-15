import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatRequest {
  message: string;
  timestamp: string;
  userId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface ChatResponse {
  response: string;
  code?: string;
  files?: string[];
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

async function callOpenAI(message: string, assistantName: string, history: Array<{ role: string; content: string }> = []): Promise<ChatResponse> {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return generateBuiltInResponse(message);
  }

  try {
    const systemPrompt = `You are ${assistantName}, an expert AI coding assistant integrated into Elizabeth platform. Your role is to:
1. Generate high-quality, production-ready code
2. Provide clear explanations in a tactical, command-style format
3. Return responses with code snippets when appropriate
4. Support multiple languages and frameworks

When generating code:
- Use modern best practices
- Include proper error handling
- Add TypeScript types when applicable
- Make it production-ready

Format your responses as:
>> STATUS MESSAGE
>> Technical details
>> Implementation notes

If you generate code, structure your response to include both the explanation and code.

When greeted or asked about your name, introduce yourself as ${assistantName} and acknowledge being part of the Elizabeth platform.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return generateBuiltInResponse(message);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;

    while ((match = codeBlockRegex.exec(aiResponse)) !== null) {
      codeBlocks.push(match[1].trim());
    }

    const cleanResponse = aiResponse.replace(/```[\w]*\n[\s\S]*?```/g, '').trim();

    if (codeBlocks.length > 0) {
      return {
        response: cleanResponse || ">> CODE GENERATED SUCCESSFULLY\n>> Review the code below",
        code: codeBlocks[0],
        files: detectFileNames(message, codeBlocks[0])
      };
    }

    return {
      response: aiResponse
    };

  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    return generateBuiltInResponse(message);
  }
}

function detectFileNames(message: string, code: string): string[] {
  const msg = message.toLowerCase();

  if (msg.includes('react') || msg.includes('component') || code.includes('React')) {
    if (code.includes('TypeScript') || code.includes('interface') || code.includes(': React.FC')) {
      return ['src/components/Component.tsx'];
    }
    return ['src/components/Component.jsx'];
  }

  if (msg.includes('api') || msg.includes('server') || msg.includes('express')) {
    return ['src/server.ts'];
  }

  if (msg.includes('kubernetes') || msg.includes('k8s')) {
    return ['k8s/deployment.yaml'];
  }

  if (msg.includes('test')) {
    return ['src/test.spec.ts'];
  }

  if (code.includes('export function') || code.includes('export const')) {
    return ['src/utils/helpers.ts'];
  }

  return ['src/index.ts'];
}

function generateBuiltInResponse(message: string): ChatResponse {
  const msg = message.toLowerCase().trim();

  if (msg.includes('shopping') || msg.includes('shop') || msg.includes('ecommerce') || msg.includes('e-commerce')) {
    return {
      response: ">> SHOPPING WEBSITE DEPLOYMENT INITIATED\n>> Frontend: React + TypeScript\n>> Features: Product catalog, cart, checkout\n>> Database: Supabase\n>> Payment: Stripe integration ready",
      code: `import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';

export default function ShoppingApp() {
  const [cart, setCart] = useState([]);
  const [products] = useState([
    { id: 1, name: 'Premium Headphones', price: 299.99, image: 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?w=400' },
    { id: 2, name: 'Wireless Mouse', price: 49.99, image: 'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?w=400' },
    { id: 3, name: 'Mechanical Keyboard', price: 149.99, image: 'https://images.pexels.com/photos/1194713/pexels-photo-1194713.jpeg?w=400' },
    { id: 4, name: 'USB-C Cable', price: 19.99, image: 'https://images.pexels.com/photos/4195325/pexels-photo-4195325.jpeg?w=400' },
    { id: 5, name: 'Laptop Stand', price: 79.99, image: 'https://images.pexels.com/photos/4065876/pexels-photo-4065876.jpeg?w=400' },
    { id: 6, name: 'Webcam HD', price: 89.99, image: 'https://images.pexels.com/photos/4219861/pexels-photo-4219861.jpeg?w=400' },
  ]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>TechStore</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#2563eb', color: 'white', borderRadius: '8px' }}>
              <ShoppingCart size={20} />
              <span style={{ fontWeight: '600' }}>{cart.length} items</span>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {products.map(product => (
            <div key={product.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <img src={product.image} alt={product.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>{product.name}</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2563eb', marginBottom: '16px' }}>\${product.price}</p>
                <button onClick={() => addToCart(product)} style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '24px', color: '#1f2937' }}>Shopping Cart</h2>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #e5e7eb' }}>
                <div>
                  <h4 style={{ fontWeight: '600', color: '#1f2937' }}>{item.name}</h4>
                  <p style={{ color: '#6b7280' }}>\${item.price}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '6px', background: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      <Minus size={16} />
                    </button>
                    <span style={{ fontWeight: '600', minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '6px', background: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ padding: '8px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>Total:</span>
                <span style={{ fontSize: '2rem', fontWeight: '700', color: '#2563eb' }}>\${total.toFixed(2)}</span>
              </div>
              <button style={{ width: '100%', padding: '16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.125rem', fontWeight: '600', cursor: 'pointer' }}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`,
      files: ['src/ShoppingApp.jsx']
    };
  }

  if (msg.includes('help') || msg.includes('commands')) {
    return {
      response: ">> TACTICAL COMMAND INTERFACE - AVAILABLE OPERATIONS:\n>> AI-powered code generation with OpenAI GPT-4\n>> Ask for any code, component, or architecture\n>> Examples:\n>>  - Create a shopping website\n>>  - Build a REST API with authentication\n>>  - Generate React dashboard\n>>  - Write TypeScript types\n>>  - Create Kubernetes manifests"
    };
  }

  return {
    response: `>> PROCESSING: ${message}\n>> Use natural language to describe what you want to build\n>> The AI will generate production-ready code for you`
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, timestamp, userId, conversationHistory }: ChatRequest = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let assistantName = 'Elizabeth';

    if (userId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (supabaseUrl && supabaseKey) {
          const response = await fetch(`${supabaseUrl}/rest/v1/user_settings?user_id=eq.${userId}&select=ai_assistant_name`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data && data[0]?.ai_assistant_name) {
              assistantName = data[0].ai_assistant_name;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching AI assistant name:', error);
      }
    }

    const response = await callOpenAI(message, assistantName, conversationHistory || []);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing chat:", error);
    return new Response(
      JSON.stringify({
        response: ">> SYSTEM ERROR\n>> " + error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});