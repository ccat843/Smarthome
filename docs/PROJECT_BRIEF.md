# Project Brief

## Summary

The project is a modular smart home MVP for managing devices across exactly two homes. It demonstrates how a multi-tenant smart home platform can safely expose home-specific data to homeowners while allowing one admin to manage the full MVP environment.

## Why the System Exists

The system exists to prove a simple, extensible foundation for smart home management:

- Users can sign in and see only the homes they are allowed to access.
- Homes contain rooms.
- Rooms contain devices.
- Devices expose capabilities and accept actions through a shared interface.
- Device events create home- and device-scoped notifications.

## MVP Roles

### Admin

- There is one admin user in the MVP.
- The admin can view and manage both homes.
- The admin can view all rooms, devices, events, and notifications for both homes.
- The admin is used for setup, verification, and operational oversight.

### Homeowner

- There are two homeowner users in the MVP.
- Each homeowner is assigned to one home.
- A homeowner can view and control only devices in their assigned home.
- A homeowner can view notifications only for their assigned home.
- A homeowner must never see another homeowner's home, rooms, devices, events, notifications, or preferences.

## Multi-Tenant Concept

The tenant boundary is the home. Every room, device, device event, notification, and notification preference belongs to a home. All reads and writes must include home-level authorization.

The MVP has exactly two homes:

- Home 1: assigned to Homeowner 1.
- Home 2: assigned to Homeowner 2.

The admin can access both homes. Homeowners can access only their assigned home.
