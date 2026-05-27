import { execSync } from 'child_process';

const today = new Date().toISOString().split('T')[0];

console.log(`🚀 Starting local push for today: ${today}`);

try {
  // Morning Video (Schedule for 9 AM IST / 03:30 UTC)
  console.log('🌅 Pushing Morning Video (Scheduled for 9 AM IST)...');
  execSync(`node automate.mjs --slot=morning --schedule="${today}T03:30:00Z"`, { stdio: 'inherit' });

  // Afternoon Video (Schedule for 2 PM IST / 08:30 UTC)
  console.log('☀️ Pushing Afternoon Video (Scheduled for 2 PM IST)...');
  execSync(`node automate.mjs --slot=afternoon --schedule="${today}T08:30:00Z"`, { stdio: 'inherit' });

  // Evening Video (Schedule for 7 PM IST / 13:30 UTC)
  console.log('🌆 Pushing Evening Video (Scheduled for 7 PM IST)...');
  execSync(`node automate.mjs --slot=evening --schedule="${today}T13:30:00Z"`, { stdio: 'inherit' });

  console.log('✅ All videos for today have been processed successfully!');
} catch (error) {
  console.error('❌ Error pushing videos locally:', error.message);
  process.exit(1);
}
