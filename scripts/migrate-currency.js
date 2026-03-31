#!/usr/bin/env node
/**
 * Script de migration automatique pour remplacer les formatCurrency
 * et les currencies hardcodées par le nouveau système unifié
 */

const fs = require('fs');
const path = require('path');

// Fichiers déjà migrés manuellement (à ignorer)
const MIGRATED_FILES = [
  'src/app/dashboard/page.tsx',
  'src/components/client-profile/tabs/CreditsTabReal.tsx',
  'src/lib/utils.ts',
  'src/lib/prisma.ts',
  'src/utils/database.ts'
];

// Patterns à rechercher et remplacer
const PATTERNS = [
  // formatCurrency sans currency explicite
  {
    search: /formatCurrency\(([^,)]+)\)/g,
    replace: 'formatAmount($1)'
  },

  // .toLocaleString avec currency hardcodée EUR
  {
    search: /\.toLocaleString\('fr-FR',\s*{\s*style:\s*'currency',\s*currency:\s*'EUR'\s*}\)/g,
    replace: ' // MIGRATION_NEEDED: Use formatAmount() from useMerchantCurrency hook'
  },

  // .toLocaleString avec currency hardcodée TND
  {
    search: /\.toLocaleString\('fr-TN',\s*{\s*style:\s*'currency',\s*currency:\s*'TND'\s*}\)/g,
    replace: ' // MIGRATION_NEEDED: Use formatAmount() from useMerchantCurrency hook'
  }
];

// Remplacements d'imports
const IMPORT_PATTERNS = [
  {
    search: /import\s*{\s*([^}]*),\s*formatCurrency\s*([^}]*)\s*}\s*from\s*['"]@\/lib\/utils['"]/g,
    replace: 'import { $1$2 } from "@/lib/utils"\nimport { useMerchantCurrency } from "@/hooks/useMerchantCurrency"'
  }
];

function findFiles(dir, extension = '.tsx') {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      // Ignorer node_modules et .next
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

function migrateFile(filePath) {
  // Vérifier si le fichier est déjà migré
  const relativePath = path.relative(process.cwd(), filePath);
  if (MIGRATED_FILES.includes(relativePath)) {
    console.log(`⏭️  Ignoring ${relativePath} (already migrated manually)`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    let needsHook = false;

    // Appliquer les patterns de remplacement
    PATTERNS.forEach(pattern => {
      const matches = content.match(pattern.search);
      if (matches) {
        console.log(`🔄 Found ${matches.length} pattern(s) in ${relativePath}`);
        content = content.replace(pattern.search, pattern.replace);
        hasChanges = true;

        // Si on remplace formatCurrency par formatAmount, on a besoin du hook
        if (pattern.replace.includes('formatAmount')) {
          needsHook = true;
        }
      }
    });

    // Appliquer les patterns d'import si nécessaire
    if (needsHook) {
      IMPORT_PATTERNS.forEach(pattern => {
        if (content.match(pattern.search)) {
          content = content.replace(pattern.search, pattern.replace);
          hasChanges = true;
        }
      });
    }

    // Sauvegarder si des changements ont été faits
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Migrated ${relativePath}`);

      if (needsHook) {
        console.log(`⚠️  MANUAL ACTION REQUIRED: Add useMerchantCurrency hook to ${relativePath}`);
      }

      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

// Script principal
function main() {
  console.log('🚀 Starting currency migration script...\n');

  const srcDir = path.join(process.cwd(), 'src');
  const files = findFiles(srcDir);

  console.log(`📁 Found ${files.length} TypeScript files to check\n`);

  let migratedCount = 0;

  files.forEach(file => {
    if (migrateFile(file)) {
      migratedCount++;
    }
  });

  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 ${migratedCount} files migrated out of ${files.length} checked`);

  if (migratedCount > 0) {
    console.log('\n⚠️  MANUAL STEPS REQUIRED:');
    console.log('1. Add useMerchantCurrency hook to components that use formatAmount()');
    console.log('2. Replace formatCurrency calls with formatAmount from the hook');
    console.log('3. Test the application to ensure everything works');
    console.log('4. Look for // MIGRATION_NEEDED comments for manual fixes');
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateFile, findFiles };