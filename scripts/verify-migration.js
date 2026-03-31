#!/usr/bin/env node
/**
 * Script de vérification de la migration currency
 * Vérifie que tous les fichiers ont été correctement migrés
 */

const fs = require('fs');
const path = require('path');

function findFiles(dir, extension = '.tsx') {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(findFiles(filePath, extension));
      }
    } else {
      if (file.endsWith(extension) || file.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  });

  return results;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);

  const issues = [];

  // Vérifier les currencies hardcodées
  const hardcodedCurrencyPatterns = [
    /\.toLocaleString\([^)]*currency:\s*['"`]EUR['"`]/g,
    /\.toLocaleString\([^)]*currency:\s*['"`]USD['"`]/g,
    /formatCurrency\([^)]+,\s*['"`]EUR['"`]/g,
    /formatCurrency\([^)]+,\s*['"`]USD['"`]/g
  ];

  hardcodedCurrencyPatterns.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        type: 'HARDCODED_CURRENCY',
        count: matches.length,
        pattern: ['EUR in toLocaleString', 'USD in toLocaleString', 'EUR in formatCurrency', 'USD in formatCurrency'][index]
      });
    }
  });

  // Vérifier si formatAmount est utilisé sans useMerchantCurrency
  const hasFormatAmount = content.includes('formatAmount(');
  const hasUseMerchantCurrency = content.includes('useMerchantCurrency');
  const isClientComponent = content.includes("'use client'") || content.includes('"use client"');

  if (hasFormatAmount && isClientComponent && !hasUseMerchantCurrency) {
    issues.push({
      type: 'MISSING_HOOK',
      description: 'formatAmount used without useMerchantCurrency hook'
    });
  }

  // Vérifier si formatCurrency est utilisé directement (sauf dans les utilitaires)
  const isUtilityFile = relativePath.includes('lib/') || relativePath.includes('utils/') ||
                       relativePath.includes('hooks/') || relativePath.includes('scripts/');

  if (!isUtilityFile) {
    const formatCurrencyUsage = content.match(/formatCurrency\s*\(/g);
    if (formatCurrencyUsage && !content.includes('// MIGRATION_NEEDED')) {
      issues.push({
        type: 'DIRECT_FORMAT_CURRENCY',
        count: formatCurrencyUsage.length,
        description: 'Direct formatCurrency usage instead of formatAmount'
      });
    }
  }

  return { file: relativePath, issues };
}

function main() {
  console.log('🔍 Verifying currency migration...\n');

  const srcDir = path.join(process.cwd(), 'src');
  const files = findFiles(srcDir);

  let totalIssues = 0;
  let filesWithIssues = 0;

  files.forEach(file => {
    const result = checkFile(file);

    if (result.issues.length > 0) {
      filesWithIssues++;
      console.log(`❌ ${result.file}:`);

      result.issues.forEach(issue => {
        totalIssues++;
        console.log(`   • ${issue.type}: ${issue.description || issue.pattern}`);
        if (issue.count) {
          console.log(`     Count: ${issue.count}`);
        }
      });
      console.log('');
    }
  });

  console.log(`\n📊 Migration Verification Results:`);
  console.log(`   Files checked: ${files.length}`);
  console.log(`   Files with issues: ${filesWithIssues}`);
  console.log(`   Total issues: ${totalIssues}`);

  if (totalIssues === 0) {
    console.log('\n🎉 ✅ All files have been successfully migrated!');
    console.log('Currency system is now unified and uses merchant settings.');
  } else {
    console.log('\n⚠️  Some issues found. Please review and fix the above problems.');
  }

  // Statistiques de migration
  const successfulFiles = files.length - filesWithIssues;
  const successRate = Math.round((successfulFiles / files.length) * 100);

  console.log(`\n📈 Migration Success Rate: ${successRate}% (${successfulFiles}/${files.length} files)`);
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, findFiles };