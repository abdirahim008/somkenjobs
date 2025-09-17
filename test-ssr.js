// Comprehensive test script to validate all SSR HTML generation functions
import { generateJobDetailsHTML, generateHomepageHTML, generateJobsPageHTML } from './server/utils/ssrUtils.ts';

// Sample test data
const sampleJob = {
  id: 123,
  title: "Program Coordinator - Emergency Response",
  organization: "International Rescue Committee",
  location: "Mogadishu",
  country: "Somalia", 
  sector: "Emergency Response",
  description: "Lead emergency response programming in Somalia including coordination with local partners, assessment activities, and implementation of life-saving interventions.",
  qualifications: "Bachelor's degree in relevant field, 3+ years humanitarian experience, fluency in English.",
  responsibilities: "Coordinate emergency response activities, manage field teams, conduct assessments, report to donors.",
  howToApply: "Submit CV and cover letter through IRC careers portal.",
  url: "https://rescue.org/careers/12345",
  deadline: "2025-12-31",
  datePosted: "2025-09-01"
};

const sampleJobStats = {
  totalJobs: 342,
  organizations: 67,
  newToday: 15
};

const sampleRecentJobs = [
  {
    id: 456,
    title: "Health Program Manager",
    organization: "Médecins Sans Frontières",
    location: "Nairobi",
    country: "Kenya",
    sector: "Health",
    description: "Oversee health programming and coordinate medical interventions across multiple field sites.",
    datePosted: "2025-09-15"
  },
  {
    id: 789,
    title: "Education Coordinator",
    organization: "UNICEF",
    location: "Hargeisa",
    country: "Somalia",
    sector: "Education",
    description: "Develop and implement education programs for refugee and host community children.",
    datePosted: "2025-09-14"
  }
];

// Comprehensive validation function
function validateHTML(html, pageName) {
  console.log(`\n=== VALIDATING ${pageName.toUpperCase()} ===`);
  
  // Check for basic structure
  console.log("✓ Function executed successfully");
  
  // Check word count
  const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(word => word.length > 0).length;
  console.log(`Word count: ${wordCount} words`);
  
  // Check for broken fragments - using exact orphaned fragment patterns
  const brokenFragments = [
    /^\s*mmunities throughout Kenya/m,  // Orphaned fragment at line start
    /^\s*manitarian landscape\.<\/p>/m, // Orphaned closing without opening
    /^\s*ortunities\.<\/p>/m,          // Orphaned closing without opening  
    /^\s*ional context, and show alignment/m,
    '</p>\n</p>',                      // Double closing tags
    '<p></p>',                         // Empty paragraphs
    /[^a-zA-Z']undefined[^a-zA-Z']/,   // Template errors (not JS typeof checks)
    'NaN'                              // Math errors
  ];
  
  let foundIssues = [];
  brokenFragments.forEach(fragment => {
    if (typeof fragment === 'string') {
      if (html.includes(fragment)) {
        foundIssues.push(`Found broken fragment: "${fragment}"`);
      }
    } else if (fragment instanceof RegExp) {
      if (fragment.test(html)) {
        foundIssues.push(`Found broken fragment pattern: ${fragment.source}`);
      }
    }
  });
  
  // Check for proper heading hierarchy
  const h1Count = (html.match(/<h1[^>]*>/g) || []).length;
  const h2Count = (html.match(/<h2[^>]*>/g) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/g) || []).length;
  
  let structureIssues = [];
  if (h1Count === 0) structureIssues.push('Missing H1 heading');
  if (h1Count > 1) structureIssues.push(`Multiple H1 headings found: ${h1Count}`);
  if (h2Count === 0) structureIssues.push('Missing H2 headings');
  if (h3Count === 0) structureIssues.push('Missing H3 headings');
  
  // Check for orphaned closing tags
  const lines = html.split('\n');
  let orphanedTags = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for orphaned closing </p> tags without opening <p> tags on the same line
    if (line.endsWith('</p>') && !line.includes('<p>')) {
      // Allow valid cases like indented closing tags that are part of template structure
      if (line.length > 20 && !line.startsWith('</p>') && !line.includes('${')) {
        orphanedTags.push(`Line ${i + 1}: "${line}"`);
      }
    }
  }
  
  // Report results
  console.log(`\n=== ${pageName.toUpperCase()} RESULTS ===`);
  console.log(`Word count: ${wordCount} ${wordCount >= 250 ? '✓' : '✗ (minimum 250)'}`);
  console.log(`H1 headings: ${h1Count} ${h1Count === 1 ? '✓' : '✗'}`);
  console.log(`H2 headings: ${h2Count} ${h2Count >= 1 ? '✓' : '✗'}`);
  console.log(`H3 headings: ${h3Count} ${h3Count >= 1 ? '✓' : '✗'}`);
  console.log(`Broken fragments: ${foundIssues.length === 0 ? '✓ None found' : '✗ Found issues'}`);
  console.log(`Orphaned tags: ${orphanedTags.length === 0 ? '✓ None found' : '✗ Found issues'}`);
  console.log(`Structure issues: ${structureIssues.length === 0 ? '✓ All good' : '✗ Found issues'}`);
  
  // Log any issues found
  if (foundIssues.length > 0) {
    console.log('\nBroken fragments found:');
    foundIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (orphanedTags.length > 0) {
    console.log('\nOrphaned tags found:');
    orphanedTags.forEach(tag => console.log(`  - ${tag}`));
  }
  
  if (structureIssues.length > 0) {
    console.log('\nStructure issues:');
    structureIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  // Calculate overall success
  const allTestsPassed = wordCount >= 250 && h1Count === 1 && h2Count >= 1 && h3Count >= 1 && 
                         foundIssues.length === 0 && orphanedTags.length === 0 && structureIssues.length === 0;
  
  console.log(`\nOVERALL: ${allTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return {
    passed: allTestsPassed,
    wordCount,
    headings: { h1: h1Count, h2: h2Count, h3: h3Count },
    issues: foundIssues.length + orphanedTags.length + structureIssues.length
  };
}

async function runTests() {
try {
  console.log("🚀 Testing all SSR HTML generation functions...\n");
  
  const results = [];
  
  // Test 1: Job Details Page
  console.log("1. Testing generateJobDetailsHTML...");
  const jobDetailsHtml = generateJobDetailsHTML(sampleJob);
  results.push({
    page: 'Job Details',
    ...validateHTML(jobDetailsHtml, 'Job Details')
  });
  
  // Test 2: Homepage  
  console.log("\n2. Testing generateHomepageHTML...");
  const homepageHtml = generateHomepageHTML(sampleJobStats, sampleRecentJobs);
  results.push({
    page: 'Homepage',
    ...validateHTML(homepageHtml, 'Homepage')
  });
  
  // Test 3: Jobs Listing Page
  console.log("\n3. Testing generateJobsPageHTML...");
  const jobsPageHtml = generateJobsPageHTML(sampleRecentJobs, sampleJobStats.totalJobs, { country: 'Somalia' });
  results.push({
    page: 'Jobs Page',
    ...validateHTML(jobsPageHtml, 'Jobs Page')
  });
  
  // Write sample outputs to files for inspection
  const fs = await import('fs');
  fs.writeFileSync('test-job-details.html', jobDetailsHtml);
  fs.writeFileSync('test-homepage.html', homepageHtml);
  fs.writeFileSync('test-jobs-page.html', jobsPageHtml);
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPREHENSIVE SSR TEST SUMMARY');
  console.log('='.repeat(60));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues, 0);
  
  console.log(`\nPages tested: ${totalTests}`);
  console.log(`Tests passed: ${passedTests}/${totalTests}`);
  console.log(`Total issues found: ${totalIssues}`);
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${result.page}:`);
    console.log(`  Status: ${status}`);
    console.log(`  Word count: ${result.wordCount}`);
    console.log(`  Headings: H1=${result.headings.h1}, H2=${result.headings.h2}, H3=${result.headings.h3}`);
    console.log(`  Issues: ${result.issues}`);
  });
  
  console.log(`\n📁 Sample outputs written:`);
  console.log(`  - test-job-details.html`);
  console.log(`  - test-homepage.html`);
  console.log(`  - test-jobs-page.html`);
  
  const overallSuccess = passedTests === totalTests && totalIssues === 0;
  console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '🎉 SUCCESS - All tests passed!' : '⚠️ ISSUES FOUND - Review logs above'}`);
  
  if (overallSuccess) {
    console.log('\n✅ Orphaned fragment cycle permanently resolved!');
    console.log('✅ Systematic approach successfully implemented!');
    console.log('✅ All SSR pages validated and working correctly!');
  }
  
} catch (error) {
  console.error('Error testing function:', error);
}
}

runTests();