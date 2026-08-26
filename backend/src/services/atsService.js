/**
 * Calculates a deterministic ATS score (0 - 100) based on skill matching.
 * @param {string} resumeText - Full text of the candidate's resume.
 * @param {object} job - Job instance or object containing skills array.
 * @returns {number} Integer score between 0 and 100.
 */
function calculateATS(resumeText, job) {
  if (!job || !Array.isArray(job.skills) || job.skills.length === 0) {
    return 100;
  }

  const text = (resumeText || '').toLowerCase();
  const skills = job.skills.map((s) => (s || '').toString().toLowerCase()).filter(Boolean);

  if (skills.length === 0) {
    return 100;
  }

  let matchedCount = 0;
  for (const skill of skills) {
    if (text.includes(skill)) {
      matchedCount++;
    }
  }

  const score = Math.round((matchedCount / skills.length) * 100);
  return Math.min(100, Math.max(0, score));
}

module.exports = {
  calculateATS,
};
