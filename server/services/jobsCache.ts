import crypto from "crypto";
import { LightweightJob } from "@shared/schema";

interface CacheEntry {
  data: LightweightJob[];
  timestamp: number;
  etag: string;
}

interface CacheStats {
  totalJobs: number;
  organizations: number;
  newToday: number;
}

interface QueryFilters {
  country?: string[];
  sector?: string[];
  search?: string;
  limit?: number;
}

/**
 * High-performance jobs cache with ETag support
 * Provides sub-100ms response times for job listings
 */
export class JobsCache {
  private cache = new Map<string, CacheEntry>();
  private statsCache: { data: CacheStats; timestamp: number; etag: string } | null = null;
  private jobsVersion = Date.now(); // Global version tracking
  private readonly TTL = 45000; // 45 seconds TTL
  
  /**
   * Get current jobs version for ETag generation
   */
  getJobsVersion(): number {
    return this.jobsVersion;
  }

  /**
   * Invalidate cache when jobs data changes
   * Called on job insert/update/delete operations
   */
  invalidateCache(): void {
    this.jobsVersion = Date.now();
    this.cache.clear();
    this.statsCache = null;
    console.log('Jobs cache invalidated, new version:', this.jobsVersion);
  }

  /**
   * Generate normalized cache key from query parameters
   */
  private generateCacheKey(filters: QueryFilters): string {
    const normalizedFilters = {
      country: filters.country?.sort() || [],
      sector: filters.sector?.sort() || [],
      search: filters.search || "",
      limit: filters.limit || 0
    };
    return JSON.stringify(normalizedFilters);
  }

  /**
   * Generate ETag from jobs version and query parameters
   */
  generateETag(filters: QueryFilters): string {
    const cacheKey = this.generateCacheKey(filters);
    const content = `${this.jobsVersion}:${cacheKey}`;
    return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
  }

  /**
   * Get cached jobs data or return null if not found/expired
   */
  getCachedJobs(filters: QueryFilters): CacheEntry | null {
    const cacheKey = this.generateCacheKey(filters);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry;
  }

  /**
   * Cache jobs data with generated ETag
   */
  setCachedJobs(filters: QueryFilters, jobs: LightweightJob[]): CacheEntry {
    const cacheKey = this.generateCacheKey(filters);
    const etag = this.generateETag(filters);
    
    const entry: CacheEntry = {
      data: jobs,
      timestamp: Date.now(),
      etag
    };

    this.cache.set(cacheKey, entry);
    
    // Cleanup old entries periodically (simple LRU-like behavior)
    if (this.cache.size > 100) {
      const oldestKeys = Array.from(this.cache.keys()).slice(0, 20);
      oldestKeys.forEach(key => this.cache.delete(key));
    }

    return entry;
  }

  /**
   * Get cached stats or return null if not found/expired
   */
  getCachedStats(): { data: CacheStats; etag: string } | null {
    if (!this.statsCache) {
      return null;
    }

    // Check if stats cache has expired
    if (Date.now() - this.statsCache.timestamp > this.TTL) {
      this.statsCache = null;
      return null;
    }

    return {
      data: this.statsCache.data,
      etag: this.statsCache.etag
    };
  }

  /**
   * Cache stats data
   */
  setCachedStats(stats: CacheStats): { data: CacheStats; etag: string } {
    const etag = `"stats-${crypto.createHash('md5').update(`${this.jobsVersion}:stats`).digest('hex')}"`;
    
    this.statsCache = {
      data: stats,
      timestamp: Date.now(),
      etag
    };

    return {
      data: stats,
      etag
    };
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      jobsVersion: this.jobsVersion,
      hasStatsCache: !!this.statsCache
    };
  }

  /**
   * Pre-warm cache with common queries
   * Called during background job fetching
   */
  preWarmCache(allJobs: LightweightJob[]): void {
    // Pre-warm most common queries
    const commonQueries: QueryFilters[] = [
      {}, // All jobs
      { country: ['Kenya'] },
      { country: ['Somalia'] },
      { sector: ['Health'] },
      { sector: ['Food Security'] },
      { limit: 20 }
    ];

    for (const filters of commonQueries) {
      // Filter jobs based on query (simplified for pre-warming)
      let filteredJobs = allJobs;
      
      if (filters.country?.length) {
        filteredJobs = filteredJobs.filter(job => 
          filters.country!.includes(job.country)
        );
      }
      
      if (filters.sector?.length) {
        filteredJobs = filteredJobs.filter(job => 
          job.sector && filters.sector!.includes(job.sector)
        );
      }

      if (filters.limit) {
        filteredJobs = filteredJobs.slice(0, filters.limit);
      }

      this.setCachedJobs(filters, filteredJobs);
    }

    console.log(`Pre-warmed cache with ${commonQueries.length} common queries`);
  }
}

// Global cache instance
export const jobsCache = new JobsCache();