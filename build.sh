#!/bin/bash
# Production build script - prepares for GitHub Pages deployment

echo "🏗️  Building for GitHub Pages"
echo "=============================="
echo ""

# Export Marimo notebook to static HTML
echo "📊 Exporting Marimo notebook to static HTML..."
marimo export html interactive_analysis.py -o notebooks/interactive_analysis.html -f

if [ $? -eq 0 ]; then
    echo "✅ Export successful!"
    echo ""
    
    # Update index.html to use static export
    echo "🔧 Updating index.html for production..."
    sed -i.bak 's|src="http://localhost:2718"|src="notebooks/interactive_analysis.html"|g' index.html
    rm index.html.bak
    
    echo "✅ index.html updated for GitHub Pages"
    echo ""
    echo "📦 Ready to deploy!"
    echo ""
    echo "Next steps:"
    echo "  git add ."
    echo "  git commit -m 'Build for production'"
    echo "  git push origin main"
else
    echo "❌ Export failed!"
    exit 1
fi
