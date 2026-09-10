/**
 * Calculates a deterministic ATS score (0 - 100) based on skill matching.
 * @param {string} resumeText - Full text of the candidate's resume.
 * @param {object} job - Job instance or object containing skills array.
 * @returns {number} Integer score between 0 and 100.
 */
function calculateATS(resumeText, job) {
  const text = (resumeText || '').toLowerCase().trim();
  if (!text) {
    return 0;
  }

  let skills = [];
  if (job && Array.isArray(job.skills) && job.skills.length > 0) {
    skills = job.skills.map((s) => (s || '').toString().toLowerCase().trim()).filter(Boolean);
  }

  const descText = (job && (job.jobDescription || job.description) ? job.jobDescription || job.description : '').toLowerCase();
  
  if (skills.length === 0 && descText) {
    const commonKeywords = ['react', 'node', 'javascript', 'typescript', 'python', 'java', 'sql', 'aws', 'docker', 'kubernetes', 'html', 'css', 'git', 'api', 'graphql', 'mongodb', 'postgresql', 'c++', 'go'];
    skills = commonKeywords.filter((kw) => descText.includes(kw));
  }

  if (skills.length === 0) {
    return 45;
  }

  let matchedSkillsCount = 0;
  for (const skill of skills) {
    if (text.includes(skill)) {
      matchedSkillsCount++;
    }
  }

  const skillScore = (matchedSkillsCount / skills.length) * 70;

  // Additional 30% weight for job description key terms present in resume
  const descWords = Array.from(new Set(descText.split(/\W+/).filter((w) => w.length > 4)));
  let matchedDescWords = 0;
  if (descWords.length > 0) {
    for (const word of descWords.slice(0, 20)) {
      if (text.includes(word)) {
        matchedDescWords++;
      }
    }
  }

  const descScore = descWords.length > 0 ? (matchedDescWords / Math.min(20, descWords.length)) * 30 : 15;
  const totalScore = Math.round(skillScore + descScore);

  return Math.min(100, Math.max(0, totalScore));
}

module.exports = {
  calculateATS,
};
