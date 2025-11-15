#!/usr/bin/env node

/**
 * Design System Global Refactoring Script
 * Applies color replacements (purple/indigo → primary) across all source files
 * 
 * Usage: node scripts/refactor-design-system.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color replacement mapping
const COLOR_REPLACEMENTS = [
  // Purple variants
  { pattern: /text-purple-900\b/g, replacement: 'text-primary-900' },
  { pattern: /text-purple-800\b/g, replacement: 'text-primary-800' },
  { pattern: /text-purple-700\b/g, replacement: 'text-primary-700' },
  { pattern: /text-purple-600\b/g, replacement: 'text-primary-600' },
  { pattern: /text-purple-500\b/g, replacement: 'text-primary' },
  { pattern: /text-purple-400\b/g, replacement: 'text-primary-400' },
  { pattern: /text-purple-100\b/g, replacement: 'text-primary/10' },
  
  { pattern: /bg-purple-600\b/g, replacement: 'bg-primary-600' },
  { pattern: /bg-purple-500\b/g, replacement: 'bg-primary' },
  { pattern: /bg-purple-100\b/g, replacement: 'bg-primary/10' },
  { pattern: /bg-purple-50\b/g, replacement: 'bg-primary/5' },
  { pattern: /bg-purple-500\/10\b/g, replacement: 'bg-primary/10' },
  { pattern: /bg-purple-500\/20\b/g, replacement: 'bg-primary/20' },
  { pattern: /bg-purple-600\/10\b/g, replacement: 'bg-primary/10' },
  { pattern: /bg-purple-600\/20\b/g, replacement: 'bg-primary/20' },
  
  { pattern: /border-purple-500\b/g, replacement: 'border-primary' },
  { pattern: /border-purple-400\b/g, replacement: 'border-primary-400' },
  { pattern: /border-purple-300\b/g, replacement: 'border-primary/30' },
  { pattern: /border-purple-200\b/g, replacement: 'border-primary/20' },
  { pattern: /border-purple-500\/20\b/g, replacement: 'border-primary/20' },
  { pattern: /border-purple-500\/40\b/g, replacement: 'border-primary/40' },
  
  { pattern: /from-purple-600\b/g, replacement: 'from-primary-600' },
  { pattern: /from-purple-500\b/g, replacement: 'from-primary' },
  { pattern: /from-purple-100\b/g, replacement: 'from-primary/10' },
  { pattern: /from-purple-50\b/g, replacement: 'from-primary/5' },
  
  { pattern: /to-purple-700\b/g, replacement: 'to-primary-700' },
  { pattern: /to-purple-600\b/g, replacement: 'to-primary-600' },
  { pattern: /to-purple-100\b/g, replacement: 'to-primary/10' },
  { pattern: /to-purple-50\b/g, replacement: 'to-primary/5' },
  
  { pattern: /via-purple-600\b/g, replacement: 'via-primary-600' },
  { pattern: /via-purple-700\b/g, replacement: 'via-primary-700' },
  { pattern: /via-purple-50\b/g, replacement: 'via-primary/5' },
  
  { pattern: /hover:bg-purple-700\b/g, replacement: 'hover:bg-primary-700' },
  { pattern: /hover:bg-purple-600\b/g, replacement: 'hover:bg-primary-600' },
  { pattern: /hover:bg-purple-100\b/g, replacement: 'hover:bg-primary/10' },
  { pattern: /hover:bg-purple-50\b/g, replacement: 'hover:bg-primary/5' },
  { pattern: /hover:bg-purple-600\/20\b/g, replacement: 'hover:bg-primary/20' },
  
  { pattern: /hover:text-purple-700\b/g, replacement: 'hover:text-primary-700' },
  { pattern: /hover:text-purple-600\b/g, replacement: 'hover:text-primary-600' },
  { pattern: /hover:text-purple-500\b/g, replacement: 'hover:text-primary' },
  { pattern: /hover:text-purple-400\b/g, replacement: 'hover:text-primary-400' },
  
  { pattern: /hover:border-purple-500\/40\b/g, replacement: 'hover:border-primary/40' },
  { pattern: /hover:border-purple-400\b/g, replacement: 'hover:border-primary-400' },
  { pattern: /hover:border-purple-300\b/g, replacement: 'hover:border-primary/30' },
  
  { pattern: /hover:from-purple-700\b/g, replacement: 'hover:from-primary-700' },
  { pattern: /hover:to-purple-700\b/g, replacement: 'hover:to-primary-700' },
  { pattern: /hover:via-purple-700\b/g, replacement: 'hover:via-primary-700' },
  
  // Indigo variants
  { pattern: /text-indigo-900\b/g, replacement: 'text-primary-900' },
  { pattern: /text-indigo-800\b/g, replacement: 'text-primary-800' },
  { pattern: /text-indigo-700\b/g, replacement: 'text-primary-700' },
  { pattern: /text-indigo-600\b/g, replacement: 'text-primary-600' },
  { pattern: /text-indigo-500\b/g, replacement: 'text-primary' },
  { pattern: /text-indigo-400\b/g, replacement: 'text-primary-400' },
  { pattern: /text-indigo-200\b/g, replacement: 'text-primary/20' },
  { pattern: /text-indigo-100\b/g, replacement: 'text-primary/10' },
  
  { pattern: /bg-indigo-600\b/g, replacement: 'bg-primary-600' },
  { pattern: /bg-indigo-500\b/g, replacement: 'bg-primary' },
  { pattern: /bg-indigo-100\b/g, replacement: 'bg-primary/10' },
  { pattern: /bg-indigo-50\b/g, replacement: 'bg-primary/5' },
  { pattern: /bg-indigo-500\/10\b/g, replacement: 'bg-primary/10' },
  { pattern: /bg-indigo-500\/20\b/g, replacement: 'bg-primary/20' },
  { pattern: /bg-indigo-600\/10\b/g, replacement: 'bg-primary/10' },
  { pattern: /bg-indigo-600\/20\b/g, replacement: 'bg-primary/20' },
  
  { pattern: /border-indigo-500\b/g, replacement: 'border-primary' },
  { pattern: /border-indigo-400\b/g, replacement: 'border-primary-400' },
  { pattern: /border-indigo-300\b/g, replacement: 'border-primary/30' },
  { pattern: /border-indigo-200\b/g, replacement: 'border-primary/20' },
  { pattern: /border-indigo-100\b/g, replacement: 'border-primary/10' },
  
  { pattern: /from-indigo-800\b/g, replacement: 'from-primary-800' },
  { pattern: /from-indigo-700\b/g, replacement: 'from-primary-700' },
  { pattern: /from-indigo-600\b/g, replacement: 'from-primary-600' },
  { pattern: /from-indigo-500\b/g, replacement: 'from-primary' },
  { pattern: /from-indigo-100\b/g, replacement: 'from-primary/10' },
  { pattern: /from-indigo-50\b/g, replacement: 'from-primary/5' },
  { pattern: /from-indigo-50\/30\b/g, replacement: 'from-primary/5' },
  
  { pattern: /to-indigo-800\b/g, replacement: 'to-primary-800' },
  { pattern: /to-indigo-700\b/g, replacement: 'to-primary-700' },
  { pattern: /to-indigo-600\b/g, replacement: 'to-primary-600' },
  { pattern: /to-indigo-100\b/g, replacement: 'to-primary/10' },
  { pattern: /to-indigo-50\b/g, replacement: 'to-primary/5' },
  { pattern: /to-indigo-50\/20\b/g, replacement: 'to-primary/5' },
  
  { pattern: /via-indigo-600\b/g, replacement: 'via-primary-600' },
  
  { pattern: /hover:bg-indigo-700\b/g, replacement: 'hover:bg-primary-700' },
  { pattern: /hover:bg-indigo-600\b/g, replacement: 'hover:bg-primary-600' },
  { pattern: /hover:bg-indigo-100\b/g, replacement: 'hover:bg-primary/10' },
  { pattern: /hover:bg-indigo-50\b/g, replacement: 'hover:bg-primary/5' },
  
  { pattern: /hover:text-indigo-700\b/g, replacement: 'hover:text-primary-700' },
  { pattern: /hover:text-indigo-600\b/g, replacement: 'hover:text-primary-600' },
  { pattern: /hover:text-indigo-500\b/g, replacement: 'hover:text-primary' },
  { pattern: /hover:text-indigo-400\b/g, replacement: 'hover:text-primary-400' },
  { pattern: /hover:text-indigo-300\b/g, replacement: 'hover:text-primary-400' },
  
  { pattern: /hover:border-indigo-500\/50\b/g, replacement: 'hover:border-primary/50' },
  { pattern: /hover:border-indigo-500\b/g, replacement: 'hover:border-primary' },
  { pattern: /hover:border-indigo-400\b/g, replacement: 'hover:border-primary-400' },
  
  { pattern: /hover:from-indigo-700\b/g, replacement: 'hover:from-primary-700' },
  { pattern: /hover:to-indigo-700\b/g, replacement: 'hover:to-primary-700' },
  { pattern: /hover:from-indigo-100\b/g, replacement: 'hover:from-primary/10' },
  { pattern: /hover:to-indigo-100\b/g, replacement: 'hover:to-primary/10' },
  
  // Focus states
  { pattern: /focus:ring-indigo-500\b/g, replacement: 'focus:ring-primary' },
  { pattern: /focus:ring-indigo-200\b/g, replacement: 'focus:ring-primary/20' },
  { pattern: /focus:border-indigo-500\b/g, replacement: 'focus:border-primary' },
  { pattern: /focus:ring-purple-500\b/g, replacement: 'focus:ring-primary' },
  
  // Ring states
  { pattern: /ring-indigo-100\b/g, replacement: 'ring-primary/10' },
  { pattern: /ring-4 ring-indigo-100\b/g, replacement: 'ring-4 ring-primary/10' },
];

// Files to process (exclude already refactored and non-relevant files)
const EXCLUDED_FILES = [
  'ModelTraining.tsx',
  'DashboardKoyfin.tsx',
  'DataManagementHybrid.tsx',
  'ModelMonitoring.tsx',
  'node_modules',
  '.git',
  'dist',
  'build',
  '.md', // Exclude markdown documentation
];

function shouldProcessFile(filePath) {
  // Only process .tsx and .ts files in src directory
  if (!filePath.includes('/src/') || !filePath.match(/\.(tsx?|jsx?)$/)) {
    return false;
  }
  
  // Check if file is in exclusion list
  for (const excluded of EXCLUDED_FILES) {
    if (filePath.includes(excluded)) {
      return false;
    }
  }
  
  return true;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let replacementCount = 0;
    
    // Apply all color replacements
    for (const { pattern, replacement } of COLOR_REPLACEMENTS) {
      const before = content;
      content = content.replace(pattern, replacement);
      if (before !== content) {
        modified = true;
        const matches = before.match(pattern);
        if (matches) {
          replacementCount += matches.length;
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return replacementCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip excluded directories
      if (!EXCLUDED_FILES.some(ex => filePath.includes(ex))) {
        getAllFiles(filePath, fileList);
      }
    } else if (shouldProcessFile(filePath)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function main() {
  console.log('🎨 Design System Global Refactoring Script\n');
  console.log('Scanning for files to process...\n');
  
  const srcDir = path.join(__dirname, '..', 'src');
  const files = getAllFiles(srcDir);
  
  console.log(`Found ${files.length} files to process\n`);
  
  let totalReplacements = 0;
  let filesModified = 0;
  
  files.forEach(file => {
    const replacements = processFile(file);
    if (replacements > 0) {
      filesModified++;
      totalReplacements += replacements;
      const relativePath = path.relative(process.cwd(), file);
      console.log(`✓ ${relativePath} (${replacements} replacements)`);
    }
  });
  
  console.log(`\n✅ Refactoring complete!`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  
  // Verify no purple/indigo refs remain
  console.log(`\n🔍 Verifying remaining purple/indigo references...`);
  try {
    const remaining = execSync(
      `grep -r "purple-\\|indigo-" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules" | wc -l`,
      { encoding: 'utf8' }
    ).trim();
    
    console.log(`   Remaining references: ${remaining}`);
    
    if (parseInt(remaining) > 0) {
      console.log(`\n⚠️  Some references still remain. Run this to see them:`);
      console.log(`   grep -r "purple-\\|indigo-" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"`);
    } else {
      console.log(`   ✨ All purple/indigo references successfully replaced!`);
    }
  } catch (error) {
    console.log(`   (Could not verify - grep command not available)`);
  }
  
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Run: npm run build`);
  console.log(`   2. Test the application thoroughly`);
  console.log(`   3. Commit changes with: git add . && git commit -m "refactor: global purple/indigo → primary color replacement"`);
}

main();
