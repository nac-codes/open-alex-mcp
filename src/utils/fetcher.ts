/**
 * Fetcher utility for OpenAlex API
 * Handles HTTP requests with error handling and response parsing
 */

import type {
  OpenAlexResponse,
  GroupByResponse,
  AutocompleteResponse,
} from '../types/openalex';

export interface FetcherOptions {
  timeout?: number;
}

export class OpenAlexError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: string
  ) {
    super(message);
    this.name = 'OpenAlexError';
  }
}

export class OpenAlexFetcher {
  private timeout: number;

  constructor(options: FetcherOptions = {}) {
    this.timeout = options.timeout || 30000; // 30 seconds default
  }

  /**
   * Fetch from OpenAlex API with timeout and error handling
   */
  async fetch<T>(url: string): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'OpenAlexWorker/1.0 (Cloudflare Worker)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.text();
        throw new OpenAlexError(
          `OpenAlex API error: ${response.statusText}`,
          response.status,
          body
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof OpenAlexError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new OpenAlexError(`Request timeout after ${this.timeout}ms`);
        }
        throw new OpenAlexError(`Request failed: ${error.message}`);
      }

      throw new OpenAlexError('Unknown error occurred');
    }
  }

  /**
   * Fetch a single entity
   */
  async fetchEntity<T>(url: string): Promise<T> {
    return this.fetch<T>(url);
  }

  /**
   * Fetch a list of entities
   */
  async fetchList<T>(url: string): Promise<OpenAlexResponse<T>> {
    return this.fetch<OpenAlexResponse<T>>(url);
  }

  /**
   * Fetch grouped results
   */
  async fetchGroupBy(url: string): Promise<GroupByResponse> {
    return this.fetch<GroupByResponse>(url);
  }

  /**
   * Fetch autocomplete results
   */
  async fetchAutocomplete(url: string): Promise<AutocompleteResponse> {
    return this.fetch<AutocompleteResponse>(url);
  }
}

// Singleton instance for convenience
export const fetcher = new OpenAlexFetcher();
