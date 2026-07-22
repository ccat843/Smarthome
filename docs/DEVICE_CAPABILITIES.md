# Device Capabilities

Every device must use a common capability-based interface. Device type checks may select supported capabilities, but action handling must validate against capabilities rather than hard-coded UI assumptions.

## Common Device Interface

Each device must expose:

- `id`
- `home_id`
- `room_id`
- `device_type_key`
- `name`
- `status`: `online` or `offline`
- `capabilities`: list of capability objects
- `state`: JSON object containing values required by the capabilities

Each capability object should include:

- `key`: capability key.
- `actions`: supported action keys.
- `state_fields`: state fields controlled or reported by the capability.

Action execution must follow this sequence:

1. Verify current user can access the device's home.
2. Verify the device is online.
3. Verify the action is supported by at least one device capability.
4. Validate action params.
5. Apply state change through the device abstraction layer.
6. Record a device event.
7. Create notifications when rules require them.

## Shared Capabilities

### `power`

State fields:

- `power`: `on` or `off`.

Actions:

- `turn_on`: sets `power` to `on`.
- `turn_off`: sets `power` to `off`.

Events:

- `power_changed` when `power` changes.

### `temperature_control`

State fields:

- `power`: `on` or `off`.
- `target_temperature_c`: number.
- `current_temperature_c`: number.

Actions:

- `turn_on`: sets `power` to `on`.
- `turn_off`: sets `power` to `off`.
- `set_target_temperature`: requires `target_temperature_c` number.

Events:

- `power_changed` when `power` changes.
- `target_temperature_changed` when the target changes.
- `temperature_changed` when simulator changes current temperature.

### `lock_control`

State fields:

- `lock_state`: `locked` or `unlocked`.

Actions:

- `lock`: sets `lock_state` to `locked`.
- `unlock`: sets `lock_state` to `unlocked`.

Events:

- `lock_state_changed` when `lock_state` changes.

## Device Types

### Light

Device type key: `light`

Capabilities:

- `power`

Initial state example:

```json
{
  "power": "off"
}
```

Supported actions:

- `turn_on`
- `turn_off`

Notification-relevant events:

- `power_changed`

### Heater

Device type key: `heater`

Capabilities:

- `temperature_control`

Initial state example:

```json
{
  "power": "off",
  "target_temperature_c": 21,
  "current_temperature_c": 20
}
```

Supported actions:

- `turn_on`
- `turn_off`
- `set_target_temperature`

Notification-relevant events:

- `power_changed`
- `target_temperature_changed`
- `temperature_changed`

### Door Lock

Device type key: `door_lock`

Capabilities:

- `lock_control`

Initial state example:

```json
{
  "lock_state": "locked"
}
```

Supported actions:

- `lock`
- `unlock`

Notification-relevant events:

- `lock_state_changed`
