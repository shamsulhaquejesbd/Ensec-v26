import React from 'react';
import { FinishedProductsPage } from './FinishedProductsPage.tsx';
import { ProductCategoriesPage } from './ProductCategoriesPage.tsx';
import { ProductBrandsPage } from './ProductBrandsPage.tsx';
import { RawMaterialsPage } from './RawMaterialsPage.tsx';
import { RawMaterialsCategoryPage } from './RawMaterialsCategoryPage.tsx';
import { RawMaterialsClassificationPage } from './RawMaterialsClassificationPage.tsx';
import { WarehousePage } from './WarehousePage.tsx';
import { DistributorModule } from '../distribution/DistributorModule.tsx';
import { CustomerDirectoryPage } from './CustomerDirectoryPage.tsx';
import { CustomerCRMModule } from '../crm/CustomerCRMModule.tsx';
import { OrgHierarchyAndRoles } from '../settings/OrgHierarchyAndRoles.tsx';
import { FieldForcePage } from './FieldForcePage.tsx';
import { DepartmentPage } from './DepartmentPage.tsx';
import { ChannelPricingPage } from './ChannelPricingPage.tsx';
import { BankListPage } from './BankListPage.tsx';
import { UnitOfMeasurementPage } from './UnitOfMeasurementPage.tsx';
import { OffersPromotionModule } from '../offers/OffersPromotionModule.tsx';

export interface BasicDataHubProps {
  initialTab?:
    | 'products'
    | 'categories'
    | 'brands'
    | 'raw-materials'
    | 'raw-categories'
    | 'raw-classifications'
    | 'warehouses'
    | 'distributors'
    | 'customers'
    | 'pricing-matrix'
    | 'org-hierarchy'
    | 'field-force'
    | 'departments'
    | 'banks'
    | 'uom'
    | 'offers';
  onNavigate?: (module: string) => void;
}

export const BasicDataHub: React.FC<BasicDataHubProps> = ({ initialTab = 'products', onNavigate }) => {
  if (initialTab === 'categories') return <ProductCategoriesPage />;
  if (initialTab === 'brands') return <ProductBrandsPage />;
  if (initialTab === 'raw-materials') return <RawMaterialsPage onNavigate={onNavigate} />;
  if (initialTab === 'raw-categories') return <RawMaterialsCategoryPage onNavigate={onNavigate} />;
  if (initialTab === 'raw-classifications') return <RawMaterialsClassificationPage onNavigate={onNavigate} />;
  if (initialTab === 'warehouses') return <WarehousePage />;
  if (initialTab === 'distributors') return <DistributorModule onNavigate={onNavigate} />;
  if (initialTab === 'customers') return <CustomerDirectoryPage />;
  if (initialTab === 'pricing-matrix') return <ChannelPricingPage />;
  if (initialTab === 'org-hierarchy') return <OrgHierarchyAndRoles onNavigate={onNavigate} />;
  if (initialTab === 'field-force') return <FieldForcePage />;
  if (initialTab === 'departments') return <DepartmentPage />;
  if (initialTab === 'banks') return <BankListPage />;
  if (initialTab === 'uom') return <UnitOfMeasurementPage />;
  if (initialTab === 'offers') return <OffersPromotionModule />;
  return <FinishedProductsPage />;
};

export {
  FinishedProductsPage,
  ProductCategoriesPage,
  ProductBrandsPage,
  RawMaterialsPage,
  RawMaterialsCategoryPage,
  RawMaterialsClassificationPage,
  WarehousePage,
  DistributorModule,
  CustomerDirectoryPage,
  CustomerCRMModule,
  ChannelPricingPage,
  OrgHierarchyAndRoles,
  FieldForcePage,
  DepartmentPage,
  BankListPage,
  UnitOfMeasurementPage,
  OffersPromotionModule,
};
