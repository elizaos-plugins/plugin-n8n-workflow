import { N8nWorkflow } from "../types/index.js";

/**
 * Auto-position nodes on workflow canvas
 * Adapted from n8n-workflow-builder positioning logic
 *
 * Creates a left-to-right flow layout:
 * - Start at [250, 300]
 * - Advance X by 250px per node
 * - Branch nodes offset Y by 200px
 *
 * @param workflow - Workflow with potentially missing node positions
 * @returns Workflow with all nodes positioned
 */
export function positionNodes(workflow: N8nWorkflow): N8nWorkflow {
  // Clone workflow
  const positioned = { ...workflow };
  positioned.nodes = [...workflow.nodes];

  // Check if all nodes already have valid positions
  const allHavePositions = positioned.nodes.every(
    (node) =>
      node.position &&
      Array.isArray(node.position) &&
      node.position.length === 2 &&
      typeof node.position[0] === "number" &&
      typeof node.position[1] === "number",
  );

  if (allHavePositions) {
    return positioned; // No changes needed
  }

  // Build node graph to understand flow structure
  const nodeGraph = buildNodeGraph(positioned);

  // Position nodes level by level (breadth-first from triggers)
  const positionedNodes = positionByLevels(positioned.nodes, nodeGraph);

  positioned.nodes = positionedNodes;
  return positioned;
}

/**
 * Build adjacency graph from connections
 */
function buildNodeGraph(workflow: N8nWorkflow): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  // Initialize all nodes
  for (const node of workflow.nodes) {
    graph.set(node.name, []);
  }

  // Build edges from connections
  for (const [sourceName, outputs] of Object.entries(workflow.connections)) {
    const targets: string[] = [];

    for (const connectionGroups of Object.values(outputs)) {
      for (const connections of connectionGroups) {
        for (const conn of connections) {
          if (conn.node) {
            targets.push(conn.node);
          }
        }
      }
    }

    graph.set(sourceName, targets);
  }

  return graph;
}

/**
 * Position nodes by levels (breadth-first layout)
 */
function positionByLevels(
  nodes: N8nWorkflow["nodes"],
  graph: Map<string, string[]>,
): N8nWorkflow["nodes"] {
  // Find trigger/start nodes (nodes with no incoming connections)
  const incomingCount = new Map<string, number>();
  for (const node of nodes) {
    incomingCount.set(node.name, 0);
  }

  for (const targets of graph.values()) {
    for (const target of targets) {
      incomingCount.set(target, (incomingCount.get(target) || 0) + 1);
    }
  }

  const triggerNodes = nodes.filter(
    (node) => incomingCount.get(node.name) === 0,
  );

  // Organize into levels
  const levels: string[][] = [];
  const visited = new Set<string>();
  const queue: Array<{ name: string; level: number }> = [];

  // Start with triggers at level 0
  for (const trigger of triggerNodes) {
    queue.push({ name: trigger.name, level: 0 });
  }

  while (queue.length > 0) {
    const { name, level } = queue.shift()!;

    if (visited.has(name)) continue;
    visited.add(name);

    // Add to level
    if (!levels[level]) levels[level] = [];
    levels[level].push(name);

    // Add children to next level
    const children = graph.get(name) || [];
    for (const child of children) {
      if (!visited.has(child)) {
        queue.push({ name: child, level: level + 1 });
      }
    }
  }

  // Position nodes based on levels
  const positioned = [...nodes];
  const nodeMap = new Map(nodes.map((node) => [node.name, node]));

  const startX = 250;
  const startY = 300;
  const xSpacing = 250;
  const ySpacing = 100;

  for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
    const levelNodes = levels[levelIndex];
    const x = startX + levelIndex * xSpacing;

    // Center nodes vertically if multiple in same level
    const totalHeight = levelNodes.length * ySpacing;
    const startYForLevel = startY - totalHeight / 2;

    for (let i = 0; i < levelNodes.length; i++) {
      const nodeName = levelNodes[i];
      const node = nodeMap.get(nodeName);

      if (node) {
        const y = startYForLevel + i * ySpacing;
        const nodeIndex = positioned.findIndex((n) => n.name === nodeName);
        if (nodeIndex !== -1) {
          positioned[nodeIndex] = {
            ...positioned[nodeIndex],
            position: [x, y],
          };
        }
      }
    }
  }

  return positioned;
}
