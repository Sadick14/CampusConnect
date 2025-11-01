# 🔧 Fixed: Maximum Call Stack Size Exceeded Error

## Problem
```
RangeError: Maximum call stack size exceeded
    at describeObjectForErrorMessage (infinite loop)
```

This was caused by **circular references** in the Firestore object being passed through React's rendering system.

## Root Cause
The Firestore instance from `getDb()` contains circular references in its internal structure. When React tries to serialize this object for error messages or dev tools, it enters an infinite loop trying to describe the object.

## Solution Implemented

### 1. Split Firebase Configuration
Created two separate modules:

**`src/lib/firebase.ts`** - Client-side only
- Exports: `auth`, `storage`, `app`
- Used by: Client components, authentication flows
- Marked with `'use client'` directive

**`src/lib/firebase-server.ts`** - Server-side only  
- Exports: `getDb()` (Firestore instance)
- Used by: Server actions in `src/services/*.ts`
- No client directive (runs server-only)

### 2. Updated All Service Files
All services now import correctly:
```typescript
// ✅ CORRECT
import { auth } from '@/lib/firebase';           // Client-side auth
import { getDb } from '@/lib/firebase-server';   // Server-side Firestore

// ❌ WRONG (old way)
import { auth, getDb } from '@/lib/firebase';    // Mixed client/server
```

### 3. Files Modified
- ✅ `src/lib/firebase.ts` - Client-only (auth, storage)
- ✅ `src/lib/firebase-server.ts` - Server-only (Firestore)
- ✅ `src/services/user.ts` - Updated imports
- ✅ `src/services/school.ts` - Updated imports
- ✅ `src/services/student.ts` - Updated imports
- ✅ `src/services/attendance.ts` - Updated imports
- ✅ `src/services/grade.ts` - Updated imports

## Result
✅ **Zero TypeScript errors**  
✅ **No circular reference errors**  
✅ **Server running smoothly on port 9002**  
✅ **All services using Firestore correctly**

## Current Status
🟢 **Server is healthy** - Running at http://localhost:9002

⚠️ **Expected error:** "permission-denied" when trying to access Firestore  
**Why:** Firestore security rules haven't been deployed yet

## Next Steps
See `FIRESTORE_RULES.md` for deployment instructions.

---

## Technical Details

### Why This Works
1. **Client components** import from `firebase.ts` which has `'use client'`
2. **Server actions** import from `firebase-server.ts` which runs server-only
3. **Firestore instance** never crosses the client/server boundary
4. **React never tries to serialize** the Firestore object

### Architecture
```
┌─────────────────────────────────────┐
│   Client Components (Browser)       │
│   ↓ imports                          │
│   src/lib/firebase.ts                │
│   - auth ✓                           │
│   - storage ✓                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   Server Actions (Node.js)          │
│   ↓ imports                          │
│   src/lib/firebase-server.ts         │
│   - getDb() → Firestore ✓            │
└─────────────────────────────────────┘
```

### Key Principle
**Never pass Firestore instances through React props or return them from server actions.** Only pass plain data (strings, numbers, objects) that can be serialized.

---

*Issue resolved on October 21, 2025*
