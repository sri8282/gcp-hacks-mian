const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Analyzes resume match against a job description and required skills using Gemini AI.
 * @param {string} resumeText - Text content of the candidate's resume/profile
 * @param {string} jobDescription - Full text of the job description
 * @param {Array<string>|string} jobSkills - List of required skills for the job
 * @returns {Promise<{ matchScore: number, strengths: string[], gaps: string[], summary: string }>}
 */
async function analyzeResumeMatch(resumeText, jobDescription, jobSkills) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing or empty');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const skillsText = Array.isArray(jobSkills) ? jobSkills.join(', ') : (jobSkills || '');
  const prompt = `You are an expert HR Applicant Tracking System (ATS) AI evaluator.
Analyze how well the candidate's resume / profile aligns with the target job description and required skills.

Job Description:
${jobDescription || 'N/A'}

Required Skills:
${skillsText || 'N/A'}

Candidate Resume / Profile Info:
${resumeText || 'N/A'}

Produce a strict JSON response with NO extra text or markdown wrappers outside the JSON object.
Required JSON schema:
{
  "matchScore": <number between 0 and 100 representing overall percentage match>,
  "strengths": [<2 to 4 bullet points highlighting candidate's top matching skills & background>],
  "gaps": [<2 to 4 bullet points highlighting missing skills, experience gaps, or development areas>],
  "summary": "<1 to 2 concise sentences summarizing the overall alignment of the candidate for this position>"
}`;

  const result = await model.generateContent(prompt);
  const responseText = await result.response.text();

  if (!responseText) {
    throw new Error('Empty response returned from Gemini API');
  }

  // Strip markdown code block wrappers if present (e.g. ```json ... ```)
  let cleanText = responseText.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  const parsed = JSON.parse(cleanText);

  // Normalize response fields
  const matchScore = typeof parsed.matchScore === 'number'
    ? Math.min(100, Math.max(0, Math.round(parsed.matchScore)))
    : 75;

  const strengths = Array.isArray(parsed.strengths)
    ? parsed.strengths.filter((s) => typeof s === 'string' && s.trim().length > 0)
    : [];

  const gaps = Array.isArray(parsed.gaps)
    ? parsed.gaps.filter((g) => typeof g === 'string' && g.trim().length > 0)
    : [];

  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';

  return {
    matchScore,
    strengths,
    gaps,
    summary,
  };
}

module.exports = {
  analyzeResumeMatch,
};
