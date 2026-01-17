# Security Notes

## Current Vulnerabilities

As of the latest audit, there are **3 vulnerabilities** (2 low, 1 high) in development dependencies:

### 1. node-fetch (High Severity)
- **Location**: Transitive dependency via `@tensorflow/tfjs-core` → `face-api.js`
- **Versions Affected**: node-fetch <=2.6.6
- **Risk Assessment**: **LOW RISK** - This vulnerability affects server-side usage of node-fetch. Since `face-api.js` is a client-side library that runs in the browser, node-fetch is never actually used in production. The vulnerability cannot be exploited in this context.

### 2. @tensorflow/tfjs-core (Low Severity)
- **Location**: Dependency of `face-api.js`
- **Versions Affected**: 1.1.0 - 2.4.0
- **Risk Assessment**: **LOW RISK** - Client-side library, no server-side exposure.

### 3. face-api.js (Low Severity)
- **Location**: Direct dependency
- **Current Version**: 0.22.2 (latest)
- **Risk Assessment**: **LOW RISK** - Already updated to latest version.

## Resolution Status

✅ **Vite/esbuild vulnerability**: RESOLVED (updated to latest vite)
✅ **face-api.js**: UPDATED to latest version (0.22.2)
⚠️ **node-fetch**: Cannot be resolved without breaking changes (would require removing face-api.js)

## Recommendations

1. **For Production**: These vulnerabilities are acceptable as they only affect client-side dependencies that don't use the vulnerable code paths.

2. **For Future**: Consider migrating away from `face-api.js` to a more modern alternative if face detection becomes critical, or wait for the TensorFlow ecosystem to update their dependencies.

3. **Monitoring**: Run `npm audit` regularly to check for updates. The vulnerabilities are in transitive dependencies and will be resolved when the upstream packages update.

## Suppressing False Positives

If you want to suppress these in npm audit (not recommended for production), you can add to `.npmrc`:
```
audit-level=moderate
```

However, it's better to document them as we have here since they're not exploitable in our use case.

