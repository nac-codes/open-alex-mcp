/**
 * Generic entity handler for OpenAlex API
 * Handles common operations for all entity types
 */

import type { EntityType, QueryParams } from '../types/openalex';
import { QueryBuilder, parseQueryParams } from '../utils/query-builder';
import { fetcher, OpenAlexError } from '../utils/fetcher';

export interface Env {
  OPENALEX_EMAIL?: string;
}

/**
 * Handle requests for entity lists
 */
export async function handleEntityList(
  entityType: EntityType,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const queryParams = parseQueryParams(url.searchParams);

    // Add polite pool email if available
    if (!queryParams.mailto && env.OPENALEX_EMAIL) {
      queryParams.mailto = env.OPENALEX_EMAIL;
    }

    // Check if this is a group_by request
    if (queryParams.group_by) {
      const apiUrl = QueryBuilder.buildFromParams(entityType, queryParams);
      const data = await fetcher.fetchGroupBy(apiUrl);
      return jsonResponse(data);
    }

    // Regular list request
    const apiUrl = QueryBuilder.buildFromParams(entityType, queryParams);
    const data = await fetcher.fetchList(apiUrl);
    return jsonResponse(data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle requests for a single entity by ID
 */
export async function handleSingleEntity(
  entityType: EntityType,
  entityId: string,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const queryParams = parseQueryParams(url.searchParams);

    // Add polite pool email if available
    if (!queryParams.mailto && env.OPENALEX_EMAIL) {
      queryParams.mailto = env.OPENALEX_EMAIL;
    }

    const apiUrl = QueryBuilder.buildFromParams(entityType, queryParams, entityId);
    const data = await fetcher.fetchEntity(apiUrl);
    return jsonResponse(data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle random entity requests
 */
export async function handleRandomEntity(
  entityType: EntityType,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const mailto = url.searchParams.get('mailto') || env.OPENALEX_EMAIL;

    const apiUrl = QueryBuilder.buildRandomUrl(entityType, mailto);
    const data = await fetcher.fetchEntity(apiUrl);
    return jsonResponse(data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle autocomplete requests
 */
export async function handleAutocomplete(
  entityType: EntityType,
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const mailto = url.searchParams.get('mailto') || env.OPENALEX_EMAIL;

    if (!query) {
      return jsonResponse(
        { error: 'Missing required parameter: q' },
        400
      );
    }

    const apiUrl = QueryBuilder.buildAutocompleteUrl(entityType, query, mailto);
    const data = await fetcher.fetchAutocomplete(apiUrl);
    return jsonResponse(data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Create JSON response with proper headers
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Handle errors and return appropriate response
 */
function handleError(error: unknown): Response {
  console.error('Error:', error);

  if (error instanceof OpenAlexError) {
    return jsonResponse(
      {
        error: error.message,
        statusCode: error.statusCode,
      },
      error.statusCode || 500
    );
  }

  if (error instanceof Error) {
    return jsonResponse(
      {
        error: error.message,
      },
      500
    );
  }

  return jsonResponse(
    {
      error: 'Unknown error occurred',
    },
    500
  );
}
