const SUPABASE_URL = 'https://srrgniyqyuiqheqdefop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNycmduaXlxeXVpcWhlcWRlZm9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTY2MzcsImV4cCI6MjA3ODM5MjYzN30.387glgltQUpUTBgdeqziEv0LVnDxw1NrkQlqq6T5OHs';

async function test() {
  console.log('🔍 Testing OpenAI API Key configuration...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Say only OK',
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      console.error('❌ Error Response:', response.status, await response.text());
      return;
    }

    const data = await response.json();
    console.log('✅ Edge function is responding!\n');
    console.log('Response preview:', data.response.substring(0, 200));

    if (data.response.includes('PROCESSING:') || data.response.includes('Use natural language')) {
      console.log('\n⚠️  OpenAI API Key is NOT configured - using fallback responses\n');
      console.log('📋 How to add your OpenAI API key:');
      console.log('1. Go to: https://supabase.com/dashboard/project/srrgniyqyuiqheqdefop/settings/functions');
      console.log('2. Click "Add new secret" or "Manage secrets"');
      console.log('3. Name: OPENAI_API_KEY');
      console.log('4. Value: Your OpenAI key (starts with sk-proj- or sk-)');
      console.log('5. Save and wait 30 seconds for deployment\n');
      console.log('Get your key from: https://platform.openai.com/api-keys');
    } else {
      console.log('\n✅ SUCCESS! OpenAI API Key is configured and working!');
      console.log('✅ Your AI chat is using real OpenAI GPT-4 responses.\n');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nCheck:');
    console.log('- Internet connection');
    console.log('- Edge function is deployed');
  }
}

test();
