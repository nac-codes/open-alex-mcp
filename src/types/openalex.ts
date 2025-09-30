/**
 * OpenAlex API TypeScript Types
 */

// ============================================================================
// Common Types
// ============================================================================

export interface OpenAlexMeta {
  count: number;
  db_response_time_ms: number;
  page: number | null;
  per_page: number;
  next_cursor?: string | null;
  groups_count?: number | null;
}

export interface OpenAlexResponse<T> {
  meta: OpenAlexMeta;
  results: T[];
}

export interface GroupByResult {
  key: string;
  key_display_name: string;
  count: number;
}

export interface GroupByResponse {
  meta: OpenAlexMeta;
  group_by: GroupByResult[];
}

export interface AutocompleteResult {
  id: string;
  display_name: string;
  hint?: string;
  cited_by_count?: number;
  works_count?: number;
  entity_type: string;
  external_id?: string;
}

export interface AutocompleteResponse {
  results: AutocompleteResult[];
  meta: {
    count: number;
    db_response_time_ms: number;
  };
}

// ============================================================================
// Entity Types
// ============================================================================

export type EntityType =
  | 'works'
  | 'authors'
  | 'sources'
  | 'institutions'
  | 'topics'
  | 'publishers'
  | 'funders'
  | 'keywords'
  | 'geo';

// ============================================================================
// Works
// ============================================================================

export interface Work {
  id: string;
  doi?: string;
  title?: string;
  display_name?: string;
  publication_year?: number;
  publication_date?: string;
  type?: string;
  type_crossref?: string;
  cited_by_count: number;
  is_retracted: boolean;
  is_paratext: boolean;
  cited_by_api_url?: string;
  abstract_inverted_index?: Record<string, number[]>;
  language?: string;
  primary_location?: Location;
  locations?: Location[];
  open_access?: OpenAccess;
  authorships?: Authorship[];
  countries_distinct_count?: number;
  institutions_distinct_count?: number;
  corresponding_author_ids?: string[];
  corresponding_institution_ids?: string[];
  apc_list?: APC;
  apc_paid?: APC;
  has_fulltext: boolean;
  fulltext_origin?: string;
  cited_by_api_url_with_fulltext?: string;
  biblio?: Biblio;
  keywords?: Keyword[];
  concepts?: Concept[];
  topics?: Topic[];
  mesh?: MeSH[];
  sustainable_development_goals?: SDG[];
  grants?: Grant[];
  referenced_works?: string[];
  related_works?: string[];
  ngrams_url?: string;
  cited_by_percentile_year?: PercentileYear;
  relevance_score?: number;
  created_date: string;
  updated_date: string;
}

export interface Location {
  is_oa: boolean;
  landing_page_url?: string;
  pdf_url?: string;
  source?: Source;
  license?: string;
  version?: string;
}

export interface OpenAccess {
  is_oa: boolean;
  oa_status?: string;
  oa_url?: string;
  any_repository_has_fulltext?: boolean;
}

export interface Authorship {
  author_position?: string;
  author?: Author;
  institutions?: Institution[];
  countries?: string[];
  is_corresponding?: boolean;
  raw_author_name?: string;
  raw_affiliation_strings?: string[];
}

export interface APC {
  value?: number;
  currency?: string;
  value_usd?: number;
  provenance?: string;
}

export interface Biblio {
  volume?: string;
  issue?: string;
  first_page?: string;
  last_page?: string;
}

export interface Keyword {
  id: string;
  display_name: string;
  score: number;
}

export interface Concept {
  id: string;
  wikidata?: string;
  display_name: string;
  level: number;
  score: number;
}

export interface Topic {
  id: string;
  display_name: string;
  score: number;
  subfield?: Subfield;
  field?: Field;
  domain?: Domain;
}

export interface Subfield {
  id: string;
  display_name: string;
}

export interface Field {
  id: string;
  display_name: string;
}

export interface Domain {
  id: string;
  display_name: string;
}

export interface MeSH {
  descriptor_ui: string;
  descriptor_name: string;
  qualifier_ui?: string;
  qualifier_name?: string;
  is_major_topic: boolean;
}

export interface SDG {
  id: string;
  display_name: string;
  score: number;
}

export interface Grant {
  funder: string;
  funder_display_name: string;
  award_id?: string;
}

export interface PercentileYear {
  min: number;
  max: number;
}

// ============================================================================
// Authors
// ============================================================================

export interface Author {
  id: string;
  orcid?: string;
  display_name: string;
  display_name_alternatives?: string[];
  works_count: number;
  cited_by_count: number;
  last_known_institution?: Institution;
  last_known_institutions?: Institution[];
  counts_by_year?: CountByYear[];
  works_api_url: string;
  updated_date: string;
  created_date: string;
  relevance_score?: number;
}

export interface CountByYear {
  year: number;
  works_count: number;
  cited_by_count: number;
  oa_works_count?: number;
}

// ============================================================================
// Sources
// ============================================================================

export interface Source {
  id: string;
  issn_l?: string;
  issn?: string[];
  display_name: string;
  host_organization?: string;
  host_organization_name?: string;
  host_organization_lineage?: string[];
  type?: string;
  works_count: number;
  cited_by_count: number;
  is_oa: boolean;
  is_in_doaj: boolean;
  homepage_url?: string;
  apc_prices?: APCPrice[];
  apc_usd?: number;
  country_code?: string;
  societies?: Society[];
  alternate_titles?: string[];
  abbreviated_title?: string;
  counts_by_year?: CountByYear[];
  works_api_url: string;
  updated_date: string;
  created_date: string;
  relevance_score?: number;
}

export interface APCPrice {
  price: number;
  currency: string;
}

export interface Society {
  url: string;
  organization: string;
}

// ============================================================================
// Institutions
// ============================================================================

export interface Institution {
  id: string;
  ror?: string;
  display_name: string;
  country_code?: string;
  type?: string;
  homepage_url?: string;
  image_url?: string;
  image_thumbnail_url?: string;
  display_name_acronyms?: string[];
  display_name_alternatives?: string[];
  works_count: number;
  cited_by_count: number;
  counts_by_year?: CountByYear[];
  works_api_url: string;
  updated_date: string;
  created_date: string;
  relevance_score?: number;
}

// ============================================================================
// Topics
// ============================================================================

export interface TopicEntity {
  id: string;
  display_name: string;
  description?: string;
  keywords?: string[];
  subfield?: Subfield;
  field?: Field;
  domain?: Domain;
  siblings?: TopicSibling[];
  works_count: number;
  cited_by_count: number;
  counts_by_year?: CountByYear[];
  works_api_url: string;
  updated_date: string;
  created_date: string;
  relevance_score?: number;
}

export interface TopicSibling {
  id: string;
  display_name: string;
}

// ============================================================================
// Publishers
// ============================================================================

export interface Publisher {
  id: string;
  display_name: string;
  alternate_titles?: string[];
  country_codes?: string[];
  hierarchy_level: number;
  parent_publisher?: string;
  lineage?: string[];
  works_count: number;
  cited_by_count: number;
  sources_api_url?: string;
  counts_by_year?: CountByYear[];
  updated_date: string;
  created_date: string;
  relevance_score?: number;
}

// ============================================================================
// Funders
// ============================================================================

export interface Funder {
  id: string;
  display_name: string;
  alternate_titles?: string[];
  country_code?: string;
  description?: string;
  homepage_url?: string;
  image_url?: string;
  image_thumbnail_url?: string;
  grants_count: number;
  works_count: number;
  cited_by_count: number;
  counts_by_year?: CountByYear[];
  roles?: FunderRole[];
  updated_date: string;
  created_date: string;
  relevance_score?: number;
}

export interface FunderRole {
  role: string;
  id: string;
  works_count: number;
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface QueryParams {
  // Filtering
  filter?: string;

  // Search
  search?: string;

  // Sorting
  sort?: string;

  // Pagination
  page?: number;
  per_page?: number;
  cursor?: string;

  // Field selection
  select?: string;

  // Sampling
  sample?: number;
  seed?: number;

  // Grouping
  group_by?: string;

  // Polite pool
  mailto?: string;
}
