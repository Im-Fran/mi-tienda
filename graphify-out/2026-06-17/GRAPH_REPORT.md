# Graph Report - .  (2026-06-17)

## Corpus Check
- Corpus is ~2,852 words - fits in a single context window. You may not need a graph.

## Summary
- 100 nodes · 93 edges · 17 communities (9 shown, 8 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_TypeScript App Config|TypeScript App Config]]
- [[_COMMUNITY_TypeScript Node Config|TypeScript Node Config]]
- [[_COMMUNITY_Dev Dependencies|Dev Dependencies]]
- [[_COMMUNITY_Assets & Documentation|Assets & Documentation]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_App Entry Point|App Entry Point]]
- [[_COMMUNITY_TypeScript Root Config|TypeScript Root Config]]
- [[_COMMUNITY_Bluesky Icon|Bluesky Icon]]
- [[_COMMUNITY_Discord Icon|Discord Icon]]
- [[_COMMUNITY_Documentation Icon|Documentation Icon]]
- [[_COMMUNITY_GitHub Icon|GitHub Icon]]
- [[_COMMUNITY_Social Icon|Social Icon]]
- [[_COMMUNITY_Icons SVG Sprite|Icons SVG Sprite]]
- [[_COMMUNITY_X (Twitter) Icon|X (Twitter) Icon]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `compilerOptions` - 16 edges
3. `mi-tienda README` - 13 edges
4. `scripts` - 5 edges
5. `React` - 5 edges
6. `Vite` - 3 edges
7. `ESLint` - 3 edges
8. `@vitejs/plugin-react (Oxc)` - 3 edges
9. `@vitejs/plugin-react-swc (SWC)` - 3 edges
10. `eslint-plugin-react-x` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Favicon SVG (Claude/Lightning bolt purple icon)` --conceptually_related_to--> `mi-tienda README`  [INFERRED]
  public/favicon.svg → README.md
- `Hero Image (3D layered purple platform)` --conceptually_related_to--> `mi-tienda README`  [INFERRED]
  src/assets/hero.png → README.md
- `React Logo SVG` --conceptually_related_to--> `React`  [INFERRED]
  src/assets/react.svg → README.md
- `Vite Logo SVG` --conceptually_related_to--> `Vite`  [INFERRED]
  src/assets/vite.svg → README.md
- `index.html Entry Point` --references--> `Favicon SVG (Claude/Lightning bolt purple icon)`  [EXTRACTED]
  index.html → public/favicon.svg

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Vite + React + TypeScript Development Stack** — readme_vite, readme_react, readme_typescript, readme_hmr [EXTRACTED 1.00]
- **ESLint Type-Aware Linting Configuration** — readme_eslint, readme_tseslint_recommended_type_checked, readme_eslint_plugin_react_x, readme_eslint_plugin_react_dom [INFERRED 0.85]
- **App Entry Point and Static Assets** — index_html, favicon_svg, src_main_tsx [EXTRACTED 1.00]

## Communities (17 total, 8 thin omitted)

### Community 0 - "TypeScript App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 1 - "TypeScript Node Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 2 - "Dev Dependencies"
Cohesion: 0.12
Nodes (17): devDependencies, @babel/core, babel-plugin-react-compiler, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+9 more)

### Community 3 - "Assets & Documentation"
Cohesion: 0.21
Nodes (15): Hero Image (3D layered purple platform), React Logo SVG, Vite Logo SVG, ESLint, eslint-plugin-react-dom, eslint-plugin-react-x, Hot Module Replacement (HMR), mi-tienda README (+7 more)

### Community 4 - "Runtime Dependencies"
Cohesion: 0.15
Nodes (12): dependencies, react, react-dom, name, private, scripts, build, dev (+4 more)

### Community 5 - "App Entry Point"
Cohesion: 0.67
Nodes (3): Favicon SVG (Claude/Lightning bolt purple icon), index.html Entry Point, src/main.tsx

## Knowledge Gaps
- **72 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+67 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Dev Dependencies` to `Runtime Dependencies`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `mi-tienda README` (e.g. with `Hero Image (3D layered purple platform)` and `Favicon SVG (Claude/Lightning bolt purple icon)`) actually correct?**
  _`mi-tienda README` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TypeScript App Config` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `TypeScript Node Config` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._