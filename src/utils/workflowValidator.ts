import {
  N8nWorkflow,
  WorkflowValidationResult,
  WorkflowValidationError,
} from "../types/index.js";

/**
 * Validate workflow structure and auto-fix common issues
 *
 * @param workflow - Generated workflow to validate
 * @returns Validation result with errors, warnings, and optionally fixed workflow
 */
export function validateWorkflow(
  workflow: N8nWorkflow,
): WorkflowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let needsFix = false;

  // 1. Check nodes array exists and is non-empty
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    errors.push("Missing or invalid nodes array");
    return { valid: false, errors, warnings };
  }

  if (workflow.nodes.length === 0) {
    errors.push("Workflow must have at least one node");
    return { valid: false, errors, warnings };
  }

  // 2. Check connections structure
  if (!workflow.connections || typeof workflow.connections !== "object") {
    errors.push("Missing or invalid connections object");
    return { valid: false, errors, warnings };
  }

  // 3. Validate each node
  const nodeNames = new Set<string>();
  const nodeMap = new Map<string, (typeof workflow.nodes)[0]>();

  for (const node of workflow.nodes) {
    // Check required fields
    if (!node.name || typeof node.name !== "string") {
      errors.push("Node missing name");
      continue;
    }

    if (!node.type || typeof node.type !== "string") {
      errors.push(`Node "${node.name}" missing type`);
      continue;
    }

    // Check for duplicate names
    if (nodeNames.has(node.name)) {
      errors.push(`Duplicate node name: "${node.name}"`);
    }
    nodeNames.add(node.name);
    nodeMap.set(node.name, node);

    // Check position
    if (
      !node.position ||
      !Array.isArray(node.position) ||
      node.position.length !== 2
    ) {
      warnings.push(`Node "${node.name}" has invalid position, will auto-fix`);
      needsFix = true;
    }

    // Check parameters
    if (!node.parameters || typeof node.parameters !== "object") {
      warnings.push(`Node "${node.name}" missing parameters object`);
    }
  }

  // 4. Validate connections reference existing nodes
  for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
    if (!nodeNames.has(sourceName)) {
      errors.push(
        `Connection references non-existent source node: "${sourceName}"`,
      );
      continue;
    }

    for (const [outputType, connections] of Object.entries(outputs)) {
      if (!Array.isArray(connections)) {
        errors.push(`Invalid connection structure for node "${sourceName}"`);
        continue;
      }

      for (const connectionGroup of connections) {
        if (!Array.isArray(connectionGroup)) continue;

        for (const connection of connectionGroup) {
          if (!connection.node || typeof connection.node !== "string") {
            errors.push(`Invalid connection from "${sourceName}"`);
            continue;
          }

          if (!nodeNames.has(connection.node)) {
            errors.push(
              `Connection references non-existent target node: "${connection.node}" (from "${sourceName}")`,
            );
          }
        }
      }
    }
  }

  // 5. Check for at least one trigger node
  const hasTrigger = workflow.nodes.some(
    (node) =>
      node.type.toLowerCase().includes("trigger") ||
      node.type.toLowerCase().includes("webhook") ||
      node.name.toLowerCase().includes("start"),
  );

  if (!hasTrigger) {
    warnings.push(
      "Workflow has no trigger node - it can only be executed manually",
    );
  }

  // 6. Check for orphan nodes (nodes with no incoming connections, except triggers)
  const nodesWithIncoming = new Set<string>();
  for (const outputs of Object.values(workflow.connections)) {
    for (const connectionGroup of Object.values(outputs)) {
      for (const connections of connectionGroup) {
        for (const conn of connections) {
          nodesWithIncoming.add(conn.node);
        }
      }
    }
  }

  for (const node of workflow.nodes) {
    const isTrigger =
      node.type.toLowerCase().includes("trigger") ||
      node.type.toLowerCase().includes("webhook") ||
      node.name.toLowerCase().includes("start");

    if (!isTrigger && !nodesWithIncoming.has(node.name)) {
      warnings.push(
        `Node "${node.name}" has no incoming connections - it will never execute`,
      );
    }
  }

  // 7. Auto-fix if needed
  let fixedWorkflow: N8nWorkflow | undefined;
  if (needsFix && errors.length === 0) {
    fixedWorkflow = autoFixWorkflow(workflow);
  }

  // Return result
  const valid = errors.length === 0;

  if (!valid && errors.length > 0) {
    // Validation failed with errors
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    errors: [],
    warnings,
    fixedWorkflow,
  };
}

/**
 * Auto-fix common workflow issues
 * - Add missing node positions
 * - Fix duplicate node names
 */
function autoFixWorkflow(workflow: N8nWorkflow): N8nWorkflow {
  const fixed = { ...workflow };
  fixed.nodes = [...workflow.nodes];

  let x = 250;
  const y = 300;
  const xSpacing = 250;

  for (let i = 0; i < fixed.nodes.length; i++) {
    const node = { ...fixed.nodes[i] };

    // Fix missing or invalid position
    if (
      !node.position ||
      !Array.isArray(node.position) ||
      node.position.length !== 2
    ) {
      node.position = [x, y];
      x += xSpacing;
    }

    fixed.nodes[i] = node;
  }

  return fixed;
}

/**
 * Validate and throw if workflow is invalid
 * Convenience function for when you want to fail fast
 */
export function validateWorkflowOrThrow(workflow: N8nWorkflow): N8nWorkflow {
  const result = validateWorkflow(workflow);

  if (!result.valid) {
    throw new WorkflowValidationError(
      `Workflow validation failed: ${result.errors.join(", ")}`,
      result.errors,
    );
  }

  // Return fixed workflow if available, otherwise original
  return result.fixedWorkflow || workflow;
}
