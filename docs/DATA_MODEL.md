# Data Model

Use simple, normalized entities. Field names are implementation guidance and may be adapted to framework conventions, but relationships and scoping rules must remain the same.

## Users

Represents an authenticated person.

Fields:

- `id`: unique identifier.
- `email`: unique login email.
- `display_name`: human-readable name.
- `role`: either `admin` or `homeowner`.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

Relationships:

- A user may have many home memberships.
- A homeowner has exactly one home membership in the MVP.
- The admin has memberships or equivalent access to both homes.

## Homes

Represents the tenant boundary.

Fields:

- `id`: unique identifier.
- `name`: home name.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

Relationships:

- A home has many rooms.
- A home has many devices.
- A home has many device events.
- A home has many notifications.
- A home has many notification preferences.

MVP records:

- Exactly two homes.

## Home Memberships

Maps users to homes.

Fields:

- `id`: unique identifier.
- `user_id`: references users.
- `home_id`: references homes.
- `home_role`: `admin` or `homeowner` for that home.
- `created_at`: creation timestamp.

Constraints:

- A homeowner must have access to exactly one home in the MVP.
- Admin access must cover both MVP homes.
- A `(user_id, home_id)` pair must be unique.

## Rooms

Represents a physical or logical area inside a home.

Fields:

- `id`: unique identifier.
- `home_id`: references homes.
- `name`: room name.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

Relationships:

- A room belongs to one home.
- A room has many devices.

## Device Types

Defines supported device categories.

Fields:

- `id`: unique identifier.
- `key`: one of `light`, `heater`, or `door_lock`.
- `name`: human-readable label.
- `capabilities`: list of supported capability keys.

Constraints:

- The MVP supports only `light`, `heater`, and `door_lock`.

## Devices

Represents a controllable device instance.

Fields:

- `id`: unique identifier.
- `home_id`: references homes.
- `room_id`: references rooms.
- `device_type_id`: references device types.
- `name`: human-readable device name.
- `state`: JSON object matching the device capabilities.
- `status`: `online` or `offline`.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

Relationships:

- A device belongs to one home.
- A device belongs to one room in the same home.
- A device has many device events.
- A device has many notifications.

Constraints:

- `room_id` must reference a room with the same `home_id` as the device.

## Device Events

Represents a recorded device action or simulator-generated change.

Fields:

- `id`: unique identifier.
- `home_id`: references homes.
- `device_id`: references devices.
- `actor_user_id`: references users when a user caused the event; nullable for simulator events.
- `source`: `user`, `admin`, or `simulator`.
- `event_type`: event key such as `power_changed`, `temperature_changed`, or `lock_state_changed`.
- `previous_state`: JSON object before the event.
- `new_state`: JSON object after the event.
- `created_at`: event timestamp.

Relationships:

- A device event belongs to one home.
- A device event belongs to one device in the same home.

## Notifications

Represents a user-visible message derived from a device event.

Fields:

- `id`: unique identifier.
- `home_id`: references homes.
- `device_id`: references devices.
- `device_event_id`: references device events.
- `user_id`: references recipient user.
- `title`: short human-readable title.
- `message`: human-readable message.
- `severity`: `info`, `warning`, or `critical`.
- `read_at`: nullable timestamp.
- `created_at`: creation timestamp.

Relationships:

- A notification belongs to one home.
- A notification belongs to one device in the same home.
- A notification belongs to one device event in the same home.
- A notification belongs to one recipient user.

## Notification Preferences

Represents per-user notification settings for a home.

Fields:

- `id`: unique identifier.
- `user_id`: references users.
- `home_id`: references homes.
- `device_type_key`: nullable value of `light`, `heater`, or `door_lock`; null means all device types.
- `event_type`: nullable event key; null means all event types.
- `enabled`: boolean.
- `created_at`: creation timestamp.
- `updated_at`: update timestamp.

Relationships:

- A notification preference belongs to one user.
- A notification preference belongs to one home.

Constraints:

- Users can only manage preferences for homes they can access.
