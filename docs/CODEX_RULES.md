# Codex Rules

These rules exist so future Codex tasks implement the same MVP without guessing or expanding scope.

## Read Order

Before changing application behavior, read these files in order:

1. `README.md`
2. `docs/PROJECT_BRIEF.md`
3. `docs/MVP_SCOPE.md`
4. `docs/ARCHITECTURE.md`
5. `docs/DATA_MODEL.md`
6. `docs/DEVICE_CAPABILITIES.md`
7. `docs/API_CONTRACTS.md`
8. `docs/NOTIFICATIONS.md`
9. `docs/ROADMAP.md`

## Source of Truth

- The documentation in this repository is the source of truth for architecture, scope, roles, access control, device behavior, and notification behavior.
- Do not add features, roles, device types, permissions, endpoints, or data fields that are not described in these docs.
- If an implementation task requires a behavior not covered here, update the relevant documentation first in the same change.
- Keep documentation and implementation consistent. Do not let code behavior drift from these files.

## Scope Control

- Keep changes small, specific, and tied to the requested task.
- Build the MVP only. Do not add production-only features unless they are explicitly listed in `docs/MVP_SCOPE.md`.
- Do not introduce real IoT network integrations in the MVP. Use simulator behavior described in `docs/ARCHITECTURE.md`.
- Do not add extra device types beyond light, heater, and door lock.
- Do not add extra user roles beyond admin and homeowner.

## Access Control Rules

- Enforce strict home-level access control in every API, query, UI view, event lookup, and notification lookup.
- Homeowners must only access homes assigned to them.
- Homeowners must never see rooms, devices, events, notifications, or preferences for another home.
- Admin can access both MVP homes for setup and management.

## Device Architecture Rules

- Every device must use the common capability-based interface in `docs/DEVICE_CAPABILITIES.md`.
- Device-specific logic belongs behind a device abstraction layer, not scattered across UI or API handlers.
- New device behavior must be represented as capabilities, actions, state, and events.

## Testing Expectations

When application code exists, future tasks should test:

- Role-based access rules.
- Home scoping on list, read, update, action, event, and notification endpoints.
- Device action validation by capability.
- Notification creation from device events.
