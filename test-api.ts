/**
 * Test script for OpenAlex Worker API
 * Run this with: deno run --allow-net test-api.ts
 * Or with Node.js (18+): node --loader ts-node/esm test-api.ts
 */

// Replace with your worker URL when deployed
const BASE_URL = 'http://localhost:8787';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: unknown;
}

const results: TestResult[] = [];

async function test(name: string, url: string): Promise<void> {
  try {
    console.log(`\n[Testing] ${name}`);
    console.log(`URL: ${url}`);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    console.log(`✓ Success`);
    console.log(`Response preview:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');

    results.push({ name, success: true, data });
  } catch (error) {
    console.log(`✗ Failed: ${error}`);
    results.push({
      name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function runTests() {
  console.log('========================================');
  console.log('OpenAlex Worker API Tests');
  console.log('========================================');

  // Test 1: Root endpoint
  await test('Root endpoint', `${BASE_URL}/`);

  // Test 2: Get works list
  await test('Get works (first page)', `${BASE_URL}/works?per_page=5`);

  // Test 3: Get single work
  await test(
    'Get single work',
    `${BASE_URL}/works/W2741809807`
  );

  // Test 4: Search works
  await test(
    'Search works for "machine learning"',
    `${BASE_URL}/works?search=machine%20learning&per_page=3`
  );

  // Test 5: Filter works
  await test(
    'Filter: Open access works from 2023',
    `${BASE_URL}/works?filter=publication_year:2023,is_oa:true&per_page=3`
  );

  // Test 6: Sort works
  await test(
    'Sort works by citations (descending)',
    `${BASE_URL}/works?filter=publication_year:2020&sort=cited_by_count:desc&per_page=3`
  );

  // Test 7: Select specific fields
  await test(
    'Select only id, doi, and display_name',
    `${BASE_URL}/works?select=id,doi,display_name&per_page=3`
  );

  // Test 8: Group by
  await test(
    'Group works by type',
    `${BASE_URL}/works?group_by=type`
  );

  // Test 9: Get random work
  await test('Get random work', `${BASE_URL}/works/random`);

  // Test 10: Search authors
  await test(
    'Search authors for "Einstein"',
    `${BASE_URL}/authors?filter=display_name.search:einstein&per_page=3`
  );

  // Test 11: Get single author
  await test(
    'Get single author',
    `${BASE_URL}/authors/A5027479191`
  );

  // Test 12: Get institutions
  await test(
    'Get institutions from Germany',
    `${BASE_URL}/institutions?filter=country_code:DE&per_page=5`
  );

  // Test 13: Get sources
  await test(
    'Get sources with >1000 works',
    `${BASE_URL}/sources?filter=works_count:>1000&per_page=3`
  );

  // Test 14: Autocomplete
  await test(
    'Autocomplete institutions: "harvard"',
    `${BASE_URL}/autocomplete/institutions?q=harvard`
  );

  // Test 15: Nested filters
  await test(
    'Works from Stanford (by ROR)',
    `${BASE_URL}/works?filter=authorships.institutions.ror:00f54p054&per_page=3`
  );

  // Test 16: Sample
  await test(
    'Random sample of 5 works',
    `${BASE_URL}/works?sample=5&seed=123&per_page=5`
  );

  // Test 17: Cursor pagination
  await test(
    'Cursor pagination (first page)',
    `${BASE_URL}/works?filter=publication_year:2023&cursor=*&per_page=10`
  );

  // Test 18: Get topics
  await test(
    'Get topics',
    `${BASE_URL}/topics?per_page=5`
  );

  // Test 19: Get single topic
  await test(
    'Get single topic',
    `${BASE_URL}/topics/T10001`
  );

  // Test 20: Get publishers
  await test(
    'Get publishers',
    `${BASE_URL}/publishers?per_page=5`
  );

  // Test 21: Get single publisher
  await test(
    'Get single publisher (Elsevier)',
    `${BASE_URL}/publishers/P4310320990`
  );

  // Test 22: Get funders
  await test(
    'Get funders',
    `${BASE_URL}/funders?per_page=5`
  );

  // Test 23: Get single funder (NSF)
  await test(
    'Get single funder',
    `${BASE_URL}/funders/F4320332161`
  );

  // Test 24: Get random author
  await test('Get random author', `${BASE_URL}/authors/random`);

  // Test 25: Get random institution
  await test('Get random institution', `${BASE_URL}/institutions/random`);

  // Test 26: Autocomplete authors
  await test(
    'Autocomplete authors: "darwin"',
    `${BASE_URL}/autocomplete/authors?q=darwin`
  );

  // Test 27: Autocomplete works
  await test(
    'Autocomplete works: "origin of species"',
    `${BASE_URL}/autocomplete/works?q=origin%20of%20species`
  );

  // Test 28: Group authors by country
  await test(
    'Group authors by country',
    `${BASE_URL}/authors?group_by=last_known_institutions.country_code`
  );

  // Test 29: Sort sources by works_count
  await test(
    'Sort sources by works_count',
    `${BASE_URL}/sources?sort=works_count:desc&per_page=5`
  );

  // Test 30: Select fields for authors
  await test(
    'Select only id and display_name for authors',
    `${BASE_URL}/authors?select=id,display_name&per_page=3`
  );

  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  console.log('\n========================================');
}

// Run tests
runTests().catch(console.error);
