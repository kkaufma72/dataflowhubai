/**
 * Default Project Setup Hook
 * 
 * Creates default project and sample datasets for new users
 */

import { useEffect, useState } from 'react';
import { useMLContext } from '../context/MLContext';
import { useAuth } from '../components/auth/AuthProvider';
import { supabase } from '../lib/supabase';

export const useDefaultProjectSetup = () => {
  const { user } = useAuth();
  const { datasets } = useMLContext();
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    setupDefaultProject();
  }, [user]);

  const setupDefaultProject = async () => {
    if (!user || isSetupComplete) return;

    try {
      // Check if user has any projects
      if (projects && projects.length > 0) {
        setIsSetupComplete(true);
        return;
      }

      console.log('🎉 Setting up default project for new user...');

      // Create default project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: 'My First Project',
          description: 'Welcome to DataFlowHub! Start exploring with sample data.',
          user_id: user.id
        })
        .select()
        .single();

      if (projectError) {
        console.error('Project creation error:', projectError);
        return;
      }

      console.log('✅ Default project created:', newProject);

      // Create sample datasets
      const sampleDatasets = [
        {
          name: 'Customer Analytics Sample',
          description: 'Sample customer data for analysis',
          file_type: 'csv',
          file_size: '125 KB',
          row_count: 1250,
          column_count: 15,
          preview_data: {
            columns: ['customer_id', 'name', 'email', 'age', 'city', 'signup_date', 'total_purchases', 'lifetime_value', 'segment', 'status', 'last_purchase', 'preference', 'referral_source', 'satisfaction_score', 'churn_risk'],
            rows: Array.from({ length: 25 }, (_, i) => [
              1000 + i,
              `Customer ${i + 1}`,
              `customer${i + 1}@example.com`,
              25 + Math.floor(Math.random() * 40),
              ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
              '2024-01-15',
              Math.floor(Math.random() * 50),
              Math.floor(Math.random() * 5000),
              ['Premium', 'Standard', 'Basic'][i % 3],
              ['Active', 'Inactive'][i % 2],
              '2024-10-15',
              ['Email', 'SMS', 'Both'][i % 3],
              ['Organic', 'Paid', 'Referral'][i % 3],
              3 + Math.floor(Math.random() * 3),
              ['Low', 'Medium', 'High'][i % 3]
            ])
          },
          project_id: newProject.id,
          user_id: user.id
        },
        {
          name: 'Sales Performance Q4',
          description: 'Quarterly sales data',
          file_type: 'excel',
          file_size: '85 KB',
          row_count: 850,
          column_count: 8,
          preview_data: {
            columns: ['sale_id', 'product', 'amount', 'quantity', 'date', 'region', 'rep_name', 'commission'],
            rows: Array.from({ length: 25 }, (_, i) => [
              5000 + i,
              `Product ${i % 5 + 1}`,
              Math.floor(Math.random() * 1000) + 100,
              Math.floor(Math.random() * 10) + 1,
              '2024-10-20',
              ['North', 'South', 'East', 'West'][i % 4],
              `Rep ${i % 10 + 1}`,
              Math.floor(Math.random() * 100)
            ])
          },
          project_id: newProject.id,
          user_id: user.id
        },
        {
          name: 'Product Catalog',
          description: 'Product inventory and pricing',
          file_type: 'json',
          file_size: '45 KB',
          row_count: 450,
          column_count: 12,
          preview_data: {
            columns: ['sku', 'name', 'category', 'price', 'cost', 'stock', 'supplier', 'rating', 'reviews', 'featured', 'discount', 'active'],
            rows: Array.from({ length: 25 }, (_, i) => [
              `SKU-${1000 + i}`,
              `Product ${i + 1}`,
              ['Electronics', 'Clothing', 'Food', 'Home'][i % 4],
              Math.floor(Math.random() * 200) + 20,
              Math.floor(Math.random() * 100) + 10,
              Math.floor(Math.random() * 500),
              `Supplier ${i % 5 + 1}`,
              (3 + Math.random() * 2).toFixed(1),
              Math.floor(Math.random() * 1000),
              i % 3 === 0,
              i % 4 === 0 ? 10 : 0,
              true
            ])
          },
          project_id: newProject.id,
          user_id: user.id
        }
      ];

      const { data: createdDatasets, error: datasetsError } = await supabase
        .from('datasets')
        .insert(sampleDatasets)
        .select();

      if (datasetsError) {
        console.error('Sample datasets error:', datasetsError);
        return;
      }

      console.log('✅ Sample datasets created:', createdDatasets?.length);

      // Welcome notification removed per user request

      setIsSetupComplete(true);

      // Reload to show new data
      setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
      console.error('Setup error:', error);
    }
  };

  return { isSetupComplete };
};

