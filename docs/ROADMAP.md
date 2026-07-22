# Roadmap

This roadmap keeps implementation ordered and MVP-only.

## Phase 1: Documentation Baseline

- Create source-of-truth documentation.
- Define MVP roles, homes, scope, architecture, data model, API contracts, device capabilities, notifications, and implementation order.

## Phase 2: Project Skeleton

- Choose the application stack.
- Create frontend, backend, and database structure.
- Add basic configuration and development scripts.
- Do not add features outside the documented MVP.

## Phase 3: Authentication and Home Access

- Implement the one admin and two homeowner users.
- Implement two homes.
- Implement home memberships.
- Enforce home-level authorization in backend helpers or middleware.
- Test that homeowners cannot access the other home.

## Phase 4: Core Data Model

- Implement users, homes, memberships, rooms, device types, devices, device events, notifications, and preferences.
- Seed exactly two homes and the three MVP device types.
- Ensure devices, events, notifications, and preferences are tied to `home_id`.

## Phase 5: Device Abstraction and Simulator

- Implement the common device capability interface.
- Implement light, heater, and door lock behavior through the abstraction layer.
- Implement simulator behavior using the same abstraction contract.
- Record device events for actions and simulator changes.

## Phase 6: API Implementation

- Implement auth, homes, rooms, devices, actions, events, notifications, and notification preferences endpoints.
- Apply home-level access checks to every endpoint.
- Validate all device actions against capabilities.

## Phase 7: Frontend MVP

- Implement sign-in.
- Show accessible homes.
- Show rooms and devices within a selected home.
- Render controls based on capabilities.
- Show notifications for the selected home.
- Avoid displaying inaccessible home data.

## Phase 8: MVP Verification

- Verify admin can access both homes.
- Verify each homeowner can access only their assigned home.
- Verify all three device types use the common capability interface.
- Verify device actions update state and create events.
- Verify notification creation and read/unread behavior.
- Verify URL or API ID tampering cannot expose another home's data.
