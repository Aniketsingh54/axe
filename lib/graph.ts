import { type Edge, type Connection } from '@xyflow/react';

/**
 * Checks if a connection from source to target would create a cycle in the graph.
 */
export function wouldHaveCycle(
    source: string,
    target: string,
    edges: Edge[]
): boolean {
    if (source === target) return true;

    // Find all nodes reachable from target
    const visited = new Set<string>();
    const stack = [target];

    while (stack.length > 0) {
        const current = stack.pop()!;
        if (current === source) return true; // Path exists from target back to source

        if (!visited.has(current)) {
            visited.add(current);
            // Add all outgoing neighbors of current node to stack
            const neighbors = edges
                .filter((edge) => edge.source === current)
                .map((edge) => edge.target);
            stack.push(...neighbors);
        }
    }

    return false;
}

/**
 * Validates a connection based on type safety and cycle detection.
 */
export function isValidConnection(
    connection: Connection,
    edges: Edge[]
): boolean {
    // 1. Prevent connecting to self
    if (connection.source === connection.target) return false;

    // 2. Cycle Detection
    if (wouldHaveCycle(connection.source, connection.target, edges)) {
        console.warn('Connection would create a cycle');
        return false;
    }

    // 3. Type Safety (Simplified Check)
    // In a real app, you'd check handle types (e.g. image -> prompt is invalid)
    // For now, we'll allow standard connections.

    return true;
}
