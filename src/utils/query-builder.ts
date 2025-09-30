/**
 * Query Builder for OpenAlex API
 * Constructs URLs with filters, search, pagination, sorting, etc.
 */

import type { EntityType, QueryParams } from '../types/openalex';

const OPENALEX_BASE_URL = 'https://api.openalex.org';

export class QueryBuilder {
  private baseUrl: string;
  private params: URLSearchParams;

  constructor(entityType: EntityType, entityId?: string) {
    if (entityId) {
      this.baseUrl = `${OPENALEX_BASE_URL}/${entityType}/${entityId}`;
    } else {
      this.baseUrl = `${OPENALEX_BASE_URL}/${entityType}`;
    }
    this.params = new URLSearchParams();
  }

  /**
   * Add filter parameters
   * Supports multiple filters separated by commas
   */
  filter(filterString: string): this {
    if (filterString) {
      this.params.set('filter', filterString);
    }
    return this;
  }

  /**
   * Add search parameter
   */
  search(searchTerm: string): this {
    if (searchTerm) {
      this.params.set('search', searchTerm);
    }
    return this;
  }

  /**
   * Add sort parameter
   * Example: "cited_by_count:desc"
   */
  sort(sortField: string): this {
    if (sortField) {
      this.params.set('sort', sortField);
    }
    return this;
  }

  /**
   * Add pagination - basic paging
   */
  page(pageNumber: number, perPage?: number): this {
    if (pageNumber) {
      this.params.set('page', pageNumber.toString());
    }
    if (perPage) {
      this.params.set('per-page', perPage.toString());
    }
    return this;
  }

  /**
   * Set per-page limit
   */
  perPage(limit: number): this {
    if (limit) {
      this.params.set('per-page', limit.toString());
    }
    return this;
  }

  /**
   * Add cursor pagination
   */
  cursor(cursorValue: string): this {
    if (cursorValue) {
      this.params.set('cursor', cursorValue);
    }
    return this;
  }

  /**
   * Select specific fields to return
   * Example: "id,doi,display_name"
   */
  select(fields: string): this {
    if (fields) {
      this.params.set('select', fields);
    }
    return this;
  }

  /**
   * Get random sample
   */
  sample(size: number, seed?: number): this {
    if (size) {
      this.params.set('sample', size.toString());
    }
    if (seed !== undefined) {
      this.params.set('seed', seed.toString());
    }
    return this;
  }

  /**
   * Group by field
   * Example: "type", "open_access.oa_status"
   */
  groupBy(field: string): this {
    if (field) {
      this.params.set('group_by', field);
    }
    return this;
  }

  /**
   * Add mailto for polite pool
   */
  mailto(email: string): this {
    if (email) {
      this.params.set('mailto', email);
    }
    return this;
  }

  /**
   * Build final URL
   */
  build(): string {
    const paramString = this.params.toString();
    return paramString ? `${this.baseUrl}?${paramString}` : this.baseUrl;
  }

  /**
   * Static helper to build URL from query params object
   */
  static buildFromParams(
    entityType: EntityType,
    queryParams: QueryParams,
    entityId?: string
  ): string {
    const builder = new QueryBuilder(entityType, entityId);

    if (queryParams.filter) builder.filter(queryParams.filter);
    if (queryParams.search) builder.search(queryParams.search);
    if (queryParams.sort) builder.sort(queryParams.sort);
    if (queryParams.page) builder.page(queryParams.page, queryParams.per_page);
    if (queryParams.per_page && !queryParams.page) builder.perPage(queryParams.per_page);
    if (queryParams.cursor) builder.cursor(queryParams.cursor);
    if (queryParams.select) builder.select(queryParams.select);
    if (queryParams.sample) builder.sample(queryParams.sample, queryParams.seed);
    if (queryParams.group_by) builder.groupBy(queryParams.group_by);
    if (queryParams.mailto) builder.mailto(queryParams.mailto);

    return builder.build();
  }

  /**
   * Build random entity URL
   */
  static buildRandomUrl(entityType: EntityType, mailto?: string): string {
    const url = new URL(`${OPENALEX_BASE_URL}/${entityType}/random`);
    if (mailto) url.searchParams.set('mailto', mailto);
    return url.toString();
  }
}
