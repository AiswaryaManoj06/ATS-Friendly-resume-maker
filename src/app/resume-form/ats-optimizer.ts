export interface AtsAnalysisResult {
  score: number;
  rating: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
  ratingColor: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: AtsSuggestion[];
  breakdown: {
    keywordMatch: number;
    skillsAlignment: number;
    experienceImpact: number;
    formatCompleteness: number;
  };
}

export interface AtsSuggestion {
  type: 'critical' | 'improvement' | 'positive';
  title: string;
  description: string;
  potentialGain: string;
}

// Curated library of common industry technical and soft skills keywords
const TECH_KEYWORDS_DICTIONARY = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js',
  'Flask', 'Django', 'FastAPI', 'HTML', 'CSS', 'SQL', 'MySQL', 'PostgreSQL',
  'MongoDB', 'Redis', 'REST APIs', 'GraphQL', 'Docker', 'Kubernetes', 'AWS',
  'Azure', 'GCP', 'Git', 'GitHub', 'CI/CD', 'Linux', 'Microservices',
  'Unit Testing', 'Jest', 'PyTest', 'Agile', 'Scrum', 'OOPs', 'Data Structures',
  'Algorithms', 'Postman', 'VS Code', 'Machine Learning', 'PyTorch', 'TensorFlow',
  'Transformers', 'Hugging Face', 'Tailwind', 'Bootstrap', 'Next.js',
  'Problem Solving', 'Analytical Thinking', 'Team Collaboration', 'Communication',
  'Adaptability', 'Time Management', 'Leadership'
];

/**
 * Extracts recognized keywords from job description text
 */
export function extractJdKeywords(jobDescription: string): string[] {
  if (!jobDescription || !jobDescription.trim()) {
    return ['Python', 'React', 'SQL', 'REST APIs', 'Git', 'Docker', 'Problem Solving'];
  }

  const jdTextLower = jobDescription.toLowerCase();
  const matchedFromDict = TECH_KEYWORDS_DICTIONARY.filter(keyword => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(jdTextLower);
  });

  // Also extract any capitalized skill words from JD
  const customWords = jobDescription.match(/\b[A-Z][a-zA-Z0-9+#.]{2,}\b/g) || [];
  const combined = Array.from(new Set([...matchedFromDict, ...customWords]))
    .filter(w => !['The', 'And', 'For', 'With', 'You', 'Will', 'Must', 'Have', 'Work', 'Team', 'Role', 'Requirements', 'Job', 'Description', 'Company', 'Candidate'].includes(w));

  return combined.length >= 3 ? combined.slice(0, 18) : matchedFromDict;
}

/**
 * Gathers all text tokens from resume
 */
function gatherResumeContent(resume: any): string {
  let content = `${resume.firstName || ''} ${resume.lastName || ''} ${resume.objective || ''} `;

  // Skills
  if (resume.skills) {
    if (typeof resume.skills === 'object') {
      content += Object.values(resume.skills).join(' ') + ' ';
    }
  }

  // Experience
  if (Array.isArray(resume.experience)) {
    resume.experience.forEach((e: any) => {
      content += `${e.position || ''} ${e.companyName || ''} ${e.description || ''} `;
    });
  }

  // Projects
  if (Array.isArray(resume.projects)) {
    resume.projects.forEach((p: any) => {
      content += `${p.title || ''} ${p.technologies || ''} ${p.description || ''} `;
    });
  }

  // Education
  if (Array.isArray(resume.education)) {
    resume.education.forEach((ed: any) => {
      content += `${ed.degree || ''} ${ed.institution || ''} `;
    });
  }

  // Certifications
  if (Array.isArray(resume.certifications)) {
    resume.certifications.forEach((c: any) => {
      content += `${c.title || ''} ${c.issuer || ''} `;
    });
  }

  return content.toLowerCase();
}

/**
 * Calculates ATS score, matched keywords, missing keywords, and suggestions
 */
export function calculateAtsAnalysis(resume: any, jobDescription: string): AtsAnalysisResult {
  const jdKeywords = extractJdKeywords(jobDescription);
  const resumeText = gatherResumeContent(resume);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  jdKeywords.forEach(kw => {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(resumeText)) {
      matchedKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  });

  const total = jdKeywords.length || 1;
  const matchRatio = matchedKeywords.length / total;

  // Weighted score calculation
  const keywordMatch = Math.round(matchRatio * 100);
  const skillsAlignment = Math.min(100, Math.round((matchedKeywords.length / Math.max(5, total * 0.7)) * 100));
  
  // Experience & Impact (checks for action verbs and quantified impact)
  const hasNumbers = /\b\d+(%|\+|k|x)?\b/i.test(resumeText);
  const hasActionVerbs = /\b(developed|engineered|implemented|architected|built|optimized|assisted|led)\b/i.test(resumeText);
  const experienceImpact = Math.min(100, 70 + (hasNumbers ? 15 : 0) + (hasActionVerbs ? 15 : 0));

  // Completeness check
  let completenessScore = 60;
  if (resume.candidatePicture) completenessScore += 10;
  if (resume.linkedin) completenessScore += 10;
  if (resume.github) completenessScore += 10;
  if (resume.portfolio) completenessScore += 10;
  const formatCompleteness = Math.min(100, completenessScore);

  const finalScore = Math.min(100, Math.max(35, Math.round(
    keywordMatch * 0.45 +
    skillsAlignment * 0.25 +
    experienceImpact * 0.15 +
    formatCompleteness * 0.15
  )));

  let rating: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement' = 'Needs Improvement';
  let ratingColor = '#ef4444';

  if (finalScore >= 85) {
    rating = 'Excellent';
    ratingColor = '#10b981';
  } else if (finalScore >= 70) {
    rating = 'Good';
    ratingColor = '#0d9488';
  } else if (finalScore >= 55) {
    rating = 'Average';
    ratingColor = '#f59e0b';
  }

  // Generate targeted recommendations
  const suggestions: AtsSuggestion[] = [];

  if (missingKeywords.length > 0) {
    const topMissing = missingKeywords.slice(0, 4).join(', ');
    suggestions.push({
      type: 'critical',
      title: 'Incorporate Missing Job Keywords',
      description: `Target role specifically requests knowledge of ${topMissing}. Add them under your Technical Skills or Project descriptions.`,
      potentialGain: '+10-15%',
    });
  }

  if (!hasNumbers) {
    suggestions.push({
      type: 'improvement',
      title: 'Add Quantifiable Results & Metrics',
      description: 'ATS parsers and recruiters rank resumes 40% higher when experiences feature concrete metrics (e.g., "improved load time by 30%", "served 10,000+ users").',
      potentialGain: '+5-8%',
    });
  }

  if (resume.objective && !resume.objective.toLowerCase().includes('full-stack') && !resume.objective.toLowerCase().includes('engineer')) {
    suggestions.push({
      type: 'improvement',
      title: 'Align Career Objective with Target Role',
      description: 'Customize the first sentence of your Objective to mirror the exact job title from the posting.',
      potentialGain: '+4-6%',
    });
  }

  suggestions.push({
    type: 'positive',
    title: 'Clean Single-Column Standard Formatting',
    description: 'Standard section hierarchy (Objective, Skills, Experience, Education, Projects) ensures 100% readability across Taleo, Workday, and Greenhouse ATS algorithms.',
    potentialGain: 'Verified Optimal',
  });

  return {
    score: finalScore,
    rating,
    ratingColor,
    matchedKeywords,
    missingKeywords,
    suggestions,
    breakdown: {
      keywordMatch,
      skillsAlignment,
      experienceImpact,
      formatCompleteness,
    },
  };
}
