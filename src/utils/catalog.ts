import { NodeDefinition, NodeSearchResult } from '../types/index';
import defaultNodesData from '../data/defaultNodes.json' assert { type: 'json' };

/**
 * n8n node catalog with keyword-based search
 * @note Uses embedded catalog (457 nodes as of April 2025)
 * @todo Add dynamic refresh via GET /node-types in v2
 */

// Cast imported data to typed array
const NODE_CATALOG = defaultNodesData as NodeDefinition[];

/**
 * Search n8n node catalog using keyword scoring
 *
 * Scoring algorithm:
 * - Exact name match: 10 points
 * - Partial name match: 5 points
 * - Description match: 2 points
 * - Individual word match: 1 point
 *
 * @param keywords - Array of search keywords (e.g., ["gmail", "send", "email"])
 * @param limit - Maximum number of results to return (default: 15)
 * @returns Array of nodes sorted by relevance score (highest first)
 *
 * @example
 * ```typescript
 * const results = searchNodes(["gmail", "send"], 10);
 * // Returns Gmail node with high score, plus other email-related nodes
 * ```
 */
export function searchNodes(
  keywords: string[],
  limit = 15,
): NodeSearchResult[] {
  if (keywords.length === 0) {
    return [];
  }

  // Normalize keywords to lowercase
  const normalizedKeywords = keywords.map((kw) => kw.toLowerCase().trim());

  // Score each node
  const scoredNodes: NodeSearchResult[] = NODE_CATALOG.map((node) => {
    let score = 0;
    const matchReasons: string[] = [];

    const nodeName = node.name.toLowerCase();
    const nodeDisplayName = node.displayName.toLowerCase();
    const nodeDescription = node.description?.toLowerCase() || '';

    for (const keyword of normalizedKeywords) {
      // Exact name match (highest priority)
      if (nodeName === keyword || nodeDisplayName === keyword) {
        score += 10;
        matchReasons.push(`exact match: "${keyword}"`);
        continue;
      }

      // Partial name match
      if (nodeName.includes(keyword) || nodeDisplayName.includes(keyword)) {
        score += 5;
        matchReasons.push(`name contains: "${keyword}"`);
      }

      // Description match
      if (nodeDescription.includes(keyword)) {
        score += 2;
        matchReasons.push(`description contains: "${keyword}"`);
      }

      // Individual word match in description
      const descriptionWords = nodeDescription.split(/\s+/);
      if (descriptionWords.some((word) => word.includes(keyword))) {
        score += 1;
      }

      // Group/category match
      if (node.group.some((group) => group.toLowerCase().includes(keyword))) {
        score += 3;
        matchReasons.push(`category: "${keyword}"`);
      }
    }

    return {
      node,
      score,
      matchReason: matchReasons.join(', ') || 'no strong match',
    };
  });

  // Filter out nodes with zero score and sort by score (highest first)
  return scoredNodes
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
