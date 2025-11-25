/**
 * Merkle Tree Module
 * Builds Merkle trees from proof hashes and generates inclusion proofs
 */

import { createHash } from 'crypto';

/**
 * Calculate SHA-256 hash
 */
function hash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Merkle tree node
 */
interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
}

/**
 * Build Merkle tree from proof hashes
 */
export function buildMerkleTree(hashes: string[]): MerkleNode {
  if (hashes.length === 0) {
    throw new Error('Cannot build Merkle tree from empty array');
  }

  if (hashes.length === 1) {
    return { hash: hashes[0] };
  }

  // Build leaf nodes
  let nodes: MerkleNode[] = hashes.map(hash => ({ hash }));

  // Build tree bottom-up
  while (nodes.length > 1) {
    const nextLevel: MerkleNode[] = [];

    for (let i = 0; i < nodes.length; i += 2) {
      const left = nodes[i];
      const right = nodes[i + 1] || left; // Duplicate if odd number

      const combined = left.hash + right.hash;
      const parent: MerkleNode = {
        hash: hash(combined),
        left,
        right: nodes[i + 1] ? right : undefined
      };

      nextLevel.push(parent);
    }

    nodes = nextLevel;
  }

  return nodes[0];
}

/**
 * Get Merkle root from tree
 */
export function getMerkleRoot(tree: MerkleNode): string {
  return tree.hash;
}

/**
 * Generate Merkle proof (path from leaf to root)
 */
export function generateMerkleProof(
  hashes: string[],
  targetHash: string
): string[] {
  const tree = buildMerkleTree(hashes);
  const proof: string[] = [];

  function findPath(node: MerkleNode, target: string, path: string[]): boolean {
    if (!node.left && !node.right) {
      // Leaf node
      return node.hash === target;
    }

    // Check left subtree
    if (node.left) {
      if (findPath(node.left, target, path)) {
        if (node.right) {
          path.push(node.right.hash);
        }
        return true;
      }
    }

    // Check right subtree
    if (node.right) {
      if (findPath(node.right, target, path)) {
        if (node.left) {
          path.push(node.left.hash);
        }
        return true;
      }
    }

    return false;
  }

  findPath(tree, targetHash, proof);
  return proof;
}

/**
 * Verify Merkle proof
 */
export function verifyMerkleProof(
  leafHash: string,
  proof: string[],
  root: string
): boolean {
  let currentHash = leafHash;

  for (const siblingHash of proof) {
    // Determine order (left or right)
    const combined = currentHash < siblingHash
      ? currentHash + siblingHash
      : siblingHash + currentHash;
    
    currentHash = hash(combined);
  }

  return currentHash === root;
}

/**
 * Calculate Merkle root from array of hashes
 */
export function calculateMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) {
    throw new Error('Cannot calculate Merkle root from empty array');
  }

  const tree = buildMerkleTree(hashes);
  return getMerkleRoot(tree);
}

