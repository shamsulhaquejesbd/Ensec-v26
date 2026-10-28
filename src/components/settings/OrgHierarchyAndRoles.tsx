import React, { useState } from 'react';
import {
  Network,
  PlusCircle,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Edit2,
  Trash2,
  Tag,
  Users2,
  Contact2,
  Navigation,
  FolderPlus,
  Search,
  Building2,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { OrgNode } from '../../types/erp.ts';
import { getSupabase } from '../../lib/supabase.ts';
import { addStoredMarketHierarchy } from '../../data/marketHierarchy.ts';

export interface OrgHierarchyAndRolesProps {
  onNavigate?: (module: string) => void;
}

const BANGLADESH_DISTRICTS = [
  'Dhaka',
  'Chittagong',
  'Kushtia',
  'Rajshahi',
  'Khulna',
  'Sylhet',
  'Rangpur',
  'Barisal',
  'Bogra',
  'Jessore',
  'Dinajpur',
  "Cox's Bazar",
  'Tangail',
  'Faridpur',
  'Pabna',
  'Noakhali',
  'Comilla',
  'Mymensingh',
  'Gazipur',
  'Narayanganj',
];

// Helper to recursively find and update a node in the org tree
function updateNodeInTree(root: OrgNode, targetId: string, updater: (node: OrgNode) => OrgNode): OrgNode {
  if (root.id === targetId) {
    return updater(root);
  }
  if (!root.children || root.children.length === 0) {
    return root;
  }
  return {
    ...root,
    children: root.children.map((child) => updateNodeInTree(child, targetId, updater)),
  };
}

// Helper to recursively add a child node under a parent
function addChildNodeInTree(root: OrgNode, parentId: string, newNode: OrgNode): OrgNode {
  if (root.id === parentId) {
    return {
      ...root,
      children: [...(root.children || []), newNode],
    };
  }
  if (!root.children || root.children.length === 0) {
    return root;
  }
  return {
    ...root,
    children: root.children.map((child) => addChildNodeInTree(child, parentId, newNode)),
  };
}

// Helper to recursively delete a node from the org tree
function deleteNodeFromTree(root: OrgNode, targetId: string): OrgNode {
  if (!root.children) return root;
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== targetId)
      .map((child) => deleteNodeFromTree(child, targetId)),
  };
}

// Helper to flatten tree into list with hierarchy depth and path
interface FlatOrgOption {
  id: string;
  name: string;
  type: OrgNode['type'];
  code: string;
  level: number;
}

function flattenOrgTree(root: OrgNode, level: number = 0, result: FlatOrgOption[] = []): FlatOrgOption[] {
  result.push({
    id: root.id,
    name: root.name,
    type: root.type,
    code: root.code,
    level,
  });
  if (root.children) {
    for (const child of root.children) {
      flattenOrgTree(child, level + 1, result);
    }
  }
  return result;
}

export const OrgHierarchyAndRoles: React.FC<OrgHierarchyAndRolesProps> = ({ onNavigate }) => {
  const {
    orgHierarchy,
    setOrgHierarchy,
    addAuditLog,
    distributors,
    addDistributor,
    updateDistributor,
    customers,
    fieldForceReps,
  } = useERP();

  // Node Selection State for Inspector / Tagging Panel
  const [selectedNodeId, setSelectedNodeId] = useState<string>(orgHierarchy.id);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Record<string, boolean>>({});

  // Search filter across hierarchy
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showOnboardDistModal, setShowOnboardDistModal] = useState(false);
  const [showAddMarketHierarchyModal, setShowAddMarketHierarchyModal] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<OrgNode | null>(null);
  const [nodeToTag, setNodeToTag] = useState<OrgNode | null>(null);
  const [targetOrgNodeForDist, setTargetOrgNodeForDist] = useState<OrgNode | null>(null);

  // Form State: Add Distributor Market Hierarchy Beat / Point
  const [mhParentId, setMhParentId] = useState<string>(orgHierarchy.id);
  const [mhCode, setMhCode] = useState('');
  const [mhName, setMhName] = useState('');
  const [mhType, setMhType] = useState<OrgNode['type']>('Market Hierarchy');
  const [mhDistrict, setMhDistrict] = useState('Dhaka');
  const [mhRegion, setMhRegion] = useState('Dhaka Division');
  const [mhHeadPerson, setMhHeadPerson] = useState('');
  const [mhPhone, setMhPhone] = useState('');
  const [mhNotes, setMhNotes] = useState('');
  const [mhSelectedDistributorIds, setMhSelectedDistributorIds] = useState<string[]>([]);
  const [mhDistSearch, setMhDistSearch] = useState('');
  const [mhAlsoOnboardDist, setMhAlsoOnboardDist] = useState(false);
  const [mhNewDistCode, setMhNewDistCode] = useState('');
  const [mhNewDistName, setMhNewDistName] = useState('');
  const [mhNewDistOwner, setMhNewDistOwner] = useState('');
  const [mhNewDistPhone, setMhNewDistPhone] = useState('');
  const [mhNewDistCreditLimit, setMhNewDistCreditLimit] = useState<number>(1000000);
  const [mhNewDistPaymentTerms, setMhNewDistPaymentTerms] = useState<number>(30);
  const [mhError, setMhError] = useState<string | null>(null);
  const [mhIsSaving, setMhIsSaving] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form State: Add Node
  const [newParentId, setNewParentId] = useState<string>(orgHierarchy.id);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<OrgNode['type']>('Territory');
  const [newNodeCode, setNewNodeCode] = useState('');
  const [newNodeHead, setNewNodeHead] = useState('');
  const [newNodePhone, setNewNodePhone] = useState('');
  const [newNodeNotes, setNewNodeNotes] = useState('');

  // Form State: Onboard Distributor directly to Hierarchy Node
  const [newDistCode, setNewDistCode] = useState('');
  const [newDistName, setNewDistName] = useState('');
  const [newDistOwner, setNewDistOwner] = useState('');
  const [newDistPhone, setNewDistPhone] = useState('');
  const [newDistEmail, setNewDistEmail] = useState('');
  const [newDistDistrict, setNewDistDistrict] = useState('Dhaka');
  const [newDistCreditLimit, setNewDistCreditLimit] = useState<number>(1000000);
  const [newDistPaymentTerms, setNewDistPaymentTerms] = useState<number>(30);
  const [onboardDistError, setOnboardDistError] = useState<string | null>(null);
  const [isOnboardingDist, setIsOnboardingDist] = useState(false);

  // Form State: Tag Entities
  const [selectedDistIds, setSelectedDistIds] = useState<string[]>([]);
  const [selectedCustIds, setSelectedCustIds] = useState<string[]>([]);
  const [selectedFfIds, setSelectedFfIds] = useState<string[]>([]);
  const [tagModalActiveTab, setTagModalActiveTab] = useState<'distributors' | 'customers' | 'fieldforce'>('distributors');
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // Find a specific node by ID in tree
  const findNode = (root: OrgNode, id: string): OrgNode | null => {
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = findNode(orgHierarchy, selectedNodeId) || orgHierarchy;
  const flatNodes = flattenOrgTree(orgHierarchy);

  const toggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodeIds((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Open Add Node Modal with default parent
  const handleOpenAddModal = (defaultParentId?: string) => {
    setNewParentId(defaultParentId || selectedNodeId || orgHierarchy.id);
    setNewNodeName('');
    setNewNodeType('Territory');
    setNewNodeCode('');
    setNewNodeHead('');
    setNewNodePhone('');
    setNewNodeNotes('');
    setShowAddModal(true);
  };

  // Open Edit Node Modal
  const handleOpenEditModal = (node: OrgNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNodeToEdit(node);
    setShowEditModal(true);
  };

  // Open Tagging Modal
  const handleOpenTagModal = (node: OrgNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNodeToTag(node);
    setSelectedDistIds(node.taggedDistributorIds || []);
    setSelectedCustIds(node.taggedCustomerIds || []);
    setSelectedFfIds(node.taggedFieldForceIds || []);
    setTagSearchQuery('');
    setShowTagModal(true);
  };

  // Submit Add Node
  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    const generatedCode =
      newNodeCode.trim().toUpperCase() ||
      `${newNodeType.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newNode: OrgNode = {
      id: `org-${Date.now().toString().slice(-5)}`,
      name: newNodeName.trim(),
      type: newNodeType,
      code: generatedCode,
      parentId: newParentId || undefined,
      headPerson: newNodeHead.trim(),
      phone: newNodePhone.trim(),
      notes: newNodeNotes.trim(),
      children: [],
      taggedDistributorIds: [],
      taggedCustomerIds: [],
      taggedFieldForceIds: [],
    };

    if (!orgHierarchy.name || !newParentId) {
      setOrgHierarchy(newNode);
    } else {
      setOrgHierarchy((prev) => addChildNodeInTree(prev, newParentId, newNode));
    }
    setSelectedNodeId(newNode.id);

    // Register into market hierarchies storage if applicable
    if (['Territory', 'DB Point', 'Market Hierarchy', 'Area', 'Beat'].includes(newNode.type)) {
      addStoredMarketHierarchy({
        code: newNode.code,
        name: newNode.name,
        fullName: `${newNode.code} - ${newNode.name}`,
        region: 'Dhaka Division',
        area: newNode.name,
      });
    }

    // Sync to Supabase
    const sb = getSupabase();
    if (sb) {
      sb.from('org_hierarchy')
        .upsert({
          node_id: newNode.id,
          code: newNode.code,
          name: newNode.name,
          type: newNode.type,
          parent_id: newNode.parentId || null,
          head_person: newNode.headPerson || null,
          phone: newNode.phone || null,
          notes: newNode.notes || null,
          tagged_distributor_ids: newNode.taggedDistributorIds || [],
          tagged_customer_ids: newNode.taggedCustomerIds || [],
          tagged_field_force_ids: newNode.taggedFieldForceIds || [],
        })
        .then(({ error }) => {
          if (error) console.warn('Supabase org_hierarchy insert error:', error.message);
        });
    }

    addAuditLog(
      'ORG_NODE_CREATED',
      'Org Hierarchy',
      `Created new hierarchy node [${newNode.type}] "${newNode.name}" (${newNode.code}) under parent ${newParentId || 'Root'}`
    );

    showToast(`Hierarchy node "${newNode.name}" created successfully!`, 'success');
    setShowAddModal(false);
  };

  // Open Add Distributor Market Hierarchy Modal
  const handleOpenAddMarketHierarchyModal = (defaultParentId?: string) => {
    const parentId = defaultParentId || selectedNodeId || orgHierarchy.id;
    setMhParentId(parentId);
    const count = flatNodes.filter(n => n.type === 'Market Hierarchy' || n.type === 'DB Point' || n.type === 'Territory').length + 1;
    setMhCode(`MH-${count.toString().padStart(2, '0')}`);
    setMhName('');
    setMhType('Market Hierarchy');
    setMhDistrict('Dhaka');
    const parentNode = findNode(orgHierarchy, parentId);
    setMhRegion(parentNode?.name || 'Dhaka Division');
    setMhHeadPerson('');
    setMhPhone(parentNode?.phone || '');
    setMhNotes('');
    setMhSelectedDistributorIds([]);
    setMhDistSearch('');
    setMhAlsoOnboardDist(false);
    setMhNewDistCode(`DIS-0${(distributors || []).length + 1}`);
    setMhNewDistName('');
    setMhNewDistOwner('');
    setMhNewDistPhone('');
    setMhNewDistCreditLimit(1000000);
    setMhNewDistPaymentTerms(30);
    setMhError(null);
    setShowAddMarketHierarchyModal(true);
  };

  // Submit Add Distributor Market Hierarchy Beat / Point
  const handleSaveMarketHierarchyNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mhName.trim()) {
      setMhError('Please provide a Market Hierarchy Beat / Point Name.');
      return;
    }
    const code = mhCode.trim().toUpperCase() || `MH-${Math.floor(100 + Math.random() * 900)}`;
    const name = mhName.trim();
    const fullName = `${code} - ${name}`;

    setMhIsSaving(true);
    setMhError(null);

    try {
      const parentNode = findNode(orgHierarchy, mhParentId);
      const effectiveParentId = mhParentId || orgHierarchy.id;

      let taggedDistIds = [...mhSelectedDistributorIds];

      // If user also wants to onboard a new distributor right here:
      if (mhAlsoOnboardDist) {
        if (!mhNewDistName.trim() || !mhNewDistOwner.trim() || !mhNewDistPhone.trim()) {
          setMhError('Please fill in required fields for the new distributor (Enterprise Name, Proprietor, Phone).');
          setMhIsSaving(false);
          return;
        }

        const res = await addDistributor({
          code: (mhNewDistCode.trim() || `DIS-0${distributors.length + 1}`).toUpperCase(),
          name: mhNewDistName.trim(),
          ownerName: mhNewDistOwner.trim(),
          phone: mhNewDistPhone.trim(),
          district: mhDistrict,
          region: mhRegion,
          territory: name,
          marketHierarchy: fullName,
          creditLimitBDT: Number(mhNewDistCreditLimit) || 0,
          paymentTermsDays: Number(mhNewDistPaymentTerms) || 30,
          openingBalanceBDT: 0,
          status: 'Active',
        });
        const createdDistId = res?.data?.id || `dist-${Date.now().toString().slice(-4)}`;
        taggedDistIds.push(createdDistId);
      }

      const newNode: OrgNode = {
        id: `org-${Date.now().toString().slice(-5)}`,
        name,
        type: mhType,
        code,
        parentId: effectiveParentId || undefined,
        headPerson: mhHeadPerson.trim(),
        phone: mhPhone.trim(),
        notes: mhNotes.trim(),
        children: [],
        taggedDistributorIds: taggedDistIds,
        taggedCustomerIds: [],
        taggedFieldForceIds: [],
      };

      if (!orgHierarchy.name || !effectiveParentId) {
        setOrgHierarchy(newNode);
      } else {
        setOrgHierarchy((prev) => addChildNodeInTree(prev, effectiveParentId, newNode));
      }
      setSelectedNodeId(newNode.id);

      // Register into market hierarchies storage for system-wide lookup
      addStoredMarketHierarchy({
        code,
        name,
        fullName,
        region: mhRegion,
        area: parentNode?.name || name,
      });

      // Update any selected existing distributors to link to this market hierarchy!
      for (const distId of mhSelectedDistributorIds) {
        try {
          updateDistributor(distId, {
            marketHierarchy: fullName,
            territory: name,
          });
        } catch (err) {
          console.warn('Failed linking distributor to new market hierarchy', err);
        }
      }

      // Sync to Supabase org_hierarchy
      const sb = getSupabase();
      if (sb) {
        sb.from('org_hierarchy')
          .upsert({
            node_id: newNode.id,
            code: newNode.code,
            name: newNode.name,
            type: newNode.type,
            parent_id: newNode.parentId || null,
            head_person: newNode.headPerson || null,
            phone: newNode.phone || null,
            notes: newNode.notes || null,
            tagged_distributor_ids: taggedDistIds,
            tagged_customer_ids: [],
            tagged_field_force_ids: [],
          })
          .then(({ error }) => {
            if (error) console.warn('Supabase org_hierarchy insert error:', error.message);
          });
      }

      addAuditLog(
        'DISTRIBUTOR_MARKET_HIERARCHY_CREATED',
        'Org Hierarchy',
        `Created distributor market hierarchy [${newNode.type}] "${fullName}" under parent "${parentNode?.name || 'Root'}" with ${taggedDistIds.length} distributors linked`
      );

      showToast(`Distributor Market Hierarchy "${fullName}" created successfully!`, 'success');
      setShowAddMarketHierarchyModal(false);
    } catch (err: any) {
      setMhError(err?.message || 'Failed to save market hierarchy');
    } finally {
      setMhIsSaving(false);
    }
  };

  // Submit Edit Node
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeToEdit) return;

    setOrgHierarchy((prev) =>
      updateNodeInTree(prev, nodeToEdit.id, (node) => ({
        ...node,
        name: nodeToEdit.name,
        type: nodeToEdit.type,
        code: nodeToEdit.code.toUpperCase(),
        headPerson: nodeToEdit.headPerson,
        phone: nodeToEdit.phone,
        notes: nodeToEdit.notes,
      }))
    );

    // Sync to Supabase
    const sb = getSupabase();
    if (sb) {
      sb.from('org_hierarchy')
        .update({
          code: nodeToEdit.code.toUpperCase(),
          name: nodeToEdit.name,
          type: nodeToEdit.type,
          head_person: nodeToEdit.headPerson || null,
          phone: nodeToEdit.phone || null,
          notes: nodeToEdit.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('node_id', nodeToEdit.id)
        .then(({ error }) => {
          if (error) console.warn('Supabase org_hierarchy update error:', error.message);
        });
    }

    addAuditLog(
      'ORG_NODE_UPDATED',
      'Org Hierarchy',
      `Updated hierarchy details for "${nodeToEdit.name}" (${nodeToEdit.code})`
    );

    setShowEditModal(false);
    setNodeToEdit(null);
  };

  // Submit Tagging
  const handleSaveTags = () => {
    if (!nodeToTag) return;

    setOrgHierarchy((prev) =>
      updateNodeInTree(prev, nodeToTag.id, (node) => ({
        ...node,
        taggedDistributorIds: selectedDistIds,
        taggedCustomerIds: selectedCustIds,
        taggedFieldForceIds: selectedFfIds,
      }))
    );

    // Sync to Supabase
    const sb = getSupabase();
    if (sb) {
      sb.from('org_hierarchy')
        .update({
          tagged_distributor_ids: selectedDistIds,
          tagged_customer_ids: selectedCustIds,
          tagged_field_force_ids: selectedFfIds,
          updated_at: new Date().toISOString(),
        })
        .eq('node_id', nodeToTag.id)
        .then(({ error }) => {
          if (error) console.warn('Supabase org_hierarchy tag update error:', error.message);
        });
    }

    // Update tagged distributors so their marketHierarchy reflects this node!
    const hierarchyString = `${nodeToTag.code} - ${nodeToTag.name}`;
    for (const distId of selectedDistIds) {
      try {
        updateDistributor(distId, {
          marketHierarchy: hierarchyString,
          territory: nodeToTag.name,
        });
      } catch (err) {
        console.warn('Failed to update distributor marketHierarchy on tag', err);
      }
    }

    addAuditLog(
      'ORG_TAGGING_UPDATED',
      'Org Hierarchy',
      `Tagged ${selectedDistIds.length} distributors, ${selectedCustIds.length} customers, and ${selectedFfIds.length} field officers to "${nodeToTag.name}"`
    );

    setShowTagModal(false);
    setNodeToTag(null);
  };

  // Open Onboard Distributor directly into this Org Hierarchy Node
  const handleOpenOnboardDistModal = (node: OrgNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetOrgNodeForDist(node);
    const count = (distributors || []).length + 1;
    setNewDistCode(`DIS-0${count}`);
    setNewDistName('');
    setNewDistOwner('');
    setNewDistPhone(node.phone || '');
    setNewDistEmail('');
    setNewDistDistrict('Dhaka');
    setNewDistCreditLimit(1000000);
    setNewDistPaymentTerms(30);
    setOnboardDistError(null);
    setShowOnboardDistModal(true);
  };

  // Submit Onboard Distributor from Org Hierarchy page
  const handleSaveOnboardDistributor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrgNodeForDist) return;
    if (!newDistName.trim() || !newDistOwner.trim() || !newDistPhone.trim() || !newDistCode.trim()) {
      setOnboardDistError('Please fill in all required fields (Enterprise Name, Proprietor, Phone, Code).');
      return;
    }

    setIsOnboardingDist(true);
    setOnboardDistError(null);

    const hierarchyString = `${targetOrgNodeForDist.code} - ${targetOrgNodeForDist.name}`;

    try {
      const res = await addDistributor({
        code: newDistCode.trim().toUpperCase(),
        name: newDistName.trim(),
        ownerName: newDistOwner.trim(),
        phone: newDistPhone.trim(),
        email: newDistEmail.trim() || undefined,
        district: newDistDistrict.trim(),
        region:
          targetOrgNodeForDist.type === 'Region' || targetOrgNodeForDist.type === 'Division'
            ? targetOrgNodeForDist.name
            : 'Dhaka Division',
        territory: targetOrgNodeForDist.name,
        marketHierarchy: hierarchyString,
        creditLimitBDT: Number(newDistCreditLimit) || 0,
        paymentTermsDays: Number(newDistPaymentTerms) || 30,
        openingBalanceBDT: 0,
        status: 'Active',
      });

      // Register into market hierarchies list
      addStoredMarketHierarchy({
        code: targetOrgNodeForDist.code,
        name: targetOrgNodeForDist.name,
        fullName: hierarchyString,
        region:
          targetOrgNodeForDist.type === 'Region' || targetOrgNodeForDist.type === 'Division'
            ? targetOrgNodeForDist.name
            : 'Dhaka Division',
        area: targetOrgNodeForDist.name,
      });

      // Tag to this node in Org Hierarchy
      const newDistId = res?.data?.id || `dist-${Date.now().toString().slice(-4)}`;
      const updatedTagged = Array.from(
        new Set([...(targetOrgNodeForDist.taggedDistributorIds || []), newDistId])
      );

      setOrgHierarchy((prev) =>
        updateNodeInTree(prev, targetOrgNodeForDist.id, (node) => ({
          ...node,
          taggedDistributorIds: updatedTagged,
        }))
      );

      // Sync to Supabase if configured
      const sb = getSupabase();
      if (sb) {
        sb.from('org_hierarchy')
          .update({
            tagged_distributor_ids: updatedTagged,
            updated_at: new Date().toISOString(),
          })
          .eq('node_id', targetOrgNodeForDist.id)
          .then(({ error }) => {
            if (error) console.warn('Supabase org_hierarchy tag update error:', error.message);
          });
      }

      addAuditLog(
        'DISTRIBUTOR_ONBOARDED_FROM_ORG_HIERARCHY',
        'Org Hierarchy',
        `Onboarded distributor "${newDistName.trim()}" directly to hierarchy node "${targetOrgNodeForDist.name}" (${targetOrgNodeForDist.code})`
      );

      setShowOnboardDistModal(false);
      setTargetOrgNodeForDist(null);
    } catch (err: any) {
      setOnboardDistError(err?.message || 'Failed to onboard distributor');
    } finally {
      setIsOnboardingDist(false);
    }
  };

  // Delete Node (Prevent deleting Root Company)
  const handleDeleteNode = (node: OrgNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.id === orgHierarchy.id || node.type === 'Company') {
      alert('The root enterprise node cannot be deleted.');
      return;
    }
    if (
      !confirm(
        `Are you sure you want to remove hierarchy node "${node.name}" (${node.code})? Any child nodes will also be removed.`
      )
    ) {
      return;
    }

    setOrgHierarchy((prev) => deleteNodeFromTree(prev, node.id));
    setSelectedNodeId(orgHierarchy.id);

    // Sync to Supabase
    const sb = getSupabase();
    if (sb) {
      sb.from('org_hierarchy')
        .delete()
        .eq('node_id', node.id)
        .then(({ error }) => {
          if (error) console.warn('Supabase org_hierarchy delete error:', error.message);
        });
    }

    addAuditLog(
      'ORG_NODE_DELETED',
      'Org Hierarchy',
      `Deleted hierarchy node "${node.name}" (${node.code})`
    );
  };

  // Recursive Tree Node Renderer
  const renderOrgNode = (node: OrgNode, level: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    const isCollapsed = Boolean(collapsedNodeIds[node.id]);
    const hasChildren = Boolean(node.children && node.children.length > 0);

    const distCount = node.taggedDistributorIds?.length || 0;
    const custCount = node.taggedCustomerIds?.length || 0;
    const ffCount = node.taggedFieldForceIds?.length || 0;
    const totalTagged = distCount + custCount + ffCount;

    const matchesSearch =
      searchTerm === '' ||
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.headPerson && node.headPerson.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div key={node.id} className="space-y-1">
        <div
          onClick={() => setSelectedNodeId(node.id)}
          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all group ${
            isSelected
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/20'
              : matchesSearch
              ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
              : 'opacity-40 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
          }`}
          style={{ marginLeft: `${level * 16}px` }}
        >
          {/* Node identity info */}
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(node.id, e)}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                node.type === 'Company'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : node.type === 'Business Unit'
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  : node.type === 'Division'
                  ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
                  : node.type === 'Region'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  : node.type === 'Area'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : node.type === 'Market Hierarchy' || node.type === 'Beat'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : node.type === 'DB Point'
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {node.type}
            </span>

            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {node.name}
            </span>
            <span className="font-mono text-[10px] text-slate-400 shrink-0">({node.code})</span>

            {/* Tag badge pills */}
            {totalTagged > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 ml-2">
                {distCount > 0 && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <Users2 className="w-2.5 h-2.5" />
                    <span>{distCount} DB</span>
                  </span>
                )}
                {custCount > 0 && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Contact2 className="w-2.5 h-2.5" />
                    <span>{custCount} Cust</span>
                  </span>
                )}
                {ffCount > 0 && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Navigation className="w-2.5 h-2.5" />
                    <span>{ffCount} Rep</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Node Actions & Quick Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {node.headPerson && (
              <span className="text-[11px] text-slate-500 hidden md:inline">
                Head: <b className="text-slate-800 dark:text-slate-200">{node.headPerson}</b>
              </span>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAddMarketHierarchyModal(node.id);
                }}
                title="Add Distributor Market Hierarchy Beat under this node"
                className="p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => handleOpenTagModal(node, e)}
                title="Tag Distributors, Customers & Field Force"
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => handleOpenAddModal(node.id)}
                title="Add Child Node Under This Node"
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => handleOpenEditModal(node, e)}
                title="Edit Hierarchy Node"
                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {node.type !== 'Company' && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteNode(node, e)}
                  title="Delete Hierarchy Node"
                  className="p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Children Render */}
        {!isCollapsed && node.children && node.children.length > 0 && (
          <div className="space-y-1">
            {node.children.map((child) => renderOrgNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Tagged lists for the selected node inspector
  const taggedDistributors = distributors.filter((d) =>
    selectedNode.taggedDistributorIds?.includes(d.id)
  );
  const taggedCustomers = customers.filter((c) =>
    selectedNode.taggedCustomerIds?.includes(c.id)
  );
  const taggedFieldForce = fieldForceReps.filter((r) =>
    selectedNode.taggedFieldForceIds?.includes(r.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
            <span>Basic Data Master</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white">Organization Hierarchy</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Organization Hierarchy & Market Beats
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage company branches, territories, and add distributor market hierarchy beats.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleOpenAddMarketHierarchyModal(selectedNodeId)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Distributor Market Hierarchy</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAddModal(selectedNodeId)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Org Node</span>
          </button>
        </div>
      </div>

      {/* Organization Hierarchy & Tagging */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Tree View (8 Cols) */}
          <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Network className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Enterprise Hierarchy Tree</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Company ➔ Business Unit ➔ Division ➔ Region ➔ Area ➔ Territory / Market Beat
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search node, territory, code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-40"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddMarketHierarchyModal(selectedNodeId)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Add Distributor Market Hierarchy Beat under selected node"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Market Hierarchy</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAddModal(selectedNodeId)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Child</span>
                </button>
              </div>
            </div>

            {/* Tree nodes list */}
            <div className="space-y-1.5 pt-1 overflow-x-auto">
              {!orgHierarchy.name ? (
                <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center mx-auto mb-3 text-blue-600 dark:text-blue-400">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No Organization Hierarchy Found
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Your database table (<code className="text-blue-600 dark:text-blue-400 font-mono">org_hierarchy</code>) has no records. Create your root company node to begin structuring your organization.
                  </p>
                  <button
                    onClick={() => {
                      setNewParentId('');
                      setNewNodeType('Company');
                      setShowAddModal(true);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Root Company</span>
                  </button>
                </div>
              ) : (
                renderOrgNode(orgHierarchy)
              )}
            </div>
          </div>

          {/* Right: Selected Node Details & Tagged Entities Inspector (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              {!orgHierarchy.name ? (
                <div className="text-center py-10 px-4 text-slate-400">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-medium">No node selected</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Create your root company node to inspect details and tag entities.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Selected Node Inspector
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {selectedNode.name}
                      </h3>
                      <span className="font-mono text-[10px] text-slate-400">{selectedNode.code}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenTagModal(selectedNode)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition-colors"
                      >
                        <Tag className="w-3 h-3" />
                        <span>Tag Entities</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(selectedNode)}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                        title="Edit Node"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

              {/* Node Metadata Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Hierarchy Level</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedNode.type}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Manager / In-Charge</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {selectedNode.headPerson || 'Unassigned'}
                  </span>
                </div>
                {selectedNode.phone && (
                  <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-[10px] text-slate-400 block">Phone / Hotline</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {selectedNode.phone}
                    </span>
                  </div>
                )}
                {selectedNode.notes && (
                  <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px]">
                    <span className="text-[10px] text-slate-400 block">Coverage Notes</span>
                    <span className="text-slate-600 dark:text-slate-300 italic">
                      {selectedNode.notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Distributor Market Hierarchy Card */}
              <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <Network className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Distributor Market Hierarchy Beat</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    {selectedNode.type}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/50">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Beat Code & Full Hierarchy</div>
                  <div className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-300 truncate">
                    {selectedNode.code} - {selectedNode.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleOpenAddMarketHierarchyModal(selectedNode.id)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Child Beat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenOnboardDistModal(selectedNode)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    <Users2 className="w-3.5 h-3.5" />
                    <span>+ Onboard Dist</span>
                  </button>
                </div>
              </div>

              {/* Tagged Associations Cards */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tagged Entities ({taggedDistributors.length + taggedCustomers.length + taggedFieldForce.length})
                  </span>
                  <button
                    onClick={() => handleOpenTagModal(selectedNode)}
                    className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Edit Tags
                  </button>
                </div>

                {/* Section 1: Tagged Distributors */}
                <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-1.5">
                      <Users2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Distributor Points ({taggedDistributors.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTagModal(selectedNode)}
                        className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Tag className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenOnboardDistModal(selectedNode)}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Onboard</span>
                      </button>
                    </div>
                  </div>
                  {taggedDistributors.length === 0 ? (
                    <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-amber-200/50 dark:border-amber-900/30 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>No distributors tagged to this level yet.</span>
                      <button
                        type="button"
                        onClick={() => handleOpenOnboardDistModal(selectedNode)}
                        className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        + Onboard Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {taggedDistributors.map((d) => (
                        <div
                          key={d.id}
                          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{d.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {d.code} • {d.marketHierarchy || `${selectedNode.code} - ${selectedNode.name}`}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono">
                            ৳ {(d.currentOutstandingBDT / 1000).toFixed(0)}k
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 2: Tagged Customers */}
                <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                    <div className="flex items-center gap-1.5">
                      <Contact2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Tagged Customers ({taggedCustomers.length})</span>
                    </div>
                  </div>
                  {taggedCustomers.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No direct customers tagged.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {taggedCustomers.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-purple-200/60 dark:border-purple-900/40 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {c.code} • {c.customerType}
                            </div>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                            {c.channel === 'Direct Sales' ? 'Direct' : 'DB'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 3: Tagged Field Force Officers */}
                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Field Force Reps ({taggedFieldForce.length})</span>
                    </div>
                  </div>
                  {taggedFieldForce.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No sales officers assigned.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {taggedFieldForce.map((r) => (
                        <div
                          key={r.id}
                          className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-900/40 text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{r.name}</div>
                            <div className="text-[10px] text-slate-400">{r.designation}</div>
                          </div>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              r.currentLocation?.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={r.currentLocation?.isOnline ? 'Online' : 'Offline'}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

      {/* MODAL 1: Add New Hierarchy Node */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Create Hierarchy Node
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNode} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Parent Hierarchy Node
                </label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {flatNodes.map((fn) => (
                    <option key={fn.id} value={fn.id}>
                      {'\u00A0'.repeat(fn.level * 3)} {fn.level > 0 ? '↳ ' : ''}{fn.name} ({fn.type} - {fn.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Node Hierarchy Level
                  </label>
                  <select
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-blue-600 dark:text-blue-400"
                  >
                    <option value="Market Hierarchy">Market Hierarchy (Beat)</option>
                    <option value="DB Point">Distributor Point (DB Point)</option>
                    <option value="Territory">Territory</option>
                    <option value="Area">Area</option>
                    <option value="Region">Region</option>
                    <option value="Division">Division</option>
                    <option value="Business Unit">Business Unit</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Node Code (Unique Identifier)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TER-SYLHET-01"
                    value={newNodeCode}
                    onChange={(e) => setNewNodeCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Node Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sylhet Sadar Commercial Territory"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    In-Charge Person / Manager
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tarek Jamil (TSO)"
                    value={newNodeHead}
                    onChange={(e) => setNewNodeHead(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+880 1711-..."
                    value={newNodePhone}
                    onChange={(e) => setNewNodePhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Coverage Notes & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Territory boundary, key markets, or regional hub remarks..."
                  value={newNodeNotes}
                  onChange={(e) => setNewNodeNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Create Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Existing Hierarchy Node */}
      {showEditModal && nodeToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Edit Hierarchy Node: {nodeToEdit.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Hierarchy Level Type
                  </label>
                  <select
                    value={nodeToEdit.type}
                    onChange={(e) =>
                      setNodeToEdit({ ...nodeToEdit, type: e.target.value as any })
                    }
                    disabled={nodeToEdit.type === 'Company'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-blue-600 dark:text-blue-400"
                  >
                    <option value="Company">Company</option>
                    <option value="Business Unit">Business Unit</option>
                    <option value="Division">Division</option>
                    <option value="Region">Region</option>
                    <option value="Area">Area</option>
                    <option value="Territory">Territory</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Node Code
                  </label>
                  <input
                    type="text"
                    required
                    value={nodeToEdit.code}
                    onChange={(e) => setNodeToEdit({ ...nodeToEdit, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={nodeToEdit.name}
                  onChange={(e) => setNodeToEdit({ ...nodeToEdit, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    In-Charge Person / Manager
                  </label>
                  <input
                    type="text"
                    value={nodeToEdit.headPerson || ''}
                    onChange={(e) => setNodeToEdit({ ...nodeToEdit, headPerson: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={nodeToEdit.phone || ''}
                    onChange={(e) => setNodeToEdit({ ...nodeToEdit, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Coverage Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={nodeToEdit.notes || ''}
                  onChange={(e) => setNodeToEdit({ ...nodeToEdit, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Tag Distributors, Customers & Field Force */}
      {showTagModal && nodeToTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Tag Entities to Hierarchy Node
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Node: <b className="text-slate-800 dark:text-slate-200">{nodeToTag.name}</b> ({nodeToTag.type} • {nodeToTag.code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTagModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Entity selector tabs */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTagModalActiveTab('distributors')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    tagModalActiveTab === 'distributors'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Users2 className="w-3.5 h-3.5" />
                  <span>Distributors ({selectedDistIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTagModalActiveTab('customers')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    tagModalActiveTab === 'customers'
                      ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Contact2 className="w-3.5 h-3.5" />
                  <span>Customers ({selectedCustIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTagModalActiveTab('fieldforce')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    tagModalActiveTab === 'fieldforce'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Field Force ({selectedFfIds.length})</span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter list..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-44"
                />
              </div>
            </div>

            {/* Entity Checkbox List */}
            <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 p-1">
              {/* Tab 1: Distributors */}
              {tagModalActiveTab === 'distributors' && (
                <>
                  {distributors
                    .filter(
                      (d) =>
                        d.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                        d.code.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                        d.district.toLowerCase().includes(tagSearchQuery.toLowerCase())
                    )
                    .map((d) => {
                      const isChecked = selectedDistIds.includes(d.id);
                      return (
                        <label
                          key={d.id}
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDistIds((prev) => [...prev, d.id]);
                                } else {
                                  setSelectedDistIds((prev) => prev.filter((id) => id !== d.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {d.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {d.code} • {d.dbPoint} • District: {d.district}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              ৳ {d.currentOutstandingBDT.toLocaleString()}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-sans">Outstanding</span>
                          </div>
                        </label>
                      );
                    })}
                </>
              )}

              {/* Tab 2: Customers */}
              {tagModalActiveTab === 'customers' && (
                <>
                  {customers
                    .filter(
                      (c) =>
                        c.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                        c.code.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                        c.customerType.toLowerCase().includes(tagSearchQuery.toLowerCase())
                    )
                    .map((c) => {
                      const isChecked = selectedCustIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCustIds((prev) => [...prev, c.id]);
                                } else {
                                  setSelectedCustIds((prev) => prev.filter((id) => id !== c.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {c.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {c.code} • {c.customerType} • Channel: {c.channel}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {c.pricingTier || 'Standard'}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </>
              )}

              {/* Tab 3: Field Force */}
              {tagModalActiveTab === 'fieldforce' && (
                <>
                  {fieldForceReps
                    .filter(
                      (r) =>
                        r.name.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                        r.code.toLowerCase().includes(tagSearchQuery.toLowerCase()) ||
                        r.designation.toLowerCase().includes(tagSearchQuery.toLowerCase())
                    )
                    .map((r) => {
                      const isChecked = selectedFfIds.includes(r.id);
                      return (
                        <label
                          key={r.id}
                          className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFfIds((prev) => [...prev, r.id]);
                                } else {
                                  setSelectedFfIds((prev) => prev.filter((id) => id !== r.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {r.name}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {r.code} • {r.designation}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-[10px] text-slate-500 flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                r.currentLocation?.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                            <span>{r.currentLocation?.address || r.lastKnownAddress || 'Active'}</span>
                          </div>
                        </label>
                      );
                    })}
                </>
              )}
            </div>

            {/* Quick summary footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500">
                Total tagged: <b className="text-amber-600">{selectedDistIds.length} distributors</b>,{' '}
                <b className="text-purple-600">{selectedCustIds.length} customers</b>,{' '}
                <b className="text-emerald-600">{selectedFfIds.length} sales reps</b>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTags}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-xs"
                >
                  Save Entity Tags
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Onboard Distributor Directly to Selected Org Hierarchy Node */}
      {showOnboardDistModal && targetOrgNodeForDist && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setShowOnboardDistModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Onboard Distributor to Org Hierarchy
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Register a new authorized dealer tagged directly to{' '}
                    <b className="text-slate-800 dark:text-slate-200">{targetOrgNodeForDist.name}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOnboardDistModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {onboardDistError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{onboardDistError}</span>
              </div>
            )}

            <form onSubmit={handleSaveOnboardDistributor} className="space-y-3.5">
              {/* Linked Market Hierarchy Display */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5" />
                  <span>Assigned Market Hierarchy Beat</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-blue-900 dark:text-blue-200">
                  <span>{targetOrgNodeForDist.code} - {targetOrgNodeForDist.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-sans">
                    {targetOrgNodeForDist.type}
                  </span>
                </div>
              </div>

              {/* Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Distributor Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDistCode}
                    onChange={(e) => setNewDistCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Operating District *
                  </label>
                  <select
                    value={newDistDistrict}
                    onChange={(e) => setNewDistDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {BANGLADESH_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Distributor Enterprise Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M/S Green Power Electric Corp"
                  value={newDistName}
                  onChange={(e) => setNewDistName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Proprietor / Owner Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haji Md. Abdur Rahman"
                    value={newDistOwner}
                    onChange={(e) => setNewDistOwner(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Phone / Mobile *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +880 1712-345678"
                    value={newDistPhone}
                    onChange={(e) => setNewDistPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Credit Limit (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={newDistCreditLimit}
                    onChange={(e) => setNewDistCreditLimit(Number(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment Terms (Days)
                  </label>
                  <select
                    value={newDistPaymentTerms}
                    onChange={(e) => setNewDistPaymentTerms(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={15}>15 Days</option>
                    <option value={30}>30 Days (Standard)</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOnboardDistModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOnboardingDist}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isOnboardingDist ? 'Onboarding...' : 'Onboard Distributor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Add Distributor Market Hierarchy Beat / Point */}
      {showAddMarketHierarchyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setShowAddMarketHierarchyModal(false)}
        >
          <div
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Add Distributor Market Hierarchy
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Create a commercial market hierarchy beat or distribution point under your enterprise org tree
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMarketHierarchyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {mhError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{mhError}</span>
              </div>
            )}

            <form onSubmit={handleSaveMarketHierarchyNode} className="space-y-3.5">
              {/* Parent Node Selector */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Parent Organization Hierarchy Branch *
                </label>
                <select
                  value={mhParentId}
                  onChange={(e) => {
                    setMhParentId(e.target.value);
                    const p = findNode(orgHierarchy, e.target.value);
                    if (p) setMhRegion(p.name);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {flatNodes.map((fn) => (
                    <option key={fn.id} value={fn.id}>
                      {'\u00A0'.repeat(fn.level * 3)} {fn.level > 0 ? '↳ ' : ''}{fn.name} ({fn.type} - {fn.code})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  The market hierarchy beat will be placed directly under this division, region, area, or territory.
                </span>
              </div>

              {/* Code, Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Hierarchy Level *
                  </label>
                  <select
                    value={mhType}
                    onChange={(e) => setMhType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-emerald-600 dark:text-emerald-400"
                  >
                    <option value="Market Hierarchy">Market Hierarchy (Beat)</option>
                    <option value="DB Point">Distributor Point (DB Point)</option>
                    <option value="Territory">Territory</option>
                    <option value="Area">Area Beat</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Beat Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-DHK-01"
                    value={mhCode}
                    onChange={(e) => setMhCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Operating District *
                  </label>
                  <select
                    value={mhDistrict}
                    onChange={(e) => setMhDistrict(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Market Hierarchy Beat / Point Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uttara Commercial Beat, Mirpur-10 Electronics Market"
                  value={mhName}
                  onChange={(e) => setMhName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Field Officer / Manager In-Charge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Md. Kabir Hossain (TSO)"
                    value={mhHeadPerson}
                    onChange={(e) => setMhHeadPerson(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone / Hotline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +880 1712-345678"
                    value={mhPhone}
                    onChange={(e) => setMhPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Assign Existing Distributors to this Beat */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <Users2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Assign Existing Distributors to this Beat ({mhSelectedDistributorIds.length} selected)</span>
                  </div>
                  {distributors.length > 4 && (
                    <input
                      type="text"
                      placeholder="Filter distributors..."
                      value={mhDistSearch}
                      onChange={(e) => setMhDistSearch(e.target.value)}
                      className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-36"
                    />
                  )}
                </div>

                {distributors.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No distributors created in system yet.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {distributors
                      .filter((d) =>
                        d.name.toLowerCase().includes(mhDistSearch.toLowerCase()) ||
                        d.code.toLowerCase().includes(mhDistSearch.toLowerCase())
                      )
                      .map((d) => {
                        const isChecked = mhSelectedDistributorIds.includes(d.id);
                        return (
                          <label
                            key={d.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setMhSelectedDistributorIds((prev) => [...prev, d.id]);
                                  } else {
                                    setMhSelectedDistributorIds((prev) => prev.filter((id) => id !== d.id));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-white">{d.name}</span>
                                <span className="font-mono text-[10px] text-slate-400 ml-1.5">({d.code})</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {d.marketHierarchy || 'No Beat Assigned'}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Also Onboard New Distributor Checkbox */}
              <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={mhAlsoOnboardDist}
                    onChange={(e) => setMhAlsoOnboardDist(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Also onboard a new distributor into this market hierarchy now</span>
                </label>

                {mhAlsoOnboardDist && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Distributor Code *
                      </label>
                      <input
                        type="text"
                        value={mhNewDistCode}
                        onChange={(e) => setMhNewDistCode(e.target.value.toUpperCase())}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Enterprise Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. M/S Green Power Electric Corp"
                        value={mhNewDistName}
                        onChange={(e) => setMhNewDistName(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Proprietor / Owner Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Haji Md. Abdur Rahman"
                        value={mhNewDistOwner}
                        onChange={(e) => setMhNewDistOwner(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Phone / Mobile *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +880 1712-345678"
                        value={mhNewDistPhone}
                        onChange={(e) => setMhNewDistPhone(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500">
                  Full Identifier: <b className="text-emerald-600 font-mono">{mhCode || 'CODE'} - {mhName || 'Name'}</b>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMarketHierarchyModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mhIsSaving}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{mhIsSaving ? 'Saving...' : 'Add Market Hierarchy'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/20'
                : toastMessage.type === 'warning'
                ? 'bg-amber-600 text-white border-amber-500 shadow-amber-600/20'
                : 'bg-rose-600 text-white border-rose-500 shadow-rose-600/20'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 hover:opacity-80 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

