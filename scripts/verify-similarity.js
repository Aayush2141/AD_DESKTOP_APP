// Verification script for Natural Language Duplicate Detection Engine
const {
  tokenize,
  computeJaccardSimilarity,
  checkDuplicateSimilarity,
} = require('../electron/services/similarityService');

function runVerification() {
  console.log('=== Running Similarity Engine Verification ===\n');

  // Test 1: Tokenization and stop words
  const rawText = 'Clinical evaluation of Virechana Karma in Kitibha Kushtha with special reference to Psoriasis';
  const tokens = tokenize(rawText);
  console.log('[1] Tokenize output:', tokens);
  if (!tokens.includes('virechana') || !tokens.includes('kitibha') || !tokens.includes('psoriasis')) {
    throw new Error('Tokenize failed to preserve essential clinical terms');
  }

  // Test 2: Jaccard similarity
  const tokensA = ['virechana', 'karma', 'kitibha', 'kushtha', 'psoriasis'];
  const tokensB = ['virechana', 'karma', 'kitibha', 'dermatology'];
  const jaccard = computeJaccardSimilarity(tokensA, tokensB);
  console.log(`[2] Jaccard similarity: ${(jaccard * 100).toFixed(1)}%`);

  // Test 3: Duplicate similarity against sample database
  const sampleRepository = [
    {
      id: 1,
      title: 'Clinical Evaluation of Virechana Karma in Kitibha Kushtha (Psoriasis)',
      abstract: 'An open-label randomized trial evaluating efficacy of classical Virechana in plaque psoriasis.',
      keywords: 'Kitibha, Psoriasis, Virechana, Shodhana',
      department_name: 'Panchakarma',
      status: 'Evaluated - Approved',
    },
    {
      id: 2,
      title: 'Pharmacological Standardization of Triphala Guggulu in Metabolic Disorders',
      abstract: 'Chromatographic profiling and lipid profile assessment in dyslipidemia models.',
      keywords: 'Triphala, Guggulu, Medoroga, Dyslipidemia',
      department_name: 'Dravyaguna',
      status: 'In Progress',
    },
  ];

  const candidateTopic = {
    title: 'Clinical Evaluation of Classical Virechana Protocol in Chronic Plaque Psoriasis',
    abstract: 'Investigating Shodhana Virechana therapy on PASI score in psoriasis patients.',
    keywords: 'Psoriasis, Virechana, Shodhana, Dermatology',
  };

  const dupResult = checkDuplicateSimilarity(candidateTopic, sampleRepository, 0.45);
  console.log(`[3] Top Match: #${dupResult.matches[0]?.id} with score ${(dupResult.highestScore * 100).toFixed(1)}%`);
  console.log(`    Is Duplicate Triggered? ${dupResult.isDuplicate ? 'YES (BLOCKED)' : 'NO'}`);

  if (!dupResult.isDuplicate) {
    throw new Error('Expected duplicate detection to trigger for high overlap topic');
  }

  console.log('\nAll similarity engine assertions passed successfully!\n');
}

runVerification();
