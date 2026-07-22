# API Contracts

This file defines the intended backend API surface. Exact routing style may vary by framework, but these resources, access rules, and payload shapes must remain consistent.

## Common Rules

- Every request runs with an authenticated current user.
- Admin may access both MVP homes.
- Homeowners may access only their assigned home.
- All endpoints that include `home_id`, `room_id`, `device_id`, `event_id`, or `notification_id` must verify that the resource belongs to an authorized home.
- Never trust IDs supplied by the client without checking home ownership.
- Responses must not include data from unauthorized homes.

## Auth

### `POST /auth/login`

Purpose: authenticate as one of the MVP users.

Request:

- `email`
- `password`

Response:

- `token` or session identifier.
- `user` with `id`, `email`, `display_name`, and `role`.

### `GET /auth/me`

Purpose: return the current user.

Response:

- Current user identity.
- Accessible home IDs.

## Homes

### `GET /homes`

Purpose: list homes visible to the current user.

Access:

- Admin receives both homes.
- Homeowner receives only their assigned home.

### `GET /homes/{home_id}`

Purpose: get one authorized home.

Access:

- Deny if the user cannot access `home_id`.

## Rooms

### `GET /homes/{home_id}/rooms`

Purpose: list rooms in an authorized home.

Access:

- Deny if the user cannot access `home_id`.

### `GET /homes/{home_id}/rooms/{room_id}`

Purpose: get one room.

Access:

- Deny if `room_id` does not belong to `home_id`.
- Deny if the user cannot access `home_id`.

## Devices

### `GET /homes/{home_id}/devices`

Purpose: list devices in an authorized home.

Optional filters:

- `room_id`
- `device_type_key`

Access:

- Deny if the user cannot access `home_id`.
- If `room_id` is provided, it must belong to `home_id`.

### `GET /homes/{home_id}/devices/{device_id}`

Purpose: get device details, state, and capabilities.

Access:

- Deny if `device_id` does not belong to `home_id`.
- Deny if the user cannot access `home_id`.

Response includes:

- Device identity.
- Room identity.
- Device type.
- Capabilities.
- Current state.
- Online/offline status.

## Device Actions

### `POST /homes/{home_id}/devices/{device_id}/actions`

Purpose: execute an action on a device.

Request:

- `action`: action key.
- `params`: action-specific object.

Access:

- Deny if the user cannot access `home_id`.
- Deny if `device_id` does not belong to `home_id`.

Validation:

- Device must be `online`.
- Action must be supported by the device capabilities.
- Params must match the action contract in `docs/DEVICE_CAPABILITIES.md`.

Response:

- Updated device state.
- Created device event.
- Created notifications, if any.

## Device Events

### `GET /homes/{home_id}/events`

Purpose: list device events for an authorized home.

Optional filters:

- `device_id`
- `event_type`

Access:

- Deny if the user cannot access `home_id`.
- If `device_id` is provided, it must belong to `home_id`.

### `GET /homes/{home_id}/devices/{device_id}/events`

Purpose: list events for one device.

Access:

- Deny if the user cannot access `home_id`.
- Deny if `device_id` does not belong to `home_id`.

## Notifications

### `GET /homes/{home_id}/notifications`

Purpose: list notifications for the current user in an authorized home.

Access:

- Deny if the user cannot access `home_id`.
- Homeowners receive only their own notifications.
- Admin receives admin notifications for that home.

### `PATCH /homes/{home_id}/notifications/{notification_id}`

Purpose: mark a notification as read or unread.

Request:

- `read`: boolean.

Access:

- Deny if the user cannot access `home_id`.
- Deny if `notification_id` does not belong to `home_id`.
- Deny if the notification is not addressed to the current user.

## Notification Preferences

### `GET /homes/{home_id}/notification-preferences`

Purpose: list current user's preferences for a home.

Access:

- Deny if the user cannot access `home_id`.

### `PUT /homes/{home_id}/notification-preferences`

Purpose: replace current user's preferences for a home.

Request:

- List of preference objects with `device_type_key`, `event_type`, and `enabled`.

Access:

- Deny if the user cannot access `home_id`.
- Deny preferences for device types outside the MVP.
