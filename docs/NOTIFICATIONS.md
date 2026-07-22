# Notifications

Notifications are user-visible records derived from device events. They must always be scoped to a home and device.

## Scoping Rules

- Every notification must include `home_id`, `device_id`, `device_event_id`, and `user_id`.
- A user can only see notifications for homes they can access.
- Homeowners must only receive and read notifications for their assigned home.
- Admin may receive and read admin notifications for both MVP homes.
- A notification for one home must never appear in another home's notification list.

## Event Triggers

The MVP creates notifications from these device events:

### Light Events

- `power_changed`: create an `info` notification when a light turns on or off.

### Heater Events

- `power_changed`: create an `info` notification when a heater turns on or off.
- `target_temperature_changed`: create an `info` notification when the heater target temperature changes.
- `temperature_changed`: create a `warning` notification only when simulator behavior indicates the current temperature moved away from the target by an implementation-defined MVP threshold.

### Door Lock Events

- `lock_state_changed`: create an `info` notification when a lock is locked.
- `lock_state_changed`: create a `critical` notification when a lock is unlocked.

## Preferences

Notification preferences are scoped by user and home.

A preference can target:

- All device types and all event types.
- One device type and all event types for that type.
- One device type and one event type.

Rules:

- If no preference exists, notifications are enabled by default for that user and home.
- Disabled preferences suppress creation of matching notifications for that user and home.
- Users can only manage preferences for homes they can access.
- Preferences must not create access to another home's notifications.

## Recipients

For each qualifying event:

- Create a notification for the homeowner assigned to the event's home if preferences allow it.
- Create a notification for the admin if preferences allow it.
- Do not create notifications for homeowners assigned to other homes.

## Human-Readable Examples

Light turned on:

- Title: `Living Room Light turned on`
- Message: `Living Room Light in Home 1 was turned on.`
- Severity: `info`

Heater target changed:

- Title: `Bedroom Heater target changed`
- Message: `Bedroom Heater target temperature was set to 22°C.`
- Severity: `info`

Door unlocked:

- Title: `Front Door unlocked`
- Message: `Front Door in Home 2 was unlocked.`
- Severity: `critical`
