/**
 * Router for OpenAlex Worker
 * Routes incoming requests to appropriate handlers
 */

import type { EntityType } from './types/openalex';
import type { Env } from './handlers/entity-handler';
import {
  handleEntityList,
  handleSingleEntity,
  handleRandomEntity,
  handleAutocomplete,
} from './handlers/entity-handler';

const VALID_ENTITIES: EntityType[] = [
  'works',
  'authors',
  'sources',
  'institutions',
  'topics',
  'publishers',
  'funders',
  'keywords',
  'geo',
];

interface RouteMatch {
  entityType?: EntityType;
  entityId?: string;
  action?: 'random' | 'autocomplete';
}

/**
 * Parse URL path and extract route information
 */
function parseRoute(pathname: string): RouteMatch | null {
  // Remove leading/trailing slashes
  const cleanPath = pathname.replace(/^\/|\/$/g, '');
  const parts = cleanPath.split('/');

  if (parts.length === 0 || !parts[0]) {
    return null;
  }

  // Check for autocomplete endpoint: /autocomplete/:entity
  if (parts[0] === 'autocomplete' && parts.length === 2) {
    const entityType = parts[1] as EntityType;
    if (VALID_ENTITIES.includes(entityType)) {
      return { entityType, action: 'autocomplete' };
    }
    return null;
  }

  // Check for entity endpoint
  const entityType = parts[0] as EntityType;
  if (!VALID_ENTITIES.includes(entityType)) {
    return null;
  }

  // /:entity
  if (parts.length === 1) {
    return { entityType };
  }

  // /:entity/random
  if (parts.length === 2 && parts[1] === 'random') {
    return { entityType, action: 'random' };
  }

  // /:entity/:id
  if (parts.length === 2) {
    return { entityType, entityId: parts[1] };
  }

  return null;
}

/**
 * Main router function
 */
export async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Handle root path - return API info
  if (url.pathname === '/' || url.pathname === '') {
    return jsonResponse({
      name: 'OpenAlex Worker API',
      version: '1.0.0',
      description: 'Cloudflare Worker API wrapper for OpenAlex',
      endpoints: {
        entities: '/:entity (works, authors, sources, institutions, topics, publishers, funders, keywords, geo)',
        singleEntity: '/:entity/:id',
        randomEntity: '/:entity/random',
        autocomplete: '/autocomplete/:entity?q=query',
      },
      documentation: 'https://docs.openalex.org',
      queryParameters: [
        'filter',
        'search',
        'sort',
        'page',
        'per_page',
        'cursor',
        'select',
        'sample',
        'seed',
        'group_by',
        'mailto',
      ],
    });
  }

  // Parse the route
  const route = parseRoute(url.pathname);

  if (!route || !route.entityType) {
    return jsonResponse(
      {
        error: 'Not found',
        message: 'Invalid endpoint. Valid entities: ' + VALID_ENTITIES.join(', '),
      },
      404
    );
  }

  // Route to appropriate handler
  try {
    // Autocomplete
    if (route.action === 'autocomplete') {
      return await handleAutocomplete(route.entityType, request, env);
    }

    // Random entity
    if (route.action === 'random') {
      return await handleRandomEntity(route.entityType, request, env);
    }

    // Single entity by ID
    if (route.entityId) {
      return await handleSingleEntity(route.entityType, route.entityId, request, env);
    }

    // Entity list
    return await handleEntityList(route.entityType, request, env);
  } catch (error) {
    console.error('Router error:', error);
    return jsonResponse(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}

/**
 * Helper function to create JSON responses
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
