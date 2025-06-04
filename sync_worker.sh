#!/bin/bash
# sync_worker.sh - Synchronize individual files into _worker.js

# Change to the CYOLLM directory
cd "$(dirname "$0")"

# Path to files
WORKER_FILE="./public/_worker.js"
INDEX_FILE="./public/index.html"
APP_FILE="./public/app.js"
STYLE_FILE="./public/style.css"

# Create a temporary file
TMP_WORKER_FILE="./public/_worker.js.tmp"

# Start with the worker.js preamble
cat > "$TMP_WORKER_FILE" << 'EOF'
// Create a simple worker script that serves the index.html directly
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Create the HTML content as a function to avoid variable scope issues
  function getHtmlContent() {
    return `
EOF

# Append the index.html content (without the app.js script tag)
cat "$INDEX_FILE" | sed 's/<script src="app.js.*<\/script>/<!-- app.js content is inlined below -->/g' >> "$TMP_WORKER_FILE"

# Close the template literal and handle app.js route
cat >> "$TMP_WORKER_FILE" << 'EOF'
`;
  }

  // Handle app.js requests
  if (path === "/app.js") {
    return new Response(`
EOF

# Append the app.js content
cat "$APP_FILE" >> "$TMP_WORKER_FILE"

# Handle style.css route
cat >> "$TMP_WORKER_FILE" << 'EOF'
`, {
      headers: {
        "content-type": "application/javascript",
        "cache-control": "no-cache, no-store, must-revalidate"
      }
    });
  }

  // Handle style.css requests
  if (path === "/style.css") {
    return new Response(`
EOF

# Append the style.css content
cat "$STYLE_FILE" >> "$TMP_WORKER_FILE"

# Finish the worker file
cat >> "$TMP_WORKER_FILE" << 'EOF'
`, {
      headers: {
        "content-type": "text/css",
        "cache-control": "no-cache, no-store, must-revalidate"
      }
    });
  }

  // For all other routes, serve the main HTML
  return new Response(getHtmlContent(), {
    headers: {
      "content-type": "text/html;charset=UTF-8",
      "cache-control": "no-cache, no-store, must-revalidate"
    }
  });
}
EOF

# Replace the old worker file with the new one
mv "$TMP_WORKER_FILE" "$WORKER_FILE"

echo "Worker file updated successfully!"