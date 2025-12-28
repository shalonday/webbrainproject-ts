// Graph-related type definitions

export interface WBNode {
  id: string;
  type: "skill" | "url";
  name: string;
}

export interface Link {
  id: string;
  source: string;
  target: string;
}

export interface Tree {
  nodes: WBNode[];
  links: Link[];
}
