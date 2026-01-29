const fs = require('fs');
const path = require('path');

const dir = 'src/i18n/pages/pricing';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const ID_MAP = {
  // Map ANY known real ID to the Logical ID
  'prod_6QIupLnQ0me8AMT8f1kFY6': 'pro-monthly',
  'prod_9QVffTfOEsZ6rBNdedrfi': 'business-monthly',
  // In case they are already logical (no change needed, but safe to map)
  'pro-monthly': 'pro-monthly',
  'business-monthly': 'business-monthly'
};

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  Object.entries(ID_MAP).forEach(([realId, logicalId]) => {
    // Regex to replace "product_id": "REAL_ID" with "product_id": "LOGICAL_ID"
    const regex = new RegExp(`"product_id":\\s*"${realId}"`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `"product_id": "${logicalId}"`);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`No changes needed for ${file}`);
  }
});
