# Deployment Guide for Chaotic Adventures

This document outlines the deployment process for the Chaotic Adventures game, with specific focus on the Cloudflare Workers deployment and compatibility issues.

## Cloudflare Workers Deployment

Chaotic Adventures is deployed using Cloudflare Workers, which serves the static content directly from the worker script.

### File Structure

- `/public/_worker.js`: The main worker script that serves all content
- `/public/index.html`: Original HTML content (referenced by _worker.js)
- `/public/app.js`: Original JavaScript content (referenced by _worker.js)
- `/public/style.css`: Original CSS content (referenced by _worker.js)

### Compatibility Issues

**Important**: Cloudflare Workers has syntax limitations that need to be considered when updating the codebase:

1. **No ES6 Template Literals**: Cloudflare Workers does not support ES6 template literals with expressions (`${variable}`). All string interpolation must use string concatenation (`"text " + variable + " more text"`).

2. **Multi-line Strings**: Be careful with multi-line strings in the worker script. Prefer concatenated strings or explicit newlines.

3. **Worker Code Structure**: The worker script includes embedded copies of HTML, JS, and CSS content rather than referencing external files directly.

## Updating the Worker Script

When making changes to `index.html`, `app.js`, or `style.css`, you must also update the `_worker.js` file. Two approaches are available:

### 1. Using the Synchronization Script

We've provided a script (`sync_worker.sh`) that helps update the worker file with content from the individual files:

```bash
# Make the script executable (first time only)
chmod +x sync_worker.sh

# Run the script to update the worker
./sync_worker.sh
```

### 2. Manual Rebuild Approach

For complete rebuilds, we have a template file (`rebuild_worker.js`) that can be copied to `_worker.js` and then updated with the current content of the individual files.

### 3. Manual Editing

If making smaller changes, you can edit `_worker.js` directly, but remember:

- Replace any template literals (`${variable}`) with string concatenation (`" + variable + "`)
- Maintain proper string quoting and escaping
- Test your changes locally before deployment

## Deployment Process

### Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up) with access to Workers
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
3. Cloudflare API token with Workers permissions

### Deploying Updates

1. **Update the worker script** using one of the methods above

2. **Test locally** (if possible) using Wrangler:
   ```bash
   npx wrangler dev
   ```

3. **Set up authentication**:
   ```bash
   # Set API token as environment variable
   export CLOUDFLARE_API_TOKEN=your_token_here
   
   # Or configure with Wrangler
   npx wrangler login
   ```

4. **Deploy to Cloudflare**:
   ```bash
   # Deploy using Wrangler
   npx wrangler deploy
   ```

5. **Verify the deployment** by visiting the site and testing functionality

### Troubleshooting

- If deployment fails with syntax errors, check for template literals or other ES6 features that may not be supported
- Ensure all string concatenation is properly formatted
- Check the browser console for JavaScript errors
- Use the emergency debug tools built into the application (purple debug bar at the top of the page)

## Maintaining the Codebase

- Always commit both the individual files (`index.html`, `app.js`, `style.css`) AND the updated worker file (`_worker.js`)
- Consider using the provided scripts to ensure proper synchronization
- Test thoroughly after making changes to ensure screen transitions work correctly

## Emergency Debug Tools

The application includes built-in emergency debug tools that can help identify issues:

- A purple debug bar appears at the top of the page when the emergency initialization script runs
- A debug panel allows testing narrative display and inspecting DOM state
- The emergency initialization provides fallback functionality if main scripts fail

To access these tools, simply load the application. If you don't see the purple bar at the top, you may be viewing a cached version - follow the instructions in the orange banner for a hard refresh.