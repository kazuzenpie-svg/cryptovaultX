# 🔄 **Sharing System Backend Analysis**

## **Overview**
The sharing functionality allows users to request access to other users' trading data with granular controls and filters. Here's how it works from a technical perspective.

## **🗄️ Database Schema**

### **Core Tables**

1. **`profiles`** - User information
   ```sql
   - id (UUID, FK to auth.users)
   - username (UNIQUE) ← Used for user search
   - avatar_url, bio, etc.
   ```

2. **`access_grants`** - Sharing requests/permissions
   ```sql
   - id (UUID, PK)
   - viewer_id (UUID) ← Who wants to see data 
   - sharer_id (UUID) ← Who owns the data
   - status (enum: pending → granted/denied/revoked)
   - shared_types[] (array of entry types to share)
   - expires_at, date_from, date_to, min_pnl (filters)
   - message (optional note)
   - UNIQUE constraint on (viewer_id, sharer_id)
   ```

3. **`journal_entries`** - Trading data with sharing policies
   ```sql
   - user_id, type, asset, pnl, date, is_personal, etc.
   ```

### **Row Level Security (RLS) Policies**

```sql
-- Users can request access (insert with their own viewer_id)
CREATE POLICY "Users can request access" 
    ON access_grants FOR INSERT 
    WITH CHECK (auth.uid() = viewer_id);

-- Sharers can manage grant status (approve/deny/revoke)  
CREATE POLICY "Sharers can manage grant status" 
    ON access_grants FOR UPDATE 
    USING (auth.uid() = sharer_id);

-- Complex sharing policy for journal entries
CREATE POLICY "Users can view granted entries" 
    ON journal_entries FOR SELECT 
    USING (
        auth.uid() = user_id OR (
            is_personal = false AND
            EXISTS (SELECT 1 FROM access_grants ag
                WHERE ag.viewer_id = auth.uid() 
                AND ag.sharer_id = journal_entries.user_id 
                AND ag.status = 'granted'
                AND (ag.expires_at IS NULL OR ag.expires_at > NOW())
                AND (ag.date_from IS NULL OR journal_entries.date >= ag.date_from)
                AND (ag.date_to IS NULL OR journal_entries.date <= ag.date_to)
                AND (ag.min_pnl IS NULL OR journal_entries.pnl >= ag.min_pnl)
                AND (journal_entries.type = ANY(ag.shared_types))
            )
        )
    );
```

## **🔄 Request Flow**

### **1. Send Sharing Request**

**User Action:** Fill out sharing form and submit
**Frontend:** `ShareDataDialog.tsx` → `useAccessGrants.tsx`
**Backend Flow:**

```typescript
// Step 1: Search for target user by username
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, username, avatar_url')
  .or(`username.eq."${username}",username.eq."${username.split('@')[0]}"`)

// Step 2: Check for existing requests  
const { data: existingGrant } = await supabase
  .from('access_grants')
  .select('id, status')
  .eq('viewer_id', user.id)
  .eq('sharer_id', targetUserId)

// Step 3: Insert new access grant
const { data, error } = await supabase
  .from('access_grants')
  .insert([{
    viewer_id: user.id,     // Current user requesting access
    sharer_id: targetUserId, // User we want access from
    shared_types: ['spot', 'futures'],
    status: 'pending',
    message: 'Please share your trading data'
  }])
```

### **2. Approve/Deny Request**

**User Action:** Click approve/deny on incoming request
**Backend Flow:**

```typescript
// Approve request
const { data } = await supabase
  .from('access_grants')
  .update({ status: 'granted' })
  .eq('id', grantId)
  .eq('sharer_id', user.id) // RLS: Only sharer can update

// Deny request  
const { data } = await supabase
  .from('access_grants')
  .update({ status: 'denied' })
  .eq('id', grantId)
  .eq('sharer_id', user.id)
```

### **3. View Shared Data**

**User Action:** Navigate to shared entries
**Backend Flow:** RLS policy automatically filters `journal_entries` based on granted access

## **🚨 Common Issues & Solutions**

### **Issue 1: "User not found"**
- **Cause:** Target user hasn't created a profile or username is wrong
- **Solution:** Ensure target user has registered and completed profile setup
- **Debug:** Use debug panel to test user search

### **Issue 2: "Permission denied"** 
- **Cause:** RLS policy rejection due to authentication issues
- **Solution:** Check user is logged in and has valid session
- **Debug:** Check auth state in debug panel

### **Issue 3: "Already have request"**
- **Cause:** Duplicate request between same users (UNIQUE constraint)
- **Solution:** Check existing requests before sending new ones
- **Debug:** Query access_grants table directly

### **Issue 4: Database connection errors**
- **Cause:** Network issues or Supabase service problems
- **Solution:** Check network and Supabase status
- **Debug:** Run database connection test

## **🛠️ Debugging Tools**

### **Enhanced Debug Panel**
Visit `/sharing` page in development mode to access:

1. **Status Overview** - Current auth state and request counts
2. **User Search Test** - Test if specific usernames can be found
3. **Test Request** - Send actual test sharing requests
4. **Full Diagnostics** - Complete system health check
5. **Common Issues Help** - Quick troubleshooting guide

### **Console Commands**
Available in browser console:

```javascript
// Check current authentication
debugAuth()

// Test database connection  
debugDB()

// List all profiles
debugProfiles()

// Create test profile (limited by RLS)
createTestProfile('testuser')
```

## **📊 Data Flow Diagram**

```
User A (Viewer)                    User B (Sharer)
     │                                  │
     ├─ Send Request ──────────────────→ │
     │  (viewer_id: A, sharer_id: B)    │
     │                                  │
     │                                  ├─ Receive Notification
     │                                  │
     │                                  ├─ Approve/Deny
     │                                  │  (status: granted/denied)
     ←──────────────── Access Granted ──┤
     │                                  │
     ├─ View Shared Entries             │
     │  (filtered by RLS policy)        │
```

## **🔐 Security Features**

1. **Row Level Security (RLS)** - Server-side data filtering
2. **Unique Constraints** - Prevent duplicate requests
3. **Authentication Required** - All operations require valid session
4. **Granular Permissions** - Users control exactly what they share
5. **Expiration Support** - Time-limited sharing access
6. **Personal Flag** - Exclude personal entries from sharing

## **🚀 Testing Recommendations**

1. **Create Multiple Test Accounts** - Test with real user accounts
2. **Test Different Scenarios** - Try various filters and permissions
3. **Check Browser Console** - Monitor debug logs during requests
4. **Use Debug Panel** - Systematic troubleshooting
5. **Verify Database State** - Check actual data in Supabase dashboard

## **📝 Next Steps**

If sharing requests still aren't working:

1. **Open Browser DevTools Console**
2. **Navigate to `/sharing` page**
3. **Use the enhanced debug panel to test user search**
4. **Try sending a test request**
5. **Check console logs for specific error messages**
6. **Verify target user has a complete profile**