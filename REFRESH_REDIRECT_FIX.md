# Page Refresh Redirect Fix

## Issue
When refreshing pages in the app, users were being redirected to `/organizations` instead of staying on the current page.

## Root Cause
Some pages were checking for user/organization data before the authentication context had finished loading, causing premature redirects during the auth loading phase.

## Pages Fixed

### 1. `/students/register/page.tsx`
**Problem:** The useEffect was returning early with `if (!currentUser || loading) return;`, preventing the organization fetch from ever running when auth was loading.

**Solution:** Changed the logic to:
```typescript
// Wait for auth to finish loading
if (loading) return;

// If no user after loading, don't redirect (let auth guard handle it)
if (!currentUser) {
  setOrgLoading(false);
  return;
}
```

This ensures:
- The effect waits for auth to finish loading
- Only redirects when user is actually missing (not during loading)
- Lets the AuthGuard handle authentication redirects

### 2. `/organizations/subscription/page.tsx`
**Problem:** The page was redirecting to `/organizations` immediately when `currentUser.currentOrganizationId` was missing, even during initial auth loading.

**Solution:** Changed the logic to:
```typescript
// Wait for auth to finish loading
if (loading) return;

// If no user or organization after loading, don't redirect during initial load
if (!currentUser?.currentOrganizationId) {
  setLoading(false);
  return;
}
```

This ensures:
- The page waits for auth to finish loading
- No premature redirects during auth initialization
- Gracefully handles missing organization without redirecting

## Pattern for Other Pages

When implementing user/organization checks in useEffect hooks, always follow this pattern:

```typescript
useEffect(() => {
  const loadData = async () => {
    // STEP 1: Wait for auth to finish loading
    if (authLoading) return;
    
    // STEP 2: Handle missing user (let AuthGuard redirect)
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    // STEP 3: Now safe to check organization and fetch data
    if (!currentUser.currentOrganizationId) {
      // Only redirect if truly needed, after auth is loaded
      router.push('/organizations');
      return;
    }
    
    // STEP 4: Fetch data
    const data = await fetchData(currentUser.currentOrganizationId);
    setData(data);
  };
  
  loadData();
}, [currentUser, authLoading, router]);
```

## Pages Already Using Correct Pattern

The following pages already implement the correct pattern:
- `/dashboard/page.tsx` - Uses `if (!currentUser || authLoading) return;`
- `/students/page.tsx` - Uses `if (!currentUser || authLoading) return;`

## Guards Working Correctly

Both guards already implement proper loading checks:
- **AuthGuard** - Only redirects after `loading === false`
- **SubscriptionGuard** - Only checks subscription after `authLoading === false`

## Testing

To verify the fix:
1. Navigate to any page (e.g., `/settings/academic-year`)
2. Refresh the page (F5 or Ctrl+R)
3. ✅ Page should stay on the same route
4. ✅ No redirect to `/organizations` should occur
5. ✅ Content should load normally after auth completes

## Related Files
- `/src/components/auth/auth-guard.tsx` - Authentication guard
- `/src/components/auth/subscription-guard.tsx` - Subscription guard
- `/src/contexts/auth-context.tsx` - Auth state management
- `/src/app/(app)/layout.tsx` - App layout with guards

## Date Fixed
November 4, 2025
