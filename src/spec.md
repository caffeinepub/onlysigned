# Specification

## Summary
**Goal:** Implement Phase 1 foundation for OnlySigned by making the key backend access-control/profile endpoints callable from the frontend, and replacing the single-page UI with a themed, navigable app shell and non-empty scaffolding pages.

**Planned changes:**
- Backend: Ensure the Phase 1 foundation methods compile, are exposed via Candid, and are callable through generated frontend actor bindings (initializeAccessControl, getCallerUserProfile, saveCallerUserProfile, reclaimAdminAccess, getCallerUserRole, isCallerAdmin, isCallerApproved), including authorization behavior and stable userNumber assignment.
- Frontend: Add an application shell with reusable Layout, Header (top navigation), and Footer; implement client-side navigation across main sections, with Admin navigation shown only for admin users.
- Frontend: Add scaffolding UI for the listed placeholder pages so each shows a title, short description, and “Coming in Phase X” placeholders where applicable, without blank screens or runtime errors.
- Frontend: Update Home page to remove the “Backend Implementation Required” destructive alert and replace it with an onboarding-friendly status panel (login status, principal, profile existence, admin status), while keeping Internet Identity login/logout and profile create/edit flows.
- Frontend: Apply a coherent visual theme across the shell and Phase 1 pages using the existing Tailwind/OKLCH token approach, avoiding blue/purple as the primary palette.
- Frontend assets: Add the generated brand images as static assets under `frontend/public/assets/generated/`, render the logo in the header, and configure at least a favicon to use the generated asset (served statically, not via backend).

**User-visible outcome:** Users can navigate between core sections with a consistent header/footer and theme, sign in with Internet Identity, view a clear onboarding/status panel on Home (including principal/profile/admin status), and visit all Phase 1 routes without blank pages; admins additionally see an Admin link, and the frontend can call the Phase 1 backend foundation endpoints.
