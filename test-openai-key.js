// Test script to verify OpenAI API key
// Run this to check if your key is working

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

async function testOpenAIKey() {
  console.log('Testing OpenAI API Key configuration...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you respond with just "OK" if you receive this?',
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Success! Edge function is responding.');
    console.log('\nResponse:', data.response);

    if (data.response.includes('OPENAI_API_KEY not configured') ||
        data.response.includes('PROCESSING:') ||
        data.response.includes('Use natural language')) {
      console.log('\n⚠️  OpenAI API Key NOT configured - using fallback responses');
      console.log('\nTo fix this:');
      console.log('1. Go to Supabase Dashboard');
      console.log('2. Select your project');
      console.log('3. Go to Edge Functions → Manage Secrets');
      console.log('4. Add: OPENAI_API_KEY = sk-proj-xxxxx');
      console.log('5. Redeploy the chat function');
    } else if (data.response.toLowerCase().includes('ok') ||
               data.response.length < 100) {
      console.log('\n✅ OpenAI API Key is CONFIGURED and WORKING!');
      console.log('✅ Your AI chat is using real OpenAI responses.');
    } else {
      console.log('\n✅ OpenAI API Key appears to be configured.');
      console.log('(Got a detailed AI response)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. Your Supabase URL and Anon Key are correct in .env');
    console.log('2. The chat edge function is deployed');
    console.log('3. You have internet connectivity');
  }
}

testOpenAIKey();
