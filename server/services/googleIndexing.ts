import { createSign } from "crypto";
import { type Job } from "@shared/schema";
import { getJobCanonicalUrl, isGoogleIndexableJob } from "../utils/googleJobs";

type IndexingNotificationType = "URL_UPDATED" | "URL_DELETED";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

type IndexingResult = {
  url: string;
  type: IndexingNotificationType;
  ok: boolean;
  status?: number;
  message?: string;
  submittedAt: string;
};

const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PUBLISH_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const MAX_LOG_ENTRIES = 200;

const base64Url = (input: string | Buffer): string =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

class GoogleIndexingService {
  private credentials: ServiceAccountCredentials | null | undefined;
  private accessToken: { value: string; expiresAt: number } | null = null;
  private logs: IndexingResult[] = [];
  private warnedMissingCredentials = false;

  isConfigured(): boolean {
    return !!this.getCredentials();
  }

  getRecentResults(): IndexingResult[] {
    return [...this.logs];
  }

  async notifyJobUpdated(job: Job): Promise<IndexingResult | null> {
    const type: IndexingNotificationType = isGoogleIndexableJob(job) ? "URL_UPDATED" : "URL_DELETED";
    return this.publish(getJobCanonicalUrl(job), type);
  }

  async notifyJobDeleted(job: Pick<Job, "id" | "title">): Promise<IndexingResult | null> {
    return this.publish(getJobCanonicalUrl(job), "URL_DELETED");
  }

  async submitLatestJobs(jobs: Job[], limit = 100): Promise<IndexingResult[]> {
    const activeJobs = jobs
      .filter(isGoogleIndexableJob)
      .slice(0, Math.min(Math.max(limit, 1), 100));

    const results: IndexingResult[] = [];
    for (const job of activeJobs) {
      const result = await this.publish(getJobCanonicalUrl(job), "URL_UPDATED");
      if (result) results.push(result);
    }
    return results;
  }

  async publish(url: string, type: IndexingNotificationType): Promise<IndexingResult | null> {
    const credentials = this.getCredentials();
    if (!credentials) {
      if (!this.warnedMissingCredentials) {
        console.warn("Google Indexing API is disabled: set GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON to enable submissions.");
        this.warnedMissingCredentials = true;
      }
      return null;
    }

    try {
      const token = await this.getAccessToken(credentials);
      const response = await fetch(PUBLISH_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, type }),
      });

      const text = await response.text();
      const result: IndexingResult = {
        url,
        type,
        ok: response.ok,
        status: response.status,
        message: response.ok ? "submitted" : text,
        submittedAt: new Date().toISOString(),
      };
      this.record(result);
      return result;
    } catch (error) {
      const result: IndexingResult = {
        url,
        type,
        ok: false,
        message: error instanceof Error ? error.message : String(error),
        submittedAt: new Date().toISOString(),
      };
      this.record(result);
      return result;
    }
  }

  private record(result: IndexingResult): void {
    this.logs.unshift(result);
    this.logs = this.logs.slice(0, MAX_LOG_ENTRIES);
    const status = result.ok ? "submitted" : "failed";
    console.log(`Google Indexing ${status}: ${result.type} ${result.url}${result.status ? ` (${result.status})` : ""}`);
    if (!result.ok && result.message) {
      console.warn(`Google Indexing error: ${result.message.slice(0, 500)}`);
    }
  }

  private getCredentials(): ServiceAccountCredentials | null {
    if (this.credentials !== undefined) return this.credentials;

    const raw = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON;
    if (!raw) {
      this.credentials = null;
      return null;
    }

    try {
      const json = raw.trim().startsWith("{")
        ? raw
        : Buffer.from(raw, "base64").toString("utf8");
      const parsed = JSON.parse(json) as ServiceAccountCredentials;
      if (!parsed.client_email || !parsed.private_key) {
        throw new Error("missing client_email or private_key");
      }
      this.credentials = {
        client_email: parsed.client_email,
        private_key: parsed.private_key.replace(/\\n/g, "\n"),
      };
      return this.credentials;
    } catch (error) {
      console.error("Invalid GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON:", error);
      this.credentials = null;
      return null;
    }
  }

  private async getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.accessToken && this.accessToken.expiresAt - 60 > now) {
      return this.accessToken.value;
    }

    const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claimSet = base64Url(JSON.stringify({
      iss: credentials.client_email,
      scope: INDEXING_SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now,
    }));
    const unsignedJwt = `${header}.${claimSet}`;
    const signature = createSign("RSA-SHA256")
      .update(unsignedJwt)
      .sign(credentials.private_key);
    const assertion = `${unsignedJwt}.${base64Url(signature)}`;

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token request failed (${response.status}): ${await response.text()}`);
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    this.accessToken = {
      value: data.access_token,
      expiresAt: now + data.expires_in,
    };
    return data.access_token;
  }
}

export const googleIndexing = new GoogleIndexingService();
