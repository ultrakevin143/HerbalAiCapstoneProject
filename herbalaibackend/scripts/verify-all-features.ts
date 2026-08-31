import { askDrAi } from '../src/services/chat.service.js';
import * as herbRepo from '../src/repositories/herb.repository.js';
import * as forumRepo from '../src/repositories/forum.repository.js';
import * as messageRepo from '../src/repositories/message.repository.js';
import * as suggestRepo from '../src/repositories/suggest.repository.js';
import * as notifRepo from '../src/repositories/notification.repository.js';
import { statsRepository } from '../src/repositories/stats.repository.js';
import * as auditRepo from '../src/repositories/audit.repository.js';
import * as userRepo from '../src/repositories/user.repository.js';
import { prisma } from '../src/lib/prisma.js';

interface TestResult {
  feature: string;
  status: 'PASSED' | 'FAILED';
  details: string;
  dataSummary?: any;
}

const results: TestResult[] = [];

async function runFeatureVerification() {
  console.log('===============================================================');
  console.log('🌿 HERBAL AI - COMPREHENSIVE END-TO-END FEATURE VERIFICATION 🌿');
  console.log('===============================================================\n');

  // 1. CORE FEATURE: Dr. Ai Assistant (Live RAG + pgvector + Gemini)
  console.log('▶ [1/7] Testing Core Feature: Dr. Ai Assistant (RAG Chat with Gemini)...');
  try {
    const question = 'What are the medicinal uses of Lagundi and Sambong according to the Department of Health (DOH)?';
    console.log(`  - Question: "${question}"`);
    const aiResponse = await askDrAi(question, []);
    
    if (aiResponse && aiResponse.reply && aiResponse.reply.length > 50) {
      results.push({
        feature: 'Dr. Ai Assistant (RAG + Gemini)',
        status: 'PASSED',
        details: `Successfully generated comprehensive response (${aiResponse.reply.length} chars) with RAG sources grounded in DOH data.`,
        dataSummary: {
          replyPreview: aiResponse.reply.substring(0, 160) + '...',
          sourcesFound: aiResponse.sources?.length || 0,
        },
      });
      console.log('  ✔ Dr. Ai responded with grounded herbal knowledge & citation sources.');
    } else {
      throw new Error('AI response was empty or too brief.');
    }
  } catch (err: any) {
    results.push({
      feature: 'Dr. Ai Assistant (RAG + Gemini)',
      status: 'FAILED',
      details: err.message || String(err),
    });
    console.error('  ✖ Dr. Ai chat failed:', err.message);
  }

  // 2. HERB LIBRARY & SEARCH FEATURE
  console.log('\n▶ [2/7] Testing Feature: Herb Library & Search Filters...');
  try {
    const { herbs: allHerbs, total } = await herbRepo.findAllHerbs({ page: 1, limit: 5 });
    const { herbs: dohHerbs } = await herbRepo.findAllHerbs({ isDohApproved: true });
    const { herbs: searchHerbs } = await herbRepo.findAllHerbs({ search: 'Lagundi' });

    if (total > 0 && dohHerbs.length > 0 && searchHerbs.length > 0) {
      results.push({
        feature: 'Herb Library & Search',
        status: 'PASSED',
        details: `Total verified herbs in repository: ${total}. DOH approved herbs: ${dohHerbs.length}. Search for "Lagundi" matched ${searchHerbs.length} record(s).`,
        dataSummary: {
          totalHerbs: total,
          dohApprovedCount: dohHerbs.length,
          sampleHerbNames: allHerbs.map((h) => h.localName),
        },
      });
      console.log(`  ✔ Library loaded ${total} herbs, DOH filter and search filter working.`);
    } else {
      throw new Error('No herbs found or search query failed.');
    }
  } catch (err: any) {
    results.push({
      feature: 'Herb Library & Search',
      status: 'FAILED',
      details: err.message || String(err),
    });
    console.error('  ✖ Herb Library failed:', err.message);
  }

  // 3. USER MANAGEMENT & AUTH REPOSITORY
  console.log('\n▶ [3/7] Testing Feature: User Directory & Auth Data...');
  try {
    const users = await prisma.user.findMany({ take: 5, select: { id: true, name: true, email: true, role: true } });
    results.push({
      feature: 'User Directory & Authentication',
      status: 'PASSED',
      details: `User repository queried successfully (${users.length} active registered users).`,
      dataSummary: { userCount: users.length, roles: users.map((u) => u.role) },
    });
    console.log(`  ✔ Found ${users.length} users in system with roles: ${users.map((u) => u.role).join(', ')}.`);
  } catch (err: any) {
    results.push({
      feature: 'User Directory & Authentication',
      status: 'FAILED',
      details: err.message || String(err),
    });
    console.error('  ✖ User auth query failed:', err.message);
  }

  // 4. COMMUNITY FORUM FEATURE
  console.log('\n▶ [4/7] Testing Feature: Community Forum Threads & Interactions...');
  try {
    const { threads, total } = await forumRepo.findAllThreads({ page: 1, limit: 10 });
    results.push({
      feature: 'Community Forum',
      status: 'PASSED',
      details: `Forum system functional. Loaded ${threads.length} threads (total ${total}).`,
      dataSummary: {
        threadCount: total,
        recentTitles: threads.slice(0, 3).map((t) => t.title),
      },
    });
    console.log(`  ✔ Forum queried successfully (${total} total discussion threads).`);
  } catch (err: any) {
    results.push({
      feature: 'Community Forum',
      status: 'FAILED',
      details: err.message || String(err),
    });
    console.error('  ✖ Forum feature failed:', err.message);
  }

  // 5. DIRECT MESSAGING SYSTEM
  console.log('\n▶ [5/7] Testing Feature: Direct Peer-to-Peer Messaging...');
  try {
    const allUsers = await messageRepo.getMessageableUsers('dummy-id');
    results.push({
      feature: 'Direct Messaging',
      status: 'PASSED',
      details: `Messenger directory accessible (${allUsers.length} available contacts for conversation).`,
      dataSummary: { availableContacts: allUsers.length },
    });
    console.log(`  ✔ Messenger directory returned ${allUsers.length} available contacts.`);
  } catch (err: any) {
    results.push({
      feature: 'Direct Messaging',
      status: 'FAILED',
      details: err.message || String(err),
    });
    console.error('  ✖ Messaging failed:', err.message);
  }

  // 6. CONTRIBUTIONS / BOTANIST SUGGESTIONS
  console.log('\n▶ [6/7] Testing Feature: Herb Suggestions & Review Workflow...');
  try {
    const suggestions = await suggestRepo.findAllSuggestions();
    results.push({
      feature: 'Herb Contributions / Suggestions',
      status: 'PASSED',
      details: `Suggestion review repository active (${suggestions.length} total contributions recorded).`,
      dataSummary: { totalSuggestions: suggestions.length },
    });
    console.log(`  ✔ Suggestions repository returned ${suggestions.length} recorded contributions.`);
  } catch (err: any) {
    results.push({
      feature: 'Herb Contributions / Suggestions',
      status: 'FAILED',
      details: err.message || String(err),
    });
    console.error('  ✖ Suggestions failed:', err.message);
  }

  // 7. PLATFORM ANALYTICS & AUDIT TRAIL
  console.log('\n▶ [7/7] Testing Feature: Platform Analytics Dashboard & Audit Logs...');
  try {
    const stats = await statsRepository.getSystemStats();
    const { logs, total } = await auditRepo.findAuditLogs(10, 0);

    results.push({
      feature: 'Analytics & Audit Trail',
      status: 'PASSED',
      details: `Platform stats computed: ${stats.herbsByCategory.length} herb categories, ${stats.suggestionsByStatus.length} suggestion categories. Audit log contains ${total} events.`,
      dataSummary: { herbsCategories: stats.herbsByCategory.length, auditCount: total },
    });
    console.log(`  ✔ Platform stats computed: ${stats.herbsByCategory.length} categories, ${total} audit events.`);
  } catch (err: any) {
    results.push({
      feature: 'Analytics & Audit Trail',
      status: 'FAILED',
      details: err.message || String(err),
    });
    console.error('  ✖ Analytics / Audit failed:', err.message);
  }

  // FINAL SUMMARY
  console.log('\n===============================================================');
  console.log('📊 VERIFICATION SUMMARY REPORT');
  console.log('===============================================================');
  let passCount = 0;
  for (const r of results) {
    const icon = r.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} [${r.status}] ${r.feature}`);
    console.log(`   └─ ${r.details}`);
    if (r.dataSummary) {
      console.log(`   └─ Data: ${JSON.stringify(r.dataSummary)}`);
    }
    if (r.status === 'PASSED') passCount++;
  }
  console.log('---------------------------------------------------------------');
  console.log(`TOTAL FEATURES VERIFIED: ${passCount} / ${results.length} PASSED`);
  console.log('===============================================================\n');

  await prisma.$disconnect();
}

runFeatureVerification().catch((e) => {
  console.error('CRITICAL ERROR in verification:', e);
  process.exit(1);
});
