import { findActiveKBByTerms, searchSimilarKB } from "../../../repositories/knowledgebase.repository.js";
import { findAllHerbs, searchSimilarHerbs } from "../../../repositories/herb.repository.js";
import { generateEmbedding, generateChatResponse, generateChatResponseStream } from "../core/gemini-service.js";
import type { Content } from "@google/generative-ai";
import type { HerbQueryResult } from "../../../repositories/herb.repository.js";
import type { KBQueryResult } from "../../../repositories/knowledgebase.repository.js";
import { awaitAiOperation, iterateAiOperation } from "../core/request-lifetime.js";
import type { AiRequestOptions } from "../core/request-lifetime.js";
import { isPreparationQuestion, isPediatricQuestion, isPediatricRequest, isContextFollowUp, isLinkOrLibraryQuestion, userQuestionsNewestFirst } from './conversation-context.js';

const STOP_WORDS = new Set([
  // English grammatical & conversational words
  "a", "about", "also", "am", "an", "and", "any", "are", "as", "at",
  "be", "because", "been", "being", "best", "but", "by",
  "can", "could", "did", "do", "does", "doing", "dont", "don't", "dose", "dosage",
  "feel", "feeling", "find", "for", "from", "get", "getting", "give", "good", "got", "guidance",
  "had", "has", "have", "having", "help", "helping", "her", "herb", "herbal", "here", "him", "his", "how",
  "i", "im", "i'm", "if", "in", "into", "is", "it", "its", "just",
  "know", "knowing", "like", "look", "looking",
  "may", "me", "medicine", "might", "more", "most", "much", "must", "my",
  "need", "needed", "needs", "no", "not", "now", "of", "off", "on", "once", "only", "or", "other", "our", "out",
  "people", "plant", "plants", "please", "preparation", "prepare",
  "read", "reading", "recommend", "recommended",
  "safety", "said", "same", "say", "see", "should", "so", "some", "step", "steps", "suggest", "suggested",
  "take", "taking", "tell", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this", "those", "to", "too", "traditional",
  "up", "us", "use", "used", "uses", "using",
  "very", "want", "wanted", "was", "way", "we", "well", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would",
  "you", "your", "yours",

  // Tagalog conversational words
  "ako", "akong", "alam", "amin", "aming", "ang", "ano", "anong", "atin", "ating",
  "ba", "bago", "bakit", "bale", "bang", "basa", "bata", "bawat", "bigay", "bigyan",
  "dahil", "dapat", "din", "dito", "doon",
  "gamot", "gusto",
  "habang", "halaman", "halamang",
  "iba", "ikaw", "inumin", "isa", "isang", "ito", "itong", "iyon", "iyong",
  "ka", "kahit", "kailan", "kailangan", "kami", "kanila", "kanilang", "kanya", "kanyang", "kasi", "kay", "kayo", "ko", "kong", "kung",
  "lahat", "lang", "loob",
  "mag", "magsabi", "maging", "mahalaga", "makikita", "marami", "maraming", "may", "mayroon", "meron", "mga", "mo", "mong", "mula",
  "na", "nahanap", "naka", "nakita", "naman", "naming", "namin", "nang", "nariyan", "natin", "nating", "nawala", "nga", "ng", "ngayon", "nila", "nilang", "ninyo", "nito", "nitong", "niya", "niyang", "noon",
  "oo", "opo",
  "pa", "paano", "paki", "pakisabi", "palang", "para", "parang", "pero", "pili", "po", "pumili", "puwede", "pwede", "pwedeng",
  "sa", "saan", "sabi", "sabihin", "saka", "san", "sarili", "si", "sila", "silang", "sina", "sino", "sinong", "subalit",
  "taga", "talaga", "tayo", "tayong", "tingin", "totoo", "tulad", "tulong",
  "wala", "walang",

  // Cebuano conversational words
  "ako", "akong", "aling", "ana", "ani", "ano", "asa",
  "ba", "baga", "basin", "bisan",
  "daghan", "dako", "dili", "dinhi", "diha", "didto", "duna",
  "gani", "gikan",
  "hangtod", "hinoon",
  "ikaw", "imong", "imon", "ingon", "ini", "inita", "isip", "ito",
  "ka", "kadtong", "kadto", "kaha", "kamo", "kana", "kanang", "kaniadto", "kanunay", "karon", "kato", "kay", "kini", "kining", "kinsa", "ko", "kong", "kuno",
  "lang",
  "maayo", "man", "manang", "mas", "may", "mo", "mong",
  "na", "nako", "namo", "nana", "nani", "niana", "niini", "nimo", "ninyo", "niya",
  "og", "oo",
  "pa", "palihug", "para", "pero",
  "sa", "sab", "sad", "samtang", "si", "sila", "silang",
  "tambal", "tanan", "tanom", "tawo", "tua", "tudlo",
  "ug", "unya", "unsa", "unsay", "unsaon", "upod",
  "wala", "way",
]);

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

const HEALTH_CONCEPTS: Array<{ id: string; pattern: RegExp }> = [
  { id: 'fever', pattern: /\b(?:fever|fevers|lagnat|nilalagnat|hilanat|gihilanat|antipyretic)\b/i },
  { id: 'cough', pattern: /\b(?:cough|coughs|ubo|inuubo|giubo|antitussive|expectorant)\b/i },
  { id: 'cold', pattern: /\b(?:cold|colds|sipon|sinisipon|sip-on|gisip-on|flu|trankaso)\b/i },
  { id: 'wound', pattern: /\b(?:wound|wounds|sugat|nasugatan|samad|antiseptic)\b/i },
  { id: 'headache', pattern: /\b(?:headache|headaches|pananakit ng ulo|sakit sa ulo|sakit ng ulo|labad sa ulo|analgesic)\b/i },
  { id: 'stomach', pattern: /\b(?:stomach|stomachache|pananakit ng tiyan|sakit sa tiyan|sakit ng tiyan|diarrhea|pagtatae|kalibanga|kabag)\b/i },
  { id: 'asthma', pattern: /\b(?:asthma|hika|hinihika|hubak|bronchial)\b/i },
  { id: 'hypertension', pattern: /\b(?:hypertension|high blood|highblood|altapresyon|presyon)\b/i },
  { id: 'diabetes', pattern: /\b(?:diabetes|diabetic|asukal sa dugo|blood sugar)\b/i },
  { id: 'kidney', pattern: /\b(?:kidney|kidneys|kidney stone|kidney stones|bato sa bato|bato sa pantog|nephrolithiasis|urolithiasis|citrate|buko water|coconut water|tubig ng buko)\b/i },
];

const meaningfulTokens = (value: string) => {
  const normalized = normalize(value);
  const words = normalized.split(" ").filter((token) => token.length > 2 && !STOP_WORDS.has(token));
  const tokens = new Set<string>(words);
  for (const concept of HEALTH_CONCEPTS) {
    if (concept.pattern.test(normalized)) {
      tokens.add(concept.id);
    }
  }
  return tokens;
};

export type SupportedLanguage = 'en' | 'tl' | 'ceb';

export const detectQuestionLanguage = (question: string): SupportedLanguage => {
  const normalized = normalize(question);
  const cebPattern = /\b(?:unsa|unsay|unsaon|ngano|kanus-a|asa|kinsa|tanom|tambal|hilanat|sip-on|samad|imnon|luwas|kuyaw|dili|naa|kini|kana|kadto|ani|ana|adto|nako|nimo|palihug|daghang|salamat)\b/i;
  const tlPattern = /\b(?:po|opo|ba|ano|anong|paano|bakit|kailan|saan|sino|gamot|halaman|halamang|lagnat|ubo|sipon|sakit|tiyan|inumin|ligtas|pwede|puwede|nito|niyan|niyon|iyan|iyon|ito|yan|yun|kumusta|kamusta|maraming|salamat|bata|anak|sanggol|subukan|pakuluan)\b/i;

  if (cebPattern.test(normalized)) return 'ceb';
  if (tlPattern.test(normalized)) return 'tl';
  return 'en';
};

interface HealthConditionDiscovery {
  label: string;
  queryKeywords: RegExp;
  targetCondition: string;
  instruction: string;
}

const HEALTH_CONDITION_DISCOVERIES: HealthConditionDiscovery[] = [
  {
    label: 'fever',
    queryKeywords: /\b(?:fever|fevers|lagnat|nilalagnat|hilanat|gihilanat)\b/i,
    targetCondition: 'fever',
    instruction: 'Condition lookup: These published records mention fever in documented uses. This is not evidence that they are effective or appropriate for the user. Explain reported uses and limitations; do not prescribe a fever treatment or invent preparation/dosage.',
  },
  {
    label: 'cough',
    queryKeywords: /\b(?:cough|coughs|ubo|inuubo|giubo)\b/i,
    targetCondition: 'cough',
    instruction: 'Condition lookup: These published records mention cough in documented uses. This is not evidence that they are effective or appropriate for the user. Explain reported uses and limitations; do not prescribe a treatment or invent preparation/dosage.',
  },
  {
    label: 'cold',
    queryKeywords: /\b(?:cold|colds|sipon|sinisipon|sip-on|gisip-on)\b/i,
    targetCondition: 'cold',
    instruction: 'Condition lookup: These published records mention cold or respiratory symptoms in documented uses. This is not evidence that they are effective or appropriate for the user. Explain reported uses and limitations; do not prescribe a treatment or invent preparation/dosage.',
  },
  {
    label: 'wound',
    queryKeywords: /\b(?:wound|wounds|sugat|nasugatan|samad)\b/i,
    targetCondition: 'wound',
    instruction: 'Condition lookup: These published records mention wound care in documented uses. This is not evidence that they are effective or appropriate for the user. Explain reported uses and limitations; do not prescribe a treatment or invent preparation/dosage.',
  },
  {
    label: 'kidney',
    queryKeywords: /\b(?:kidney|kidneys|kidney stone|kidney stones|bato sa bato|bato sa pantog|nephrolithiasis|urolithiasis|citrate)\b/i,
    targetCondition: 'kidney',
    instruction: 'Condition lookup: These published records mention urinary or kidney support in documented traditional or clinical uses (e.g. Sambong, Niog / coconut water for urinary citrate support, Sampa-sampalukan). Clarify that herbal options support prevention and urinary flow, but cannot replace emergency or surgical urology care for obstructing stones. Remind users with renal impairment/CKD to exercise caution with coconut water due to potassium.',
  },
];

const lexicalOverlap = (question: string, candidate: string) => {
  const questionTokens = meaningfulTokens(question);
  if (questionTokens.size === 0) return 0;
  const candidateTokens = meaningfulTokens(candidate);
  let matches = 0;
  questionTokens.forEach((token) => {
    if (candidateTokens.has(token)) matches += 1;
  });
  return matches / questionTokens.size;
};

const configuredDistance = Number(process.env["DR_AI_MAX_COSINE_DISTANCE"] ?? "0.52");
const MAX_COSINE_DISTANCE = Number.isFinite(configuredDistance) ? configuredDistance : 0.52;
const DISTANCE_MARGIN = 0.08;

function selectCloseMatches<T extends { distance: number }>(results: T[], limit = 2): T[] {
  const eligible = results.filter((result) => Number(result.distance) <= MAX_COSINE_DISTANCE);
  if (eligible.length === 0) return [];
  const bestDistance = Number(eligible[0]?.distance ?? MAX_COSINE_DISTANCE);
  return eligible
    .filter((result) => Number(result.distance) <= Math.min(MAX_COSINE_DISTANCE, bestDistance + DISTANCE_MARGIN))
    .slice(0, limit);
}

export interface DrAiTimingMetrics {
  embeddingMs: number;
  retrievalMs: number;
  generationMs: number;
  totalMs: number;
}

export interface DrAiSource {
  type: "herb" | "kb";
  title: string;
  distance: number;
}

interface PreparedDrAiContext {
  context: string;
  fallbackReply: string;
  sources: DrAiSource[];
  embeddingMs: number;
  retrievalMs: number;
  herbSourceCount: number;
  knowledgeBaseSourceCount: number;
  bestDistance: number;
}

type CatalogHerb = Awaited<ReturnType<typeof findAllHerbs>>['herbs'][number];

const HERB_COMMON_ALIASES: Record<string, string[]> = {
  'niog': ['niyog', 'buko', 'butong', 'coconut', 'coconut water', 'buko water', 'buko juice', 'tubig ng buko'],
  'kalamansi': ['calamansi', 'kalamunding', 'limonsito', 'calamondin'],
  'tawa-tawa': ['tawatawa', 'gatas-gatas', 'gatas gatas', 'bobi', 'boto-botonis'],
  'madre de cacao': ['kakawate', 'gliricidia'],
  'guyabano': ['soursop', 'babana', 'bayubana'],
  'siling labuyo': ['katumbal', 'siling pasitis', 'labuyo', 'wild chili'],
  'sampa-sampalukan': ['sampasampalukan', 'chanca piedra', 'stonebreaker', 'stone breaker', 'kurukalunggay'],
  'alugbati': ['malabar spinach'],
  'dita': ['alstonia', 'white cheesewood'],
  'kabling': ['patchouli'],
  'sibukao': ['sappanwood', 'sapang', 'sibukaw'],
  'bignay': ['bugnay', 'antidesma'],
  'mansanilya': ['manzanilla', 'chrysanthemum'],
};

const herbNames = (herb: HerbQueryResult | CatalogHerb) => {
  const normLocal = normalize(herb.localName);
  const aliases = HERB_COMMON_ALIASES[normLocal] || [];
  return [
    herb.localName,
    herb.scientificName,
    ...('sourceScientificName' in herb ? [herb.sourceScientificName] : []),
    ...('cebuanoName' in herb ? [herb.cebuanoName] : []),
    ...aliases,
  ].filter((name): name is string => typeof name === 'string' && name.trim().length > 0).map(normalize);
};

const matchesHerbName = (normalizedText: string, herb: HerbQueryResult | CatalogHerb) =>
  herbNames(herb).some(name => name.length > 2 && new RegExp(`(^|[^a-z0-9])${name}(?=$|[^a-z0-9])`).test(normalizedText));

const NO_MATCH_CONTEXT = "No specific knowledge base or verified herb documents found matching this query in the database.";
const NO_MATCH_REPLY = "I could not find a verified Herbal-Ai source for this question. I cannot confirm treatment or cure claims without a documented record. Please consult a licensed health professional for medical decisions.";

export const getNoMatchReply = (question: string): string => {
  const lang = detectQuestionLanguage(question);
  if (lang === 'tl') {
    return "Hindi ako nakahanap ng beripikadong Herbal-Ai source para sa katanungang ito. Hindi ko makukumpirma ang impormasyon sa paggamot o lunas nang walang nakatalang rekord. Mangyaring kumonsulta sa isang lisensyadong propesyonal sa kalusugan para sa mga medikal na desisyon.";
  }
  if (lang === 'ceb') {
    return "Wala koy nakit-an nga kumpirmadong Herbal-Ai source alang niini nga pangutana. Dili nako makumpirma ang impormasyon sa pagtambal kung walay narekord nga dokumento. Palihug pakigkita sa usa ka lisensyadong propesyonal sa panglawas alang sa mga medikal nga desisyon.";
  }
  return NO_MATCH_REPLY;
};

const INTRODUCTION_REPLY = "Hi! I'm Dr. Ai, Herbal-Ai's AI assistant for Philippine medicinal-plant information. I can help you explore documented uses, preparation methods, and safety notes from the Herbal Library. Try asking, \"What are the documented uses of Lagundi?\" My answers are educational, not a diagnosis or prescription.";
const isIntroductionQuestion = (question: string) => {
  const message = question.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  return /^(?:hi|hey|hello|good morning|good afternoon|good evening|kumusta|kamusta)(?:[, ]+(?:there|dr\.?\s*ai|herbal[- ]ai))?[.!?]*$/iu.test(message)
    || /^(?:who are you|what (?:is your name|can you do)|introduce yourself|tell me about yourself|sino ka)[.!?]*$/iu.test(message);
};
export const withoutPediatricQuantities = (value: string) => value.split(/(?<=[.!?])\s+(?=[A-Z])|\r?\n/u)
  .map((sentence) => /\b(?:age-based|ages?\s+\d|children?\s+\d|\d+\s*(?:[-–]\s*\d+\s*)?(?:years?|yrs?)\b)/i.test(sentence)
    && /\d/.test(sentence)
    ? 'Age-specific ingredient quantities are recorded in the source but are not repeated here; consult a licensed clinician for pediatric use.'
    : sentence)
  .join(' ');
const RETRIEVAL_UNAVAILABLE_CONTEXT = "Herbal-Ai could not complete repository retrieval for this question.";
const RETRIEVAL_UNAVAILABLE_REPLY = "I could not check the Herbal-Ai sources right now, so I cannot verify this claim or recommend a treatment. Please try again later or browse the library directly. Consult a licensed health professional for medical decisions.";

export const getRetrievalUnavailableReply = (question: string): string => {
  const lang = detectQuestionLanguage(question);
  if (lang === 'tl') {
    return "Hindi ko masuri ang mga source ng Herbal-Ai sa ngayon, kaya hindi ko makukumpirma ang impormasyong ito o makapagrekomenda ng paggamot. Pakisubukan muli mamaya o bisitahin ang library. Kumonsulta sa isang lisensyadong propesyonal sa kalusugan para sa mga medikal na desisyon.";
  }
  if (lang === 'ceb') {
    return "Dili nako masusi ang mga tinubdan sa Herbal-Ai karon, busa dili nako makumpirma kining maong impormasyon o makarekomenda og pagtambal. Palihug sulayi pag-usab unya o tan-awa ang library. Pakigkita sa usa ka lisensyadong propesyonal sa panglawas alang sa mga medikal nga desisyon.";
  }
  return RETRIEVAL_UNAVAILABLE_REPLY;
};

const buildSourceFallback = (herbs: Array<CatalogHerb | HerbQueryResult>, entries: RetrievedKB[], pediatricRequest: boolean, question: string, history: Content[]) => {
  if (herbs.length === 0 && entries.length === 0) return getNoMatchReply(question);
  if (pediatricRequest) {
    const records = herbs.slice(0, 2).map(herb => {
      const references = 'sources' in herb ? [...new Set(herb.sources.map(source => source.title))].slice(0, 3) : [];
      return [
        `Library identity: ${herb.localName} (${herb.scientificName}).`,
        `Recorded references: ${references.length > 0 ? references.join('; ') : 'No reference titles are available in this retrieved record.'}`,
      ].join('\n');
    });
    const continuedChildContext = !isPediatricQuestion(question) && isPediatricRequest(question, history);
    return [
      continuedChildContext
        ? 'I understand you want more help. Your earlier question was about a child, so this follow-up still concerns child use.'
        : 'I can help you understand the library record, but a general preparation is not an individual assessment of whether it is suitable for your child.',
      'Dr. Ai cannot provide child-specific preparation or dosing guidance. A general recipe or an adult dose must not be treated as instructions for a child. Consult a licensed clinician before giving an herbal preparation to a child.',
      'What I can confirm from the retrieved library record:',
      ...records,
      'These references document the record; they do not establish that a preparation is appropriate for this child.',
      'I can help with botanical identity or explain which references are recorded, without supplying a recipe or dose. Open the cited Library entry to review its evidence and warnings with a licensed clinician.',
      'This is educational information, not medical advice.',
    ].join('\n\n');
  }

  if (isLinkOrLibraryQuestion(question) && herbs.length > 0) {
    const lang = detectQuestionLanguage(question);
    const links = herbs.slice(0, 2).map(herb => `- [${herb.localName}](/library?id=${herb.id}) (${herb.scientificName})`).join('\n');
    if (lang === 'ceb') {
      return [
        'Ania ang mga link sa atong Herbal Library alang sa gihisgotan nga mga tanom:',
        links,
        'I-klik ang link aron direkta nimong maablihan ang ilang library card ug makita ang kumpletong impormasyon, pag-andam, ug mga pahimangno.',
        'Pahinumdom: Impormasyong pang-edukasyon lamang kini, dili medikal nga reseta. Pakigkita sa usa ka lisensyadong propesyonal sa panglawas alang sa mga medikal nga desisyon.'
      ].join('\n\n');
    }
    if (lang === 'tl') {
      return [
        'Narito ang mga link sa ating Herbal Library para sa mga nabanggit na halaman:',
        links,
        'I-click ang link upang direktang mabuksan ang library card nito at mabasa ang kumpletong impormasyon, paghahanda, at mga babala.',
        'Paunawa: Pang-edukasyon lamang ang impormasyong ito, hindi medikal na reseta. Kumonsulta sa isang lisensyadong propesyonal sa kalusugan para sa mga medikal na desisyon.'
      ].join('\n\n');
    }
    return [
      'Here are the links to the Herbal Library for the discussed herbs:',
      links,
      'Click the link to open the herb\'s card in the Herbal Library and view complete details, preparation, and safety warnings.',
      'Educational information only. Consult a licensed clinician for medical decisions.'
    ].join('\n\n');
  }

  const herbRecords = herbs.slice(0, 2).map((herb) => [
    `${herb.localName} (${herb.scientificName})`,
    `Documented uses: ${herb.medicinalUses || 'Not documented in this record.'}`,
    `Preparation: ${withoutPediatricQuantities(herb.preparationMethod || 'Not documented in this record.')}`,
    'Recorded dosage: Consult the library record; Dr. Ai cannot synthesize a dose while generation is unavailable.',
    `Warnings: ${herb.warnings || 'Not documented; this does not establish safety.'}`,
  ].join('\n'));
  const faqRecords = entries.slice(0, 2).map((entry) =>
    `${entry.question || 'Library FAQ'}: ${withoutPediatricQuantities(entry.answer)}`
  );

  return [
    'Dr. Ai could not complete a generated answer. The fields below retain the library wording; translation and synthesis are unavailable right now.',
    ...herbRecords,
    ...faqRecords,
    'Educational information only. This is not a diagnosis or prescription; consult a licensed health professional for medical decisions.',
  ].join('\n\n');
};

const formatHerbContext = (herb: HerbQueryResult | CatalogHerb, index: number, question: string, pediatricRequest: boolean) =>
  `[Herb ${index + 1}] Repository record (reviewed content; not a claim of clinical proof):\n${JSON.stringify({
    id: herb.id,
    localName: herb.localName,
    scientificName: herb.scientificName,
    libraryUrl: `/library?id=${herb.id}`,
    medicinalUses: herb.medicinalUses,
    preparation: pediatricRequest ? 'Pediatric preparation instructions withheld; consult a licensed clinician.' : withoutPediatricQuantities(herb.preparationMethod || 'Not documented in this record.'),
    ...((isPreparationQuestion(question) || /\b(dose|dosage|amount|how much|frequency|how often)\b/i.test(question)) && !pediatricRequest
      ? { dosageField: withoutPediatricQuantities(herb.dosage || 'Not documented in this record.') }
      : {}),
    ...(isPreparationQuestion(question) ? {
      preparationReferenceCoverage: 'sources' in herb && herb.sources.some(source => source.supports?.includes('preparationMethod'))
        ? 'FIELD_SPECIFIC_REFERENCE_RECORDED; metadata is not proof of a complete or safe household recipe.'
        : 'NO_FIELD_SPECIFIC_REFERENCE; do not invent a citation or present this as a sourced complete household recipe.',
    } : {}),
    warnings: herb.warnings || 'Not documented; this does not establish safety.',
    ...('evidenceClass' in herb ? { evidenceClass: herb.evidenceClass } : {}),
    ...('sources' in herb ? { references: herb.sources } : {}),
  })}`;

interface RetrievedKB {
  id: string;
  question: string | null;
  answer: string;
  category: string | null;
  tags: string[];
  metadata: unknown;
  distance?: number;
}

const formatKBContext = (entries: RetrievedKB[]) => entries.map((entry, index) =>
  `[FAQ ${index + 1}] ${JSON.stringify({
    question: entry.question || 'Untitled Question',
    answer: withoutPediatricQuantities(entry.answer),
    category: entry.category,
    tags: entry.tags,
    sourceMetadata: entry.metadata,
  })}`
).join('\n\n');

async function prepareDrAiContext(question: string, history: Content[], pediatricRequest: boolean, options: AiRequestOptions): Promise<PreparedDrAiContext> {
  options.signal?.throwIfAborted();
  if (isIntroductionQuestion(question)) {
    return {
      context: '', fallbackReply: INTRODUCTION_REPLY, sources: [], embeddingMs: 0, retrievalMs: 0,
      herbSourceCount: 0, knowledgeBaseSourceCount: 0, bestDistance: 1,
    };
  }
  const catalogStartedAt = performance.now();
  const { herbs } = await awaitAiOperation(() => findAllHerbs(), options.signal);
  const catalog = herbs.filter(herb => herb.isVerified !== false && (herb.publicationStatus === undefined || herb.publicationStatus === 'PUBLISHED'));
  const normalizedQuestion = normalize(question);
  let namedHerbs = catalog.filter(herb => matchesHerbName(normalizedQuestion, herb)).slice(0, 2);

  if (namedHerbs.length === 0 && isContextFollowUp(question)) {
    const recentModelReplies = [...history].reverse()
      .filter(turn => turn.role === 'model')
      .map(turn => turn.parts.map(p => p.text ?? '').join(' '));

    for (const reply of recentModelReplies) {
      const sourcesMatch = reply.match(/(?:sources(?:\s+cited)?|mga\s+tinubdan|mga\s+sanggunian)\s*:\s*([^\n]+)/i);
      if (sourcesMatch && sourcesMatch[1]) {
        const citedText = normalize(sourcesMatch[1]);
        const citedHerbs = catalog.filter(herb => matchesHerbName(citedText, herb));
        if (citedHerbs.length > 0) {
          namedHerbs = citedHerbs.slice(0, 2);
          break;
        }
      }
      const mentionedHerbs = catalog.filter(herb => matchesHerbName(normalize(reply), herb));
      if (mentionedHerbs.length > 0) {
        namedHerbs = mentionedHerbs.slice(0, 2);
        break;
      }
    }

    if (namedHerbs.length === 0) {
      for (const previousQuestion of userQuestionsNewestFirst(history)) {
        const previousHerbs = catalog.filter(herb => matchesHerbName(normalize(previousQuestion), herb));
        if (previousHerbs.length > 0) {
          namedHerbs = previousHerbs.slice(0, 2);
          break;
        }
        const prevCondition = HEALTH_CONDITION_DISCOVERIES.find(d => d.queryKeywords.test(normalize(previousQuestion)));
        if (prevCondition) {
          namedHerbs = catalog.filter(herb => meaningfulTokens(herb.medicinalUses).has(prevCondition.targetCondition)).slice(0, 2);
          if (namedHerbs.length > 0) break;
        }
        if (!isContextFollowUp(previousQuestion)) break;
      }
    }
  }

  let conditionDiscovery: HealthConditionDiscovery | undefined;
  if (namedHerbs.length === 0) {
    const active = HEALTH_CONDITION_DISCOVERIES.find(d => d.queryKeywords.test(normalizedQuestion));
    if (active) {
      const tokens = meaningfulTokens(question);
      const nonConditionTokens = [...tokens].filter(token => !active.queryKeywords.test(token));
      if (nonConditionTokens.length === 0) {
        conditionDiscovery = active;
      }
    }
  }

  const matchedHerbs = conditionDiscovery
    ? catalog.filter(herb => meaningfulTokens(herb.medicinalUses).has(conditionDiscovery.targetCondition)).slice(0, 2)
    : namedHerbs;

  if (matchedHerbs.length > 0) {
    const exactTerms = [...new Set(matchedHerbs.flatMap(herb => [
      ...herbNames(herb),
      ...normalize(herb.localName).split(' '),
    ]))];
    const namedKnowledge = pediatricRequest ? [] : await awaitAiOperation(() => findActiveKBByTerms(exactTerms, 3), options.signal);
    const context = [
      conditionDiscovery ? conditionDiscovery.instruction : '',
      isLinkOrLibraryQuestion(question)
        ? 'Link request: The user is requesting a link, URL, or library card to view/read about the herb in Herbal-Ai. Provide clickable Markdown links formatted as `[<LocalName>](/library?id=<id>)`. Answer in the user\'s language (e.g. Cebuano/Bisaya) and invite them to click the link to open the herb\'s card in the library.'
        : '',
      matchedHerbs.map((herb, index) => formatHerbContext(herb, index, question, pediatricRequest)).join("\n\n"),
      namedKnowledge.length > 0 && !pediatricRequest ? `General Knowledge Base / FAQs:\n${formatKBContext(namedKnowledge)}` : '',
    ].filter(Boolean).join('\n\n');
    return {
      context,
      fallbackReply: buildSourceFallback(matchedHerbs, namedKnowledge, pediatricRequest, question, history),
      sources: [
        ...matchedHerbs.map((herb) => ({ type: "herb" as const, title: herb.localName, distance: 0 })),
        ...namedKnowledge.map((entry) => ({ type: "kb" as const, title: entry.question, distance: 0 })),
      ],
      embeddingMs: 0,
      retrievalMs: performance.now() - catalogStartedAt,
      herbSourceCount: matchedHerbs.length,
      knowledgeBaseSourceCount: namedKnowledge.length,
      bestDistance: 0,
    };
  }

  const embeddingStartedAt = performance.now();
  let embedding: number[];
  try {
    embedding = await awaitAiOperation(() => generateEmbedding(question, options), options.signal);
  } catch {
    options.signal?.throwIfAborted();
    console.warn('Dr. Ai embedding unavailable; repository retrieval could not finish.');
    return {
      context: RETRIEVAL_UNAVAILABLE_CONTEXT,
      fallbackReply: getRetrievalUnavailableReply(question),
      sources: [],
      embeddingMs: performance.now() - embeddingStartedAt,
      retrievalMs: 0,
      herbSourceCount: 0,
      knowledgeBaseSourceCount: 0,
      bestDistance: 1,
    };
  }
  const embeddingMs = performance.now() - embeddingStartedAt;
  const vectorStr = `[${embedding.join(",")}]`;

  const retrievalStartedAt = performance.now();
  const [rawKB, rawHerbs] = await awaitAiOperation(() => Promise.all([
    pediatricRequest ? Promise.resolve([]) : searchSimilarKB(vectorStr, 3),
    searchSimilarHerbs(vectorStr, 3)
  ]), options.signal);
  const retrievalMs = performance.now() - retrievalStartedAt;

  const explicitlyNamedHerbs = rawHerbs.filter(herb => matchesHerbName(normalizedQuestion, herb));

  const closeKB = selectCloseMatches(rawKB, 2);
  const kbWithScores = closeKB.map((entry) => ({
    entry,
    lexicalScore: lexicalOverlap(question, `${entry.question ?? ""} ${entry.answer}`),
  }));
  const strongestKBScore = Math.max(0, ...kbWithScores.map(({ lexicalScore }) => lexicalScore));
  const relevantKB = kbWithScores
    .filter(({ lexicalScore }) =>
      strongestKBScore >= 0.2 && lexicalScore >= Math.max(0.2, strongestKBScore - 0.15)
    )
    .map(({ entry }) => entry);
  const hasStrongKBMatch = strongestKBScore >= 0.3;

  const semanticallyCloseHerbs = selectCloseMatches(rawHerbs, 2).filter((herb) => {
    const herbText = `${herb.localName} ${herb.scientificName} ${herb.medicinalUses} ${herb.preparationMethod ?? ""} ${herb.warnings ?? ""}`;
    const overlap = lexicalOverlap(question, herbText);
    const hasConceptMatch = HEALTH_CONCEPTS.some(c => c.pattern.test(normalizedQuestion) && c.pattern.test(herbText));
    return overlap >= 0.15 || hasConceptMatch;
  });

  const relevantHerbs = explicitlyNamedHerbs.length > 0
    ? explicitlyNamedHerbs.slice(0, 2)
    : (hasStrongKBMatch && semanticallyCloseHerbs.every(h => Number(h.distance) > 0.25))
      ? []
      : semanticallyCloseHerbs;

  const contextualHerbs = relevantHerbs.map((herb) => catalog.find((entry) => entry.id === herb.id) ?? herb);
  let context = "";
  if (relevantHerbs.length > 0) {
    if (isLinkOrLibraryQuestion(question)) {
      context += "Link request: The user is requesting a link, URL, or library card to view/read about the herb in Herbal-Ai. Provide clickable Markdown links formatted as `[<LocalName>](/library?id=<id>)`. Answer in the user's language (e.g. Cebuano/Bisaya) and invite them to click the link to open the herb's card in the library.\n\n";
    }
    context += contextualHerbs.map((herb, index) =>
      formatHerbContext(herb, index, question, pediatricRequest)
    ).join("\n\n") + "\n\n";
  }
  if (relevantKB.length > 0 && !pediatricRequest) {
    context += `General Knowledge Base / FAQs:\n${formatKBContext(relevantKB)}\n\n`;
  }
  if (!context) context = NO_MATCH_CONTEXT;

  const sources: DrAiSource[] = [
    ...relevantHerbs.map((h: HerbQueryResult) => ({ type: "herb" as const, title: h.localName, distance: h.distance })),
    ...(!pediatricRequest ? relevantKB.map((k: KBQueryResult) => ({ type: "kb" as const, title: k.question || "FAQ Source", distance: k.distance })) : []),
  ];

  return {
    context,
    fallbackReply: buildSourceFallback(contextualHerbs, relevantKB, pediatricRequest, question, history),
    sources,
    embeddingMs,
    retrievalMs,
    herbSourceCount: relevantHerbs.length,
    knowledgeBaseSourceCount: pediatricRequest ? 0 : relevantKB.length,
    bestDistance: Math.min(...sources.map((source) => Number(source.distance)), 1),
  };
}

const logMetrics = (question: string, prepared: PreparedDrAiContext, metrics: DrAiTimingMetrics) => {
  console.info(JSON.stringify({
    event: "dr_ai_request",
    ...metrics,
    questionLength: question.length,
    herbSources: prepared.herbSourceCount,
    knowledgeBaseSources: prepared.knowledgeBaseSourceCount,
    bestDistance: prepared.bestDistance,
  }));
};

export async function AskAIService(question: string, history: Content[] = [], options: AiRequestOptions = {}) {
  const totalStartedAt = performance.now();
  try {
    const pediatricRequest = isPediatricRequest(question, history);
    const prepared = await prepareDrAiContext(question, history, pediatricRequest, options);
    const generationStartedAt = performance.now();
    let answer = prepared.fallbackReply;
    if (prepared.sources.length > 0 && !pediatricRequest) {
      try {
        const generated = await awaitAiOperation(() => generateChatResponse(question, prepared.context, history, options), options.signal);
        if (generated.trim()) answer = generated;
      } catch {
        options.signal?.throwIfAborted();
        console.warn('Dr. Ai generation unavailable; using retrieved records.');
      }
    }
    const generationMs = performance.now() - generationStartedAt;
    const metrics: DrAiTimingMetrics = {
      embeddingMs: Number(prepared.embeddingMs.toFixed(1)),
      retrievalMs: Number(prepared.retrievalMs.toFixed(1)),
      generationMs: Number(generationMs.toFixed(1)),
      totalMs: Number((performance.now() - totalStartedAt).toFixed(1)),
    };
    logMetrics(question, prepared, metrics);

    return {
      code: 200,
      status: "success",
      data: {
        answer,
        sources: prepared.sources,
        metrics,
      },
    };
  } catch (error) {
    options.signal?.throwIfAborted();
    console.error("AskAIService Error:", error);
    return { code: 500, status: "error", message: "Dr. Ai assistant is currently unavailable." };
  }
}

export async function createDrAiStream(question: string, history: Content[] = [], options: AiRequestOptions = {}) {
  const totalStartedAt = performance.now();
  const pediatricRequest = isPediatricRequest(question, history);
  const prepared = await prepareDrAiContext(question, history, pediatricRequest, options);
  const generationStartedAt = performance.now();
  let firstChunkMs: number | undefined;
  let reply = "";

  const chunks = async function* () {
    options.signal?.throwIfAborted();
    if (prepared.sources.length === 0 || pediatricRequest) {
      firstChunkMs = performance.now() - generationStartedAt;
      reply = prepared.fallbackReply;
      yield reply;
      return;
    }
    try {
      for await (const text of iterateAiOperation(generateChatResponseStream(question, prepared.context, history, options), options.signal)) {
        if (!reply && !text.trim()) continue;
        firstChunkMs ??= performance.now() - generationStartedAt;
        reply += text;
        yield text;
      }
    } catch {
      options.signal?.throwIfAborted();
      if (reply.trim()) throw new Error('Dr. Ai stream ended before completion.');
      console.warn('Dr. Ai streaming unavailable; using retrieved records.');
    }
    if (!reply.trim()) {
      firstChunkMs ??= performance.now() - generationStartedAt;
      reply = prepared.fallbackReply;
      yield reply;
    }
  };

  const getResult = () => {
    const generationMs = performance.now() - generationStartedAt;
    const metrics: DrAiTimingMetrics & { firstChunkMs: number } = {
      embeddingMs: Number(prepared.embeddingMs.toFixed(1)),
      retrievalMs: Number(prepared.retrievalMs.toFixed(1)),
      generationMs: Number(generationMs.toFixed(1)),
      totalMs: Number((performance.now() - totalStartedAt).toFixed(1)),
      firstChunkMs: Number((firstChunkMs ?? generationMs).toFixed(1)),
    };
    logMetrics(question, prepared, metrics);
    return { reply, sources: prepared.sources, metrics };
  };

  return { chunks: chunks(), sources: prepared.sources, getResult };
}
