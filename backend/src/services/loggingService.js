const { Logging } = require('@google-cloud/logging');

const projectId = process.env.GCP_PROJECT_ID || 'hrie-506616';
const logging = new Logging({ projectId });

/**
 * Helper to safely extract log message content.
 */
function extractMessage(entry) {
  if (typeof entry.data === 'string') {
    return entry.data;
  }
  if (entry.metadata && entry.metadata.textPayload) {
    return entry.metadata.textPayload;
  }
  if (entry.data && typeof entry.data === 'object') {
    if (entry.data.message) return entry.data.message;
    if (entry.data.log) return entry.data.log;
    try {
      return JSON.stringify(entry.data);
    } catch (e) {
      return String(entry.data);
    }
  }
  if (entry.metadata && entry.metadata.jsonPayload) {
    const jp = entry.metadata.jsonPayload;
    if (typeof jp === 'string') return jp;
    if (jp.message) return jp.message;
    try {
      return JSON.stringify(jp);
    } catch (e) {
      return String(jp);
    }
  }
  return 'No log content available';
}

/**
 * Fetches recent Cloud Run log entries for backend and frontend services.
 * @param {number} limit - Maximum number of entries to return (default 50)
 * @returns {Promise<Array<{ timestamp: string, severity: string, service: string, message: string }>>}
 */
const getRecentLogs = async (limit = 50) => {
  try {
    const filter = `resource.type="cloud_run_revision" AND (resource.labels.service_name="hirehub-backend" OR resource.labels.service_name="hirehub-frontend")`;
    const [entries] = await logging.getEntries({
      filter,
      pageSize: limit,
      orderBy: 'timestamp desc',
    });

    return (entries || []).map((entry) => {
      const timestamp = entry.metadata?.timestamp
        ? (typeof entry.metadata.timestamp === 'string' ? entry.metadata.timestamp : entry.metadata.timestamp.toISOString?.() || String(entry.metadata.timestamp))
        : new Date().toISOString();

      const severity = entry.metadata?.severity || 'DEFAULT';
      const service = entry.metadata?.resource?.labels?.service_name || entry.resource?.labels?.service_name || 'hirehub-backend';
      const message = extractMessage(entry);

      return {
        timestamp,
        severity,
        service,
        message,
      };
    });
  } catch (error) {
    console.error('[LoggingService] Error fetching Cloud Logging entries:', error.message || error);
    return [];
  }
};

/**
 * Returns platform health metrics based on recent ERROR level logs in the last hour.
 * @returns {Promise<{ errorCount: number, lastErrorTimestamp: string|null }>}
 */
const getPlatformHealth = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const filter = `resource.type="cloud_run_revision" AND (resource.labels.service_name="hirehub-backend" OR resource.labels.service_name="hirehub-frontend") AND severity>=ERROR AND timestamp >= "${oneHourAgo}"`;

    const [entries] = await logging.getEntries({
      filter,
      pageSize: 100,
      orderBy: 'timestamp desc',
    });

    const errorCount = entries ? entries.length : 0;
    let lastErrorTimestamp = null;
    if (entries && entries.length > 0) {
      const latest = entries[0];
      lastErrorTimestamp = latest.metadata?.timestamp
        ? (typeof latest.metadata.timestamp === 'string' ? latest.metadata.timestamp : latest.metadata.timestamp.toISOString?.() || String(latest.metadata.timestamp))
        : null;
    }

    return { errorCount, lastErrorTimestamp };
  } catch (error) {
    console.error('[LoggingService] Error fetching platform health logs:', error.message || error);
    return { errorCount: 0, lastErrorTimestamp: null };
  }
};

module.exports = {
  getRecentLogs,
  getPlatformHealth,
};
