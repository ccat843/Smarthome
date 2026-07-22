# MVP Scope

## Included Features

The MVP includes only the following features:

- Authentication for one admin and two homeowners.
- Two homes with strict home-level data isolation.
- Rooms within each home.
- Devices assigned to rooms and homes.
- Three device types: light, heater, and door lock.
- Common capability-based device interface.
- Device state viewing.
- Device action execution through validated capabilities.
- Device event recording.
- Notifications created from device events.
- Notification preferences scoped to a user and home.
- A simulator for device state changes and generated events.

## Excluded Features

The MVP explicitly excludes:

- More than two homes.
- More than one admin.
- More than two homeowners.
- User self-registration.
- Inviting additional users.
- Real IoT device integrations.
- Mobile apps.
- Voice assistants.
- Automations, schedules, scenes, or routines.
- Energy reports or analytics.
- Billing or subscriptions.
- Geolocation.
- Camera, sensor, thermostat, appliance, or alarm device types.
- Cross-home sharing for homeowners.
- Notification delivery through email, SMS, or push providers.

## Success Criteria

The MVP is successful when:

- Admin can access both homes and verify all configured rooms, devices, events, and notifications.
- Each homeowner can access exactly one home.
- A homeowner cannot access another home's data by changing URLs, IDs, API parameters, or request bodies.
- Light, heater, and door lock devices all use the same capability-based contract.
- Device actions update device state through the device abstraction layer.
- Device actions and simulator changes create device events.
- Important device events create notifications scoped to the correct home and device.
