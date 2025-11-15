#!/usr/bin/env node

const http = require('http');

const createRequirement = (data) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      type: 'requirement.create',
      payload: data,
      source: 'test-client',
      user: {
        id: 'test-user-123',
        email: 'test@example.com'
      }
    });

    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
};

const examples = [
  {
    title: 'Build authentication system',
    description: 'Implement user authentication with JWT tokens and refresh tokens',
    tags: ['auth', 'security', 'backend']
  },
  {
    title: 'Create dashboard UI',
    description: 'Build responsive dashboard with charts and analytics',
    tags: ['frontend', 'ui', 'urgent']
  },
  {
    title: 'Setup CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    tags: ['devops', 'automation']
  },
  {
    title: 'Database migration system',
    description: 'Implement versioned database migrations with rollback support',
    tags: ['database', 'backend', 'urgent']
  },
  {
    title: 'API rate limiting',
    description: 'Add rate limiting middleware to protect API endpoints',
    tags: ['api', 'security']
  }
];

(async () => {
  console.log('\n🧪 Testing SD Platform Event-Driven SDK\n');
  console.log('═'.repeat(60));

  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    console.log(`\n📝 Creating requirement ${i + 1}/${examples.length}`);
    console.log(`   Title: ${example.title}`);
    console.log(`   Tags: ${example.tags.join(', ')}`);

    try {
      const response = await createRequirement(example);

      if (response.success) {
        console.log(`   ✅ Created: ${response.data.id}`);
      } else {
        console.log(`   ❌ Failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n═'.repeat(60));
  console.log('\n✨ Test complete! Check the server logs for event processing details.\n');
})();
