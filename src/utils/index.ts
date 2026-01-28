// Re-exports for backwards compatibility
// This file will be removed once all references are updated

export { N8nApiClient } from "../api/index.js";
export {
  searchNodes,
  getNodeByName,
  getNodesByCategory,
  getNodesByCredentialType,
  getCatalogStats,
} from "../catalog/index.js";
export { extractKeywords } from "../generation/index.js";
export { generateWorkflow } from "../generation/index.js";
export {
  validateWorkflow,
  validateWorkflowOrThrow,
} from "../workflow/index.js";
export { positionNodes } from "../workflow/index.js";
export { resolveCredentials } from "../credentials/index.js";
