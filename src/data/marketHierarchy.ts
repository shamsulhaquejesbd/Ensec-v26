export interface MarketHierarchyItem {
  code: string;
  name: string;
  fullName: string;
  region: string;
  area: string;
}

// Clean production baseline: no hardcoded test market hierarchy entries
export const INITIAL_MARKET_HIERARCHIES: MarketHierarchyItem[] = [];

export const STANDARD_DEPARTMENTS: string[] = [
  'DEP-1 - MOUSUMI NETWORK LTD',
  'DEP-2 - RETAIL OPERATIONS',
  'DEP-3 - CORPORATE ACCOUNTS',
  'DEP-4 - FACTORY OPERATIONS & SCM',
  'DEP-5 - ACCOUNTS & FINANCE',
  'DEP-6 - QUALITY & WARRANTY SERVICES',
];

const STORAGE_KEY = 'ensec_market_hierarchies';

const TEST_HIERARCHY_CODES = new Set([
  'mel035',
  'mw012',
  'utt001',
  'utt002',
  'gul010',
  'dhn004',
  'mot008',
  'ctg001',
  'kus001',
  'bog002',
]);

export const getStoredMarketHierarchies = (): MarketHierarchyItem[] => {
  if (typeof window === 'undefined') return INITIAL_MARKET_HIERARCHIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any legacy test data
        const cleaned = parsed.filter(
          (p: MarketHierarchyItem) =>
            p &&
            p.code &&
            !TEST_HIERARCHY_CODES.has(p.code.toLowerCase().trim()) &&
            !p.fullName?.toLowerCase().includes('mel035') &&
            !p.fullName?.toLowerCase().includes('mw012') &&
            !p.fullName?.toLowerCase().includes('utt001') &&
            !p.fullName?.toLowerCase().includes('utt002') &&
            !p.fullName?.toLowerCase().includes('gul010') &&
            !p.fullName?.toLowerCase().includes('dhn004') &&
            !p.fullName?.toLowerCase().includes('mot008') &&
            !p.fullName?.toLowerCase().includes('ctg001') &&
            !p.fullName?.toLowerCase().includes('kus001') &&
            !p.fullName?.toLowerCase().includes('bog002')
        );

        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.error('Error reading market hierarchies from storage', e);
  }
  return INITIAL_MARKET_HIERARCHIES;
};

export const addStoredMarketHierarchy = (item: MarketHierarchyItem): MarketHierarchyItem[] => {
  const current = getStoredMarketHierarchies();
  const exists = current.some(
    (c) =>
      c.code?.toLowerCase() === item.code?.toLowerCase() ||
      c.fullName?.toLowerCase() === item.fullName?.toLowerCase()
  );
  const updated = exists ? current : [...current, item];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ensec-market-hierarchy-updated', { detail: updated }));
    } catch (e) {
      console.error('Error saving market hierarchy to storage', e);
    }
  }
  return updated;
};

export const deleteStoredMarketHierarchy = (codeOrFullName: string): MarketHierarchyItem[] => {
  const current = getStoredMarketHierarchies();
  const target = codeOrFullName.toLowerCase().trim();
  const updated = current.filter(
    (c) => c.code.toLowerCase().trim() !== target && c.fullName.toLowerCase().trim() !== target
  );
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ensec-market-hierarchy-updated', { detail: updated }));
    } catch (e) {
      console.error('Error removing market hierarchy from storage', e);
    }
  }
  return updated;
};

// Helper to extract all market hierarchy beats, DB points, territories and areas from an OrgNode tree
export const extractHierarchiesFromOrgNode = (node?: any): MarketHierarchyItem[] => {
  if (!node) return [];
  const list: MarketHierarchyItem[] = [];
  const visited = new Set<string>();

  const traverse = (curr: any) => {
    if (!curr || !curr.code || !curr.name) return;
    if (
      curr.type === 'Market Hierarchy' ||
      curr.type === 'DB Point' ||
      curr.type === 'Territory' ||
      curr.type === 'Area' ||
      curr.type === 'Beat'
    ) {
      const fullName = `${curr.code} - ${curr.name}`;
      const key = fullName.toLowerCase().trim();
      if (!visited.has(key)) {
        visited.add(key);
        list.push({
          code: curr.code,
          name: curr.name,
          fullName,
          region: curr.type === 'Region' || curr.type === 'Division' ? curr.name : 'Dhaka Division',
          area: curr.name,
        });
      }
    }
    if (curr.children && Array.isArray(curr.children)) {
      curr.children.forEach(traverse);
    }
  };

  traverse(node);
  return list;
};
