# Architecture

## Boundaries

The MVP should be implemented with clear boundaries between frontend, backend, database, device abstraction, and simulator logic.

### Frontend

The frontend is responsible for:

- Signing in as an admin or homeowner.
- Listing accessible homes.
- Showing rooms and devices for the selected home.
- Rendering device state using each device's capabilities.
- Sending device actions to the backend.
- Showing home-scoped notifications.

The frontend must not enforce security by itself. It may hide inaccessible data, but the backend must enforce all access rules.

### Backend

The backend is responsible for:

- Authentication and current-user context.
- Home-level authorization.
- CRUD-style reads for homes, rooms, devices, events, notifications, and preferences within MVP limits.
- Validating device actions against device capabilities.
- Calling the device abstraction layer.
- Persisting device events.
- Creating notifications from qualifying events.

### Database

The database is responsible for storing normalized records for:

- Users.
- Homes.
- Home memberships.
- Rooms.
- Device types.
- Devices.
- Device events.
- Notifications.
- Notification preferences.

Every tenant-scoped table must include `home_id` either directly or through a required parent relationship.

## Device Abstraction Layer

All device behavior must pass through a device abstraction layer. API handlers and UI components must not contain hard-coded device-specific state transition logic.

The device abstraction layer should expose operations similar to:

- Get supported capabilities for a device.
- Validate an action against a device's capabilities.
- Apply an action to produce the next device state.
- Emit a device event describing the state change or important condition.

Each device has:

- A `device_type` value.
- A list of capabilities.
- A normalized state object.
- Allowed actions derived from capabilities.

## Notification Flow

Notification flow:

1. A homeowner, admin, or simulator triggers a device action or state change.
2. The backend authorizes access to the device's home.
3. The device abstraction layer validates and applies the change.
4. The backend writes a device event with `home_id` and `device_id`.
5. Notification rules inspect the event.
6. If the event qualifies and user preferences allow it, the backend writes a notification with `home_id`, `device_id`, and `user_id`.
7. Users can read only notifications for homes they are authorized to access.

## Simulator Concept

The simulator represents fake device behavior for the MVP. It replaces real IoT integrations.

The simulator may:

- Initialize sample device states.
- Apply the same actions as a real device adapter.
- Generate device events such as light state changes, heater temperature changes, and door lock state changes.

The simulator must use the same device abstraction contract as any future real integration.
