// Natural Language Processing Similarity Engine for Duplicate Detection
// Uses TF-IDF (Term Frequency-Inverse Document Frequency) Cosine Similarity
// and Jaccard N-gram Similarity on Title + Abstract + Keywords.

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can',
  'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have',
  'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into',
  'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
  'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t',
  'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re',
  'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while',
  'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves', 'study', 'evaluation', 'clinical', 'assessment'
]);

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function getTermFrequencies(tokens) {
  const tf = {};
  tokens.forEach(t => {
    tf[t] = (tf[t] || 0) + 1;
  });
  const total = tokens.length || 1;
  for (const t in tf) {
    tf[t] = tf[t] / total;
  }
  return tf;
}

function computeJaccardSimilarity(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (setA.size === 0 && setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

function computeTfidfCosine(queryTokens, docTokens, docFrequencyMap, totalDocs) {
  const allTerms = new Set([...queryTokens, ...docTokens]);
  let dotProduct = 0;
  let queryNormSq = 0;
  let docNormSq = 0;

  const qTf = getTermFrequencies(queryTokens);
  const dTf = getTermFrequencies(docTokens);

  for (const term of allTerms) {
    // IDF: log((N + 1) / (df + 1)) + 1
    const df = docFrequencyMap[term] || 1;
    const idf = Math.log((totalDocs + 1) / (df + 1)) + 1;

    const qWeight = (qTf[term] || 0) * idf;
    const dWeight = (dTf[term] || 0) * idf;

    dotProduct += qWeight * dWeight;
    queryNormSq += qWeight * qWeight;
    docNormSq += dWeight * dWeight;
  }

  const denominator = Math.sqrt(queryNormSq) * Math.sqrt(docNormSq);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Checks similarity of a proposed dissertation against all existing dissertations in DB.
 * @param {Object} input - { title, abstract, keywords, excludeId }
 * @param {Array} existingDissertations - Array of existing records
 * @param {number} threshold - Trigger threshold (e.g., 0.45 = 45%)
 * @returns {Object} - { isDuplicate: boolean, highestScore: number, matches: Array }
 */
function checkDuplicateSimilarity(input, existingDissertations = [], threshold = 0.45) {
  const queryText = `${input.title || ''} ${input.title || ''} ${input.keywords || ''} ${input.abstract || ''}`;
  const queryTokens = tokenize(queryText);

  if (queryTokens.length === 0) {
    return { isDuplicate: false, highestScore: 0, matches: [] };
  }

  // Filter out the same dissertation if updating
  const candidateDocs = existingDissertations.filter(d => !input.excludeId || d.id !== input.excludeId);
  const totalDocs = candidateDocs.length;

  if (totalDocs === 0) {
    return { isDuplicate: false, highestScore: 0, matches: [] };
  }

  // Build document frequency map
  const docFrequencyMap = {};
  const tokenizedCandidates = candidateDocs.map(doc => {
    const docText = `${doc.title || ''} ${doc.title || ''} ${doc.keywords || ''} ${doc.abstract || ''}`;
    const tokens = tokenize(docText);
    const uniqueTokens = new Set(tokens);
    for (const t of uniqueTokens) {
      docFrequencyMap[t] = (docFrequencyMap[t] || 0) + 1;
    }
    return { doc, tokens, text: docText };
  });

  const matches = [];

  for (const { doc, tokens } of tokenizedCandidates) {
    const cosineScore = computeTfidfCosine(queryTokens, tokens, docFrequencyMap, totalDocs);
    const jaccardScore = computeJaccardSimilarity(queryTokens, tokens);

    // Weighted combined similarity score (70% Cosine TF-IDF, 30% Jaccard Token Overlap)
    const combinedScore = Math.min(1.0, (cosineScore * 0.7) + (jaccardScore * 0.3));

    // Common matching keywords
    const qSet = new Set(queryTokens);
    const commonTerms = [...new Set(tokens.filter(t => qSet.has(t)))].slice(0, 8);

    if (combinedScore > 0.15) {
      matches.push({
        id: doc.id,
        title: doc.title,
        abstract: doc.abstract ? (doc.abstract.substring(0, 160) + '...') : '',
        keywords: doc.keywords,
        status: doc.status,
        guide_name: doc.guide_name,
        department_name: doc.department_name,
        college_name: doc.college_name,
        submission_year: doc.created_at ? new Date(doc.created_at).getFullYear() : 2024,
        similarityScore: Math.round(combinedScore * 1000) / 1000,
        percentage: Math.round(combinedScore * 100),
        matchedTerms: commonTerms,
      });
    }
  }

  // Sort descending by similarity score
  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  const highestScore = matches.length > 0 ? matches[0].similarityScore : 0;
  const isDuplicate = highestScore >= threshold;

  return {
    isDuplicate,
    highestScore,
    threshold,
    matches: matches.slice(0, 5), // top 5 most similar
  };
}

module.exports = {
  checkDuplicateSimilarity,
  tokenize,
  computeJaccardSimilarity,
};
