#!/usr/bin/env node
/**
 * Script complet pour finaliser la migration currency
 * Ajoute automatiquement les hooks useMerchantCurrency là où c'est nécessaire
 */

const fs = require('fs');
const path = require('path');

// Fichiers à migrer avec leurs signatures de composant
const TARGET_FILES = [
  {
    file: 'src/app/credits/page.tsx',
    componentPattern: /function\s+(\w*Credits?\w*)\s*\(\s*[^)]*\)\s*{/,
    isClientComponent: true
  },
  {
    file: 'src/app/credits/[id]/page.tsx',
    componentPattern: /export\s+default\s+function\s+(\w+)/,
    isClientComponent: true
  },
  {
    file: 'src/app/credits/new/page.tsx',
    componentPattern: /export\s+default\s+function\s+(\w+)/,
    isClientComponent: true
  },
  {
    file: 'src/app/dashboard/DashboardReal.tsx',
    componentPattern: /export\s+default\s+function\s+(\w+)/,
    isClientComponent: true
  },
  {
    file: 'src/app/payments/new/page.tsx',
    componentPattern: /export\s+default\s+function\s+(\w+)/,
    isClientComponent: true
  },
  {
    file: 'src/app/payments/[id]/page.tsx',
    componentPattern: /export\s+default\s+function\s+(\w+)/,
    isClientComponent: true
  }
];

function addHookToComponent(content, componentPattern) {
  // Trouver le composant
  const match = content.match(componentPattern);
  if (!match) {
    return { content, modified: false };
  }

  // Trouver le début du corps de la fonction
  const startIndex = content.indexOf('{', match.index);
  if (startIndex === -1) {
    return { content, modified: false };
  }

  // Chercher où insérer le hook (après les autres hooks existants)
  const lines = content.split('\n');
  let insertLine = -1;
  let bracketFound = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // On a trouvé l'ouverture du composant
    if (line.includes('{') && !bracketFound) {
      bracketFound = true;
      continue;
    }

    if (bracketFound) {
      // Chercher après les hooks existants (use...)
      if (line.trim().startsWith('const') && line.includes('use')) {
        insertLine = i + 1;
      }
      // Ou après les imports de hooks s'il n'y a pas de const use...
      else if (line.trim().startsWith('const') && !line.includes('use') && insertLine === -1) {
        insertLine = i;
        break;
      }
      // Ou après les déclarations d'état
      else if ((line.includes('[') && line.includes('useState')) ||
               (line.includes('{') && line.includes('use'))) {
        insertLine = i + 1;
      }
      // Si on trouve une ligne qui n'est plus une déclaration
      else if (line.trim() && !line.trim().startsWith('const') && !line.trim().startsWith('//') && insertLine !== -1) {
        break;
      }
    }
  }

  // Si on n'a pas trouvé d'endroit, insérer au début du composant
  if (insertLine === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('{') && content.substring(0, content.indexOf(lines[i])).includes(match[0])) {
        insertLine = i + 1;
        break;
      }
    }
  }

  if (insertLine !== -1) {
    // Insérer le hook
    const hookLine = '  const { formatAmount, isLoading: currencyLoading } = useMerchantCurrency()';
    lines.splice(insertLine, 0, '', hookLine);

    // Mettre à jour les conditions de loading
    const newContent = lines.join('\n');
    const updatedContent = newContent
      .replace(/loading\s*\?\s*"\.\.\."/g, 'loading || currencyLoading ? "..."')
      .replace(/value=\{loading\s*\?\s*"\.\.\."\s*:/g, 'value={loading || currencyLoading ? "..." :');

    return { content: updatedContent, modified: true };
  }

  return { content, modified: false };
}

function addImportIfNeeded(content) {
  // Vérifier si l'import est déjà présent
  if (content.includes('useMerchantCurrency')) {
    return content;
  }

  // Trouver une ligne d'import existante de hooks
  const lines = content.split('\n');
  let insertLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Après les imports de hooks
    if (line.includes('from') && line.includes('@/hooks/')) {
      insertLine = i + 1;
    }
    // Ou après les imports de lib
    else if (line.includes('from') && line.includes('@/lib/') && insertLine === -1) {
      insertLine = i + 1;
    }
  }

  if (insertLine !== -1) {
    lines.splice(insertLine, 0, "import { useMerchantCurrency } from '@/hooks/useMerchantCurrency'");
    return lines.join('\n');
  }

  return content;
}

function processFile(targetFile) {
  const filePath = path.join(process.cwd(), targetFile.file);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  File not found: ${targetFile.file}`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Vérifier si le fichier contient formatAmount (donc a besoin du hook)
    if (!content.includes('formatAmount')) {
      console.log(`⏭️  No formatAmount found in ${targetFile.file}`);
      return false;
    }

    // Vérifier s'il a déjà le hook
    if (content.includes('useMerchantCurrency')) {
      console.log(`✅ Already has hook: ${targetFile.file}`);
      return false;
    }

    console.log(`🔄 Processing ${targetFile.file}...`);

    // Ajouter l'import
    content = addImportIfNeeded(content);

    // Ajouter le hook au composant
    const result = addHookToComponent(content, targetFile.componentPattern);

    if (result.modified) {
      fs.writeFileSync(filePath, result.content);
      console.log(`✅ Successfully migrated ${targetFile.file}`);
      return true;
    } else {
      console.log(`⚠️  Could not find component in ${targetFile.file}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error processing ${targetFile.file}:`, error.message);
    return false;
  }
}

// Script principal
function main() {
  console.log('🔧 Completing currency migration with hooks...\n');

  let successCount = 0;

  TARGET_FILES.forEach(targetFile => {
    if (processFile(targetFile)) {
      successCount++;
    }
  });

  console.log(`\n🎉 Migration complete!`);
  console.log(`📊 Successfully processed ${successCount} files`);

  console.log('\n🔍 Remaining manual steps:');
  console.log('1. Check components that use formatAmount but might be Server Components');
  console.log('2. Test the application to ensure all currencies display correctly');
  console.log('3. Remove any remaining direct formatCurrency imports');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, addHookToComponent };