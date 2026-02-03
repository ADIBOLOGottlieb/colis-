# Implementation Checklist

## Phase 1: Database & Schema Migration

### 1.1 Prisma Schema Updates
- [ ] Update `UserRole` enum: Rename `BOTH` to `LES_DEUX`
- [ ] Change default role from `BOTH` to `EXPEDITEUR`
- [ ] Add `ActiveModeSession` model
- [ ] Add `flexibilite` and `urgence` fields to `Colis` model
- [ ] Generate and apply migration

### 1.2 Database Migration Script
```sql
-- Migration: Update role enum and create active mode sessions
BEGIN;

-- Step 1: Update existing BOTH users to LES_DEUX
UPDATE users SET role = 'LES_DEUX' WHERE role = 'BOTH';

-- Step 2: Create active_mode_sessions table
CREATE TABLE active_mode_sessions (
  id VARCHAR(191) PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  activeMode VARCHAR(20) NOT NULL CHECK (activeMode IN ('EXPEDITEUR', 'VOYAGEUR')),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME NOT NULL,
  INDEX idx_user_id (userId),
  INDEX idx_expires (expiresAt),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 3: Add matching fields to colis
ALTER TABLE colis
  ADD COLUMN flexibilite INT DEFAULT 1 CHECK (flexibilite BETWEEN 0 AND 3),
  ADD COLUMN urgence INT DEFAULT 1 CHECK (urgence BETWEEN 0 AND 3);

COMMIT;
```

---

## Phase 2: Type System Implementation

### 2.1 Create Type Files
- [ ] Create `src/types/auth.ts` with all RBAC types
- [ ] Create `src/types/matching.ts` with all matching types
- [ ] Update `src/types/next-auth.d.ts` to extend session

### 2.2 Type Exports
Ensure all types are properly exported:
- [ ] `UserRole`, `ActiveMode`, `Permission` enums
- [ ] `UserWithRole`, `SessionUser` interfaces
- [ ] `MatchResult`, `MatchScoreBreakdown` interfaces
- [ ] All error classes

---

## Phase 3: Authentication Updates

### 3.1 NextAuth Configuration
- [ ] Update `src/lib/auth.ts` JWT callback to include `activeMode`
- [ ] Update session callback to include computed permission flags
- [ ] Add `activeMode` to JWT token type

### 3.2 Mode Selection System
- [ ] Create `src/app/auth/select-mode/page.tsx`
- [ ] Create `src/components/ModeSelector.tsx`
- [ ] Implement mode selection API endpoint
- [ ] Add redirect logic for LES_DEUX users without active mode

### 3.3 Session Management
- [ ] Create `src/lib/auth/session.ts` with mode management functions
- [ ] Implement `selectActiveMode()` function
- [ ] Implement `switchActiveMode()` function
- [ ] Implement session validation and cleanup

---

## Phase 4: Security Layer Implementation

### 4.1 Guard Middleware
- [ ] Create `src/lib/auth/guards.ts`
- [ ] Implement `requirePermission()` HOF
- [ ] Implement `requireAuth()` HOF
- [ ] Implement `requireRole()` HOF
- [ ] Add ownership verification functions

### 4.2 Audit Logging
- [ ] Create `src/lib/auth/audit.ts`
- [ ] Implement `logSecurityEvent()` function
- [ ] Define audit log schema
- [ ] Add audit log database table (optional)

### 4.3 Frontend Guards
- [ ] Create `src/components/RoleGuard.tsx`
- [ ] Implement `usePermission()` hook
- [ ] Implement `useEffectiveMode()` hook
- [ ] Implement `useCanSwitchMode()` hook

---

## Phase 5: API Route Protection

### 5.1 Protected Routes
Update all API routes with permission guards:

#### `/api/colis/route.ts`
- [ ] Add `requirePermission(Permission.CREATE_COLIS)` to POST
- [ ] Add ownership check to PUT/DELETE (when implemented)
- [ ] Keep GET open for viewing (authenticated only)

#### `/api/trajets/route.ts`
- [ ] Add `requirePermission(Permission.CREATE_TRAJET)` to POST
- [ ] Add ownership check to PUT/DELETE (when implemented)
- [ ] Keep GET open for viewing (authenticated only)

#### `/api/messages/route.ts`
- [ ] Add permission check based on conversation type
- [ ] Verify user is participant in conversation

#### `/api/conversations/route.ts`
- [ ] Add permission check for creating conversations
- [ ] Verify user can contact the other party

### 5.2 New API Endpoints
- [ ] `POST /api/auth/select-mode` - Select active mode
- [ ] `POST /api/auth/switch-mode` - Switch active mode
- [ ] `GET /api/auth/session` - Get current session info
- [ ] `GET /api/matching` - Get scored matches for colis

---

## Phase 6: Matching Algorithm Implementation

### 6.1 Core Engine
- [ ] Create `src/lib/matching/engine.ts`
- [ ] Implement `calculateMatch()` function
- [ ] Implement primary criteria scoring functions
- [ ] Implement secondary criteria scoring functions
- [ ] Add guarantee check logic

### 6.2 City Normalization
- [ ] Create `src/lib/matching/cities.ts`
- [ ] Implement `normalizeCityName()` function
- [ ] Implement `areCitiesInSameRegion()` function
- [ ] Create city alias database/JSON file

### 6.3 Batch Matching
- [ ] Implement `findMatchesForColis()` function
- [ ] Implement `findMatchesForTrajet()` function
- [ ] Add caching layer for match results
- [ ] Implement result sorting and filtering

### 6.4 API Integration
- [ ] Create `src/app/api/matching/route.ts`
- [ ] Implement GET endpoint for colis matches
- [ ] Add query parameter validation
- [ ] Implement response caching

---

## Phase 7: Frontend Updates

### 7.1 Navigation Updates
- [ ] Update `src/components/Navigation.tsx`
- [ ] Use `RoleGuard` for action buttons
- [ ] Add mode switcher for LES_DEUX users
- [ ] Show current active mode indicator

### 7.2 Page Protection
- [ ] Update `src/app/colis/page.tsx`
- [ ] Hide "Publier" button for VOYAGEUR mode
- [ ] Show mode-relevant UI elements

- [ ] Update `src/app/trajets/page.tsx`
- [ ] Hide "Proposer" button for EXPEDITEUR mode
- [ ] Show mode-relevant UI elements

### 7.3 Mode Selection UI
- [ ] Create mode selection modal component
- [ ] Add mode switcher dropdown/button
- [ ] Show mode expiration warning
- [ ] Add mode selection persistence

### 7.4 Matching UI
- [ ] Update colis list to show match scores
- [ ] Add score badges (Recommended, Exact, etc.)
- [ ] Show score breakdown on hover/click
- [ ] Add sorting by match score

---

## Phase 8: Testing & Validation

### 8.1 Unit Tests
- [ ] Test permission matrix for all roles
- [ ] Test `getEffectiveMode()` function
- [ ] Test `hasPermission()` function
- [ ] Test matching score calculations
- [ ] Test guarantee enforcement

### 8.2 Integration Tests
- [ ] Test API route protection
- [ ] Test mode selection flow
- [ ] Test mode switching
- [ ] Test matching API endpoints
- [ ] Test ownership verification

### 8.3 Security Tests
- [ ] Test unauthorized access attempts
- [ ] Test permission bypass attempts
- [ ] Test session hijacking protection
- [ ] Test audit log generation

### 8.4 E2E Tests
- [ ] Complete user flow: EXPEDITEUR
- [ ] Complete user flow: VOYAGEUR
- [ ] Complete user flow: LES_DEUX
- [ ] Mode switching flow
- [ ] Matching and contact flow

---

## Phase 9: Migration & Deployment

### 9.1 Data Migration
- [ ] Backup production database
- [ ] Run schema migration
- [ ] Migrate existing BOTH users
- [ ] Send notification to affected users

### 9.2 Deployment Steps
- [ ] Deploy to staging environment
- [ ] Run full test suite
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Check audit logs

### 9.3 Rollback Plan
- [ ] Database backup verification
- [ ] Rollback script prepared
- [ ] Feature flags for gradual rollout

---

## Phase 10: Documentation

### 10.1 Developer Documentation
- [ ] Update API documentation
- [ ] Document permission system
- [ ] Document matching algorithm
- [ ] Add architecture decision records

### 10.2 User Documentation
- [ ] Update user guide with mode selection
- [ ] Document role differences
- [ ] Add FAQ about mode switching
- [ ] Update terms of service

---

## Quick Reference: Permission Matrix

| Action | EXPEDITEUR | VOYAGEUR | LES_DEUX (EXP) | LES_DEUX (VOY) |
|--------|------------|----------|----------------|----------------|
| Create Colis | ✅ | ❌ | ✅ | ❌ |
| Create Trajet | ❌ | ✅ | ❌ | ✅ |
| View Colis | ✅ | ✅ | ✅ | ✅ |
| View Trajets | ✅ | ✅ | ✅ | ✅ |
| Contact Voyageur | ✅ | ❌ | ✅ | ❌ |
| Contact Expediteur | ❌ | ✅ | ❌ | ✅ |
| Switch Mode | N/A | N/A | ✅ | ✅ |

---

## Quick Reference: Scoring Formula

```
FINAL_SCORE = PRIMARY + SECONDARY

PRIMARY (max 70):
  - Departure match: 25 pts
  - Arrival match: 25 pts
  - Date match: 20 pts

SECONDARY (max 30):
  - Weight compatibility: 0-15 pts
  - Time flexibility: 0-10 pts
  - Acceptable delay: 0-5 pts

GUARANTEE: If date+departure+arrival identical, score >= 70
```
