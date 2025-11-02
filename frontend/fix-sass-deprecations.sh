#!/bin/bash

echo "🔧 Fixing Sass deprecation warnings..."

# Fix all component SCSS files
for file in src/components/**/*.scss; do
  if [ -f "$file" ]; then
    # Replace @import with @use
    sed -i "s/@import '@styles\/variables.scss';/@use '..\/..\/styles\/variables' as *;\n@use 'sass:color';/g" "$file"
    sed -i "s/@import '\.\.\/\.\.\/styles\/variables.scss';/@use '..\/..\/styles\/variables' as *;\n@use 'sass:color';/g" "$file"
    
    # Fix lighten() functions
    sed -i 's/lighten(\$google-blue, 48%)/color.adjust(\$google-blue, \$lightness: 48%)/g' "$file"
    sed -i 's/lighten(\$google-blue, 52%)/color.adjust(\$google-blue, \$lightness: 52%)/g' "$file"
    sed -i 's/lighten(\$google-blue, 45%)/color.adjust(\$google-blue, \$lightness: 45%)/g' "$file"
    sed -i 's/lighten(\$google-red, 48%)/color.adjust(\$google-red, \$lightness: 48%)/g' "$file"
    sed -i 's/lighten(\$google-red, 45%)/color.adjust(\$google-red, \$lightness: 45%)/g' "$file"
    sed -i 's/lighten(#667eea, 48%)/color.adjust(#667eea, \$lightness: 48%)/g' "$file"
    sed -i 's/lighten(\$surface-variant, 2%)/color.adjust(\$surface-variant, \$lightness: 2%)/g' "$file"
    
    # Fix darken() functions
    sed -i 's/darken(\$google-blue, 10%)/color.adjust(\$google-blue, \$lightness: -10%)/g' "$file"
    sed -i 's/darken(\$surface-variant, 3%)/color.adjust(\$surface-variant, \$lightness: -3%)/g' "$file"
    
    echo "✅ Fixed: $file"
  fi
done

echo "✨ All deprecation warnings fixed!"
