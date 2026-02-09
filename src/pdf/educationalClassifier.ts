const DEFAULT_OPTIONS = {
  pagesToAnalyze: 8,
  maxTextLength: 24000,
  confidenceThreshold: 0.5,
}

const EDUCATIONAL_KEYWORDS = [
  'syllabus',
  'curriculum',
  'lecture',
  'chapter',
  'textbook',
  'homework',
  'assignment',
  'exam',
  'quiz',
  'midterm',
  'semester',
  'course',
  'professor',
  'instructor',
  'student',
  'university',
  'college',
  'school',
  'academy',
  'institute',
  'abstract',
  'methodology',
  'bibliography',
  'references',
  'hypothesis',
  'conclusion',
  'research',
  'study',
  'analysis',
  'journal',
  'publication',
  'proceedings',
  'symposium',
  'theorem',
  'definition',
  'exercise',
  'problem set',
  'learning objectives',
  'review questions',
  'study guide',
  'lab manual',
  'worksheet',
  'handout',
  'notes',
  'lesson plan',
  'tutorial',
  'case study',
  'prerequisite',
  'learning outcomes',
  'assessment',
  'rubric',
  'grading',
  'practice test',
  'answer key',
  'lesson',
  'lecture notes',
  'course outline',
  'course objectives',
  'learning goals',
  'problem solving',
  'solution set',
  'reading list',
  'literature review',
  'peer review',
  'appendix',
  'introduction',
  'discussion',
  'results',
  'materials and methods',
  'acknowledgements',
  'citations',
  'workshop',
  'tutorial sheet',
  'practice problems',
  'lab report',
]

const NON_EDUCATIONAL_KEYWORDS = [
  'invoice',
  'receipt',
  'contract',
  'agreement',
  'warranty',
  'terms and conditions',
  'privacy policy',
  'newsletter',
  'brochure',
  'catalog',
  'menu',
  'recipe',
  'fiction',
  'novel',
  'press release',
  'marketing',
  'purchase order',
  'statement',
  'resume',
  'proposal',
  'brand guidelines',
  'product sheet',
  'sales',
  'legal',
  'invoice number',
  'billing',
  'shipment',
  'balance due',
  'total due',
  'quote',
  'statement of work',
  'purchase',
  'terms',
  'conditions',
  'policy',
  'compliance',
  'nda',
  'confidential',
  'employment',
  'salary',
  'benefits',
  'insurance',
  'legal notice',
  'refund',
  'order',
  'subscription',
]

const EDUCATIONAL_PATTERNS = [
  { pattern: /chapter\s+\d+/i, weight: 1 },
  { pattern: /section\s+\d+/i, weight: 1 },
  { pattern: /problem\s+\d+/i, weight: 1 },
  { pattern: /exercise\s+\d+/i, weight: 1 },
  { pattern: /figure\s+\d+/i, weight: 0.8 },
  { pattern: /table\s+\d+/i, weight: 0.8 },
  { pattern: /\[\d+\]/, weight: 1.2 },
  { pattern: /\(\d{4}\)/, weight: 0.8 },
  { pattern: /pp\.\s*\d+-\d+/i, weight: 1 },
  { pattern: /learning objectives/i, weight: 1.2 },
  { pattern: /references/i, weight: 1.2 },
  { pattern: /bibliography/i, weight: 1.2 },
  { pattern: /course outline/i, weight: 1.2 },
  { pattern: /\bdoi:\s*\S+/i, weight: 1.3 },
  { pattern: /\bisbn\b/i, weight: 1.3 },
  { pattern: /\bissn\b/i, weight: 1.3 },
  { pattern: /\bet al\./i, weight: 1 },
  { pattern: /\bvolume\s+\d+/i, weight: 0.8 },
  { pattern: /\bissue\s+\d+/i, weight: 0.8 },
  { pattern: /\bappendix\b/i, weight: 0.7 },
]

const NON_EDUCATIONAL_PATTERNS = [
  { pattern: /invoice\s+#?\d+/i, weight: 1.4 },
  { pattern: /terms and conditions/i, weight: 1.2 },
  { pattern: /privacy policy/i, weight: 1.2 },
  { pattern: /statement date/i, weight: 1 },
  { pattern: /purchase order/i, weight: 1.2 },
  { pattern: /bill to/i, weight: 1.2 },
  { pattern: /ship to/i, weight: 1.2 },
  { pattern: /total due/i, weight: 1.4 },
  { pattern: /balance due/i, weight: 1.4 },
  { pattern: /authorized signature/i, weight: 1 },
  { pattern: /terms of service/i, weight: 1.2 },
  { pattern: /return policy/i, weight: 1 },
  { pattern: /payment due/i, weight: 1.4 },
  { pattern: /\bpo\b\s?#?\d+/i, weight: 1.2 },
]

const STRONG_EDU_KEYWORDS = [
  'syllabus',
  'textbook',
  'lecture notes',
  'research paper',
  'exam paper',
  'study guide',
  'problem set',
  'lab manual',
  'course outline',
  'learning objectives',
]

const STRONG_NON_EDU_KEYWORDS = [
  'invoice',
  'contract',
  'terms and conditions',
  'privacy policy',
  'purchase order',
  'statement of work',
  'balance due',
]

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function countKeywordMatches(text: string, keywords: string[]): number {
  const lowered = text.toLowerCase()
  return keywords.reduce((count, keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'giu')
    const matches = lowered.match(pattern)
    if (matches && matches.length > 0) {
      console.debug('countKeywordMatches', { keyword, regex: pattern.toString(), occurrences: matches.length })
    }
    return count + (matches ? matches.length : 0)
  }, 0)
}

export function scoreKeywords(text: string): number {
  const eduCount = countKeywordMatches(text, EDUCATIONAL_KEYWORDS)
  const nonEduCount = countKeywordMatches(text, NON_EDUCATIONAL_KEYWORDS)
  const strongEduCount = countKeywordMatches(text, STRONG_EDU_KEYWORDS)
  const strongNonEduCount = countKeywordMatches(text, STRONG_NON_EDU_KEYWORDS)
  const weightedEdu = eduCount + strongEduCount * 1.5
  const weightedNonEdu = nonEduCount + strongNonEduCount * 1.5
  const total = weightedEdu + weightedNonEdu
  if (total === 0) {
    return 0.5
  }
  return weightedEdu / total
}

export function scorePatterns(text: string): number {
  const eduWeight = EDUCATIONAL_PATTERNS.reduce(
    (sum, item) => (item.pattern.test(text) ? sum + item.weight : sum),
    0,
  )
  const nonEduWeight = NON_EDUCATIONAL_PATTERNS.reduce(
    (sum, item) => (item.pattern.test(text) ? sum + item.weight : sum),
    0,
  )
  const total = eduWeight + nonEduWeight
  if (total === 0) {
    return 0.5
  }
  return eduWeight / total
}

export function scoreStructure(text: string): number {
  let score = 0
  const introSlice = text.slice(0, Math.min(text.length, 3000))

  if (/table of contents/i.test(text)) score += 0.15
  if (/\d+\.\d+/.test(text)) score += 0.15
  if (/\?\s/g.test(text) && (text.match(/\?\s/g) || []).length > 3) score += 0.1
  if (/[∑∫∂∆π÷×±≤≥≠√∞]/.test(text)) score += 0.1
  if (/\[\d+\]/.test(text)) score += 0.1
  if (/references|bibliography/i.test(text)) score += 0.2
  if (/abstract|introduction|methodology/i.test(introSlice)) score += 0.1
  if (/\blecture\b|\bsemester\b|\bmodule\b/i.test(text)) score += 0.1

  const words = text.split(/\s+/)
  if (words.length > 0) {
    const avgWordLength = words.reduce((acc, word) => acc + word.length, 0) / words.length
    if (avgWordLength > 6) score += 0.2
  }

  return clamp(score, 0, 1)
}

export type PdfMetadata = {
  title?: string
  author?: string
  subject?: string
}

export function scoreMetadata(metadata: PdfMetadata | undefined): number {
  let score = 0.5
  const author = (metadata?.author || '').toLowerCase()
  const title = (metadata?.title || '').toLowerCase()
  const subject = (metadata?.subject || '').toLowerCase()

  if (/university|college|institute|prof|dr\.|ph\.d/i.test(author)) {
    score += 0.2
  }
  if (/course|lecture|textbook|study|exam|research/i.test(title)) {
    score += 0.2
  }
  if (/education|academic|curriculum|learning/i.test(subject)) {
    score += 0.1
  }

  return clamp(score, 0, 1)
}

function scoreNegativeSignals(text: string): number {
  const nonEduKeywordHits = countKeywordMatches(text, NON_EDUCATIONAL_KEYWORDS)
  const strongNonEduHits = countKeywordMatches(text, STRONG_NON_EDU_KEYWORDS)
  const nonEduPatternHits = NON_EDUCATIONAL_PATTERNS.filter((item) => item.pattern.test(text)).length

  const rawPenalty = nonEduKeywordHits * 0.02 + strongNonEduHits * 0.08 + nonEduPatternHits * 0.15

  return clamp(rawPenalty, 0, 1)
}

export function classifyEducationalDocument(
  text: string,
  metadata: PdfMetadata = {},
  options: Partial<typeof DEFAULT_OPTIONS> = {},
): {
  classification: 'educational' | 'non-educational'
  confidence: number
  score: number
  scores: { keywords: number; patterns: number; structure: number; metadata: number }
  details: { foundKeywords: string[]; foundNonEduKeywords: string[]; textLength: number }
} {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const normalized = normalizeText(text).slice(0, config.maxTextLength)

  const keywordScore = scoreKeywords(normalized)
  const patternScore = scorePatterns(normalized)
  const structureScore = scoreStructure(normalized)
  const metadataScore = scoreMetadata(metadata)
  const negativePenalty = scoreNegativeSignals(normalized)

  let totalScore =
    keywordScore * 0.35 + patternScore * 0.25 + structureScore * 0.25 + metadataScore * 0.15

  totalScore = clamp(totalScore - negativePenalty * 0.25, 0, 1)

  const classification = totalScore >= config.confidenceThreshold ? 'educational' : 'non-educational'

  const confidence = clamp(Math.abs(totalScore - 0.5) * 2, 0, 1)

  const foundKeywords = EDUCATIONAL_KEYWORDS.filter((keyword) =>
    countKeywordMatches(normalized, [keyword]) > 0,
  ).slice(0, 10)
  const foundNonEduKeywords = NON_EDUCATIONAL_KEYWORDS.filter((keyword) =>
    countKeywordMatches(normalized, [keyword]) > 0,
  ).slice(0, 10)

  return {
    classification,
    confidence,
    score: totalScore,
    scores: {
      keywords: keywordScore,
      patterns: patternScore,
      structure: structureScore,
      metadata: metadataScore,
    },
    details: {
      foundKeywords,
      foundNonEduKeywords,
      textLength: normalized.length,
    },
  }
}

export function getDefaultClassifierOptions() {
  return { ...DEFAULT_OPTIONS }
}

