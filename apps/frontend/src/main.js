export const frontendScaffold = {
  name: "Smart Home MVP frontend",
  purpose: "Frontend dashboards for authenticated admin and homeowner MVP flows.",
};

const demoCredentials = [
  { label: "Admin", email: "admin@smarthome.local", password: "admin-password" },
  { label: "Homeowner 1", email: "homeowner1@smarthome.local", password: "homeowner1-password" },
  { label: "Homeowner 2", email: "homeowner2@smarthome.local", password: "homeowner2-password" },
];

const preferenceOptions = [
  { label: "All notifications", device_type_key: null, event_type: null },
  { label: "Light power changes", device_type_key: "light", event_type: "power_changed" },
  { label: "Door lock changes", device_type_key: "door_lock", event_type: "lock_state_changed" },
  { label: "Heater temperature warnings", device_type_key: "heater", event_type: "temperature_changed" },
];

function createHttpApi(baseUrl = "") {
  return {
    async request(method, path, { token, body, query } = {}) {
      const url = new URL(`${baseUrl}${path}`, globalThis.location?.origin ?? "http://localhost");
      for (const [key, value] of Object.entries(query ?? {})) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, value);
        }
      }
      const response = await fetch(url, {
        method,
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(body ? { "content-type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: response.status, body: await response.json() };
    },
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatKey(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stateSummary(state) {
  const entries = Object.entries(state ?? {});
  if (entries.length === 0) {
    return "No state reported";
  }
  return entries.map(([key, value]) => `${formatKey(key)}: ${value}`).join(" · ");
}

export function actionLabel(action) {
  return formatKey(action.replace(/^set_/, "set "));
}

export function paramsForAction(action, form) {
  if (action === "set_brightness") {
    return { brightness: Number(form.get("brightness")) };
  }
  if (action === "set_target_temperature") {
    return { target_temperature_c: Number(form.get("target_temperature_c")) };
  }
  return {};
}

export function visibleHomesForUser(user, homes) {
  const accessible = new Set(user?.accessibleHomeIds ?? []);
  return homes.filter((home) => accessible.has(home.id));
}

function capabilityActionInput(action, device) {
  if (action === "set_brightness") {
    const value = device.state?.brightness ?? 0;
    return `<label class="control-field">Brightness <input name="brightness" type="number" min="0" max="100" value="${escapeHtml(value)}" /></label>`;
  }
  if (action === "set_target_temperature") {
    const value = device.state?.target_temperature_c ?? 21;
    return `<label class="control-field">Target °C <input name="target_temperature_c" type="number" step="0.5" value="${escapeHtml(value)}" /></label>`;
  }
  return "";
}

function renderDeviceControls(device) {
  const actions = device.capabilities.flatMap((capability) => capability.actions);
  if (actions.length === 0) {
    return `<p class="empty-state">No controls available for this device.</p>`;
  }
  return actions
    .map(
      (action) => `
        <form class="device-action" data-device-id="${escapeHtml(device.id)}" data-action="${escapeHtml(action)}">
          ${capabilityActionInput(action, device)}
          <button type="submit" ${device.status !== "online" ? "disabled" : ""}>${escapeHtml(actionLabel(action))}</button>
        </form>
      `,
    )
    .join("");
}

function renderHomeTabs(state) {
  if (state.homes.length === 0) {
    return `<p class="empty-state">No homes are available for this user.</p>`;
  }
  return `
    <div class="home-tabs" aria-label="Homes">
      ${state.homes
        .map(
          (home) => `
            <button class="tab ${home.id === state.selectedHomeId ? "active" : ""}" data-select-home="${escapeHtml(home.id)}">
              ${escapeHtml(home.name)}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderRooms(rooms) {
  if (rooms.length === 0) {
    return `<p class="empty-state">No rooms are configured for this home.</p>`;
  }
  return `
    <div class="grid compact-grid">
      ${rooms.map((room) => `<article class="card"><h3>${escapeHtml(room.name)}</h3><p>${escapeHtml(room.id)}</p></article>`).join("")}
    </div>
  `;
}

function renderDevices(devices) {
  if (devices.length === 0) {
    return `<p class="empty-state">No devices are configured for this home.</p>`;
  }
  return `
    <div class="grid device-grid">
      ${devices
        .map(
          (device) => `
            <article class="card device-card">
              <div class="card-heading">
                <div>
                  <h3>${escapeHtml(device.name)}</h3>
                  <p>${escapeHtml(formatKey(device.deviceTypeKey))}</p>
                </div>
                <span class="status ${device.status}">${escapeHtml(device.status)}</span>
              </div>
              <p class="state-line">${escapeHtml(stateSummary(device.state))}</p>
              <div class="controls">${renderDeviceControls(device)}</div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderEvents(events) {
  if (events.length === 0) {
    return `<p class="empty-state">No device events have been recorded for this home.</p>`;
  }
  return `
    <ul class="timeline">
      ${events
        .map(
          (event) => `
            <li>
              <strong>${escapeHtml(formatKey(event.eventType))}</strong>
              <span>${escapeHtml(event.deviceId)}</span>
              <time>${escapeHtml(event.createdAt)}</time>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderNotifications(notifications) {
  if (notifications.length === 0) {
    return `<p class="empty-state">No notifications for this home.</p>`;
  }
  return `
    <ul class="notification-list">
      ${notifications
        .map(
          (notification) => `
            <li class="notification ${escapeHtml(notification.severity)} ${notification.readAt ? "read" : "unread"}">
              <div>
                <strong>${escapeHtml(notification.title)}</strong>
                <p>${escapeHtml(notification.message)}</p>
              </div>
              <form data-notification-id="${escapeHtml(notification.id)}" data-read="${notification.readAt ? "false" : "true"}">
                <button type="submit">Mark ${notification.readAt ? "unread" : "read"}</button>
              </form>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function preferenceChecked(preferences, option) {
  const preference = preferences.find(
    (candidate) =>
      candidate.deviceTypeKey === option.device_type_key && candidate.eventType === option.event_type,
  );
  return preference?.enabled !== false;
}

function renderPreferences(preferences) {
  return `
    <form class="preferences-form">
      ${preferenceOptions
        .map(
          (option, index) => `
            <label class="preference-row">
              <span>${escapeHtml(option.label)}</span>
              <input
                type="checkbox"
                name="preference"
                value="${index}"
                ${preferenceChecked(preferences, option) ? "checked" : ""}
              />
            </label>
          `,
        )
        .join("")}
      <button type="submit">Save preferences</button>
    </form>
  `;
}

function renderDashboard(state) {
  const selectedHome = state.homes.find((home) => home.id === state.selectedHomeId);
  const dashboardTitle = state.user.role === "admin" ? "Admin dashboard" : "Homeowner dashboard";
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">Smart Home MVP</p>
        <h1>${dashboardTitle}</h1>
        <p>Signed in as ${escapeHtml(state.user.displayName)} (${escapeHtml(state.user.role)})</p>
      </div>
      <button class="secondary" data-logout>Sign out</button>
    </header>

    ${state.error ? `<div class="alert error">${escapeHtml(state.error)}</div>` : ""}
    ${state.message ? `<div class="alert success">${escapeHtml(state.message)}</div>` : ""}
    ${renderHomeTabs(state)}

    ${selectedHome ? `
      <main class="dashboard">
        <section class="panel hero-panel">
          <div>
            <p class="eyebrow">${state.user.role === "admin" ? "Admin home detail" : "Home dashboard"}</p>
            <h2>${escapeHtml(selectedHome.name)}</h2>
            <p>${escapeHtml(selectedHome.id)}</p>
          </div>
          ${state.user.role === "admin" ? `
            <form class="home-management-form">
              <label>Home name <input name="name" value="${escapeHtml(selectedHome.name)}" required /></label>
              <button type="submit">Update home</button>
            </form>
          ` : ""}
        </section>

        <section class="panel">
          <h2>Rooms</h2>
          ${renderRooms(state.rooms)}
        </section>

        <section class="panel">
          <h2>${state.user.role === "admin" ? "Device management" : "Devices"}</h2>
          ${renderDevices(state.devices)}
        </section>

        <section class="panel split-panel">
          <div>
            <h2>Device events</h2>
            ${renderEvents(state.events)}
          </div>
          <div>
            <h2>Notifications</h2>
            ${renderNotifications(state.notifications)}
          </div>
        </section>

        <section class="panel">
          <h2>Notification preferences</h2>
          ${renderPreferences(state.preferences)}
        </section>
      </main>
    ` : ""}
  `;
}

function renderLogin(state) {
  return `
    <main class="login-shell">
      <section class="login-card">
        <p class="eyebrow">Smart Home MVP</p>
        <h1>Sign in</h1>
        <p>Use one of the MVP users to view the correct admin or homeowner dashboard.</p>
        ${state.error ? `<div class="alert error">${escapeHtml(state.error)}</div>` : ""}
        <form class="login-form">
          <label>Email <input name="email" type="email" autocomplete="username" required /></label>
          <label>Password <input name="password" type="password" autocomplete="current-password" required /></label>
          <button type="submit">Sign in</button>
        </form>
        <div class="demo-users">
          ${demoCredentials
            .map(
              (credential) => `
                <button class="secondary" data-demo-email="${escapeHtml(credential.email)}" data-demo-password="${escapeHtml(credential.password)}">
                  ${escapeHtml(credential.label)}
                </button>
              `,
            )
            .join("")}
        </div>
      </section>
    </main>
  `;
}

export function renderApp(state) {
  if (state.loading) {
    return `<main class="loading-state"><div class="spinner"></div><p>Loading smart home data…</p></main>`;
  }
  if (!state.user) {
    return renderLogin(state);
  }
  return renderDashboard(state);
}

export function collectPreferences(form) {
  const selected = new Set(Array.from(form.querySelectorAll('input[name="preference"]:checked')).map((input) => input.value));
  return preferenceOptions.map((option, index) => ({
    device_type_key: option.device_type_key,
    event_type: option.event_type,
    enabled: selected.has(String(index)),
  }));
}

export function createFrontendApp({ root, api = createHttpApi() }) {
  const state = {
    token: null,
    user: null,
    homes: [],
    selectedHomeId: null,
    rooms: [],
    devices: [],
    events: [],
    notifications: [],
    preferences: [],
    loading: false,
    error: null,
    message: null,
  };

  async function apiRequest(method, path, options = {}) {
    const response = await api.request(method, path, { ...options, token: state.token });
    if (response.status >= 400) {
      throw new Error(response.body?.error ?? "Request failed");
    }
    return response.body;
  }

  function setState(nextState) {
    Object.assign(state, nextState);
    render();
  }

  async function loadHomeData(homeId) {
    const [roomsResponse, devicesResponse, eventsResponse, notificationsResponse, preferencesResponse] =
      await Promise.all([
        apiRequest("GET", `/homes/${homeId}/rooms`),
        apiRequest("GET", `/homes/${homeId}/devices`),
        apiRequest("GET", `/homes/${homeId}/events`),
        apiRequest("GET", `/homes/${homeId}/notifications`),
        apiRequest("GET", `/homes/${homeId}/notification-preferences`),
      ]);
    setState({
      selectedHomeId: homeId,
      rooms: roomsResponse.rooms,
      devices: devicesResponse.devices,
      events: eventsResponse.events,
      notifications: notificationsResponse.notifications,
      preferences: preferencesResponse.preferences,
      error: null,
    });
  }

  async function refreshSelectedHome(message = null) {
    if (!state.selectedHomeId) {
      return;
    }
    await loadHomeData(state.selectedHomeId);
    setState({ message });
  }

  async function login(email, password) {
    setState({ loading: true, error: null, message: null });
    try {
      const loginResponse = await api.request("POST", "/auth/login", { body: { email, password } });
      if (loginResponse.status >= 400) {
        throw new Error(loginResponse.body?.error ?? "Login failed");
      }
      state.token = loginResponse.body.token;
      state.user = (await apiRequest("GET", "/auth/me")).user;
      const homes = visibleHomesForUser(state.user, (await apiRequest("GET", "/homes")).homes);
      setState({ loading: false, homes, selectedHomeId: homes[0]?.id ?? null, error: null });
      if (homes[0]) {
        await loadHomeData(homes[0].id);
      }
    } catch (error) {
      setState({ loading: false, token: null, user: null, error: error.message });
    }
  }

  function logout() {
    setState({
      token: null,
      user: null,
      homes: [],
      selectedHomeId: null,
      rooms: [],
      devices: [],
      events: [],
      notifications: [],
      preferences: [],
      error: null,
      message: null,
    });
  }

  async function handleSubmit(event) {
    if (event.target.matches(".login-form")) {
      event.preventDefault();
      const form = new FormData(event.target);
      await login(form.get("email"), form.get("password"));
      return;
    }

    if (event.target.matches(".home-management-form")) {
      event.preventDefault();
      const form = new FormData(event.target);
      try {
        const response = await apiRequest("PATCH", `/homes/${state.selectedHomeId}`, {
          body: { name: form.get("name") },
        });
        const homes = state.homes.map((home) => (home.id === response.home.id ? response.home : home));
        setState({ homes, message: "Home updated.", error: null });
      } catch (error) {
        setState({ error: error.message, message: null });
      }
      return;
    }

    if (event.target.matches(".device-action")) {
      event.preventDefault();
      const form = new FormData(event.target);
      const action = event.target.dataset.action;
      const deviceId = event.target.dataset.deviceId;
      try {
        await apiRequest("POST", `/homes/${state.selectedHomeId}/devices/${deviceId}/actions`, {
          body: { action, params: paramsForAction(action, form) },
        });
        await refreshSelectedHome(`${actionLabel(action)} sent.`);
      } catch (error) {
        setState({ error: error.message, message: null });
      }
      return;
    }

    if (event.target.matches(".notification-list form")) {
      event.preventDefault();
      try {
        await apiRequest("PATCH", `/homes/${state.selectedHomeId}/notifications/${event.target.dataset.notificationId}`, {
          body: { read: event.target.dataset.read === "true" },
        });
        await refreshSelectedHome("Notification updated.");
      } catch (error) {
        setState({ error: error.message, message: null });
      }
      return;
    }

    if (event.target.matches(".preferences-form")) {
      event.preventDefault();
      try {
        await apiRequest("PUT", `/homes/${state.selectedHomeId}/notification-preferences`, {
          body: { preferences: collectPreferences(event.target) },
        });
        await refreshSelectedHome("Notification preferences saved.");
      } catch (error) {
        setState({ error: error.message, message: null });
      }
    }
  }

  async function handleClick(event) {
    const demo = event.target.closest("[data-demo-email]");
    if (demo) {
      await login(demo.dataset.demoEmail, demo.dataset.demoPassword);
      return;
    }

    const homeButton = event.target.closest("[data-select-home]");
    if (homeButton) {
      try {
        await loadHomeData(homeButton.dataset.selectHome);
      } catch (error) {
        setState({ error: error.message, message: null });
      }
      return;
    }

    if (event.target.closest("[data-logout]")) {
      logout();
    }
  }

  function render() {
    root.innerHTML = renderApp(state);
  }

  root.addEventListener("submit", handleSubmit);
  root.addEventListener("click", handleClick);
  render();

  return { state, login, logout, loadHomeData, render };
}

export function injectStyles(documentRef = globalThis.document) {
  if (!documentRef || documentRef.getElementById("smart-home-styles")) {
    return;
  }
  const style = documentRef.createElement("style");
  style.id = "smart-home-styles";
  style.textContent = `
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f6f8fb; color: #172033; }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 320px; background: #f6f8fb; }
    button, input { font: inherit; }
    button { border: 0; border-radius: 999px; background: #2563eb; color: white; padding: 0.7rem 1rem; font-weight: 700; cursor: pointer; }
    button:disabled { background: #94a3b8; cursor: not-allowed; }
    button.secondary { background: #e2e8f0; color: #172033; }
    input { width: 100%; border: 1px solid #cbd5e1; border-radius: 0.75rem; padding: 0.65rem 0.75rem; }
    h1, h2, h3, p { margin-top: 0; }
    .login-shell, .loading-state { min-height: 100vh; display: grid; place-items: center; padding: 1.25rem; }
    .login-card, .panel, .topbar { background: white; border: 1px solid #e2e8f0; border-radius: 1.25rem; box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08); }
    .login-card { width: min(100%, 460px); padding: 2rem; }
    .login-form, .preferences-form, .home-management-form { display: grid; gap: 1rem; }
    .demo-users { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
    .topbar { margin: 1rem auto; width: min(1180px, calc(100% - 2rem)); padding: 1.25rem; display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    .dashboard { width: min(1180px, calc(100% - 2rem)); margin: 0 auto 2rem; display: grid; gap: 1rem; }
    .panel { padding: 1.25rem; }
    .hero-panel { background: linear-gradient(135deg, #eff6ff, #ffffff); display: flex; justify-content: space-between; gap: 1rem; align-items: end; }
    .eyebrow { color: #2563eb; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; font-size: 0.75rem; margin-bottom: 0.25rem; }
    .home-tabs { width: min(1180px, calc(100% - 2rem)); margin: 0 auto 1rem; display: flex; gap: 0.5rem; overflow-x: auto; }
    .tab { background: white; color: #172033; border: 1px solid #e2e8f0; }
    .tab.active { background: #2563eb; color: white; }
    .grid { display: grid; gap: 1rem; }
    .compact-grid { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .device-grid { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .card { border: 1px solid #e2e8f0; border-radius: 1rem; padding: 1rem; background: #fbfdff; }
    .card-heading { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .status { border-radius: 999px; padding: 0.25rem 0.65rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
    .status.online { background: #dcfce7; color: #166534; }
    .status.offline { background: #fee2e2; color: #991b1b; }
    .state-line { color: #475569; }
    .controls { display: grid; gap: 0.65rem; }
    .device-action { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: end; }
    .control-field { flex: 1 1 150px; }
    .split-panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 1.25rem; }
    .timeline, .notification-list { display: grid; gap: 0.75rem; list-style: none; padding: 0; margin: 0; }
    .timeline li, .notification { border: 1px solid #e2e8f0; border-radius: 1rem; padding: 0.85rem; background: #fff; }
    .timeline span, .timeline time { display: block; color: #64748b; font-size: 0.9rem; }
    .notification { display: flex; justify-content: space-between; gap: 1rem; align-items: center; border-left: 0.35rem solid #2563eb; }
    .notification.warning { border-left-color: #f59e0b; }
    .notification.critical { border-left-color: #dc2626; }
    .notification.read { opacity: 0.72; }
    .preference-row { display: flex; justify-content: space-between; gap: 1rem; align-items: center; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 0.85rem; }
    .preference-row input { width: auto; }
    .alert { width: min(1180px, calc(100% - 2rem)); margin: 0 auto 1rem; border-radius: 1rem; padding: 0.9rem 1rem; font-weight: 700; }
    .login-card .alert { width: 100%; }
    .alert.error { background: #fee2e2; color: #991b1b; }
    .alert.success { background: #dcfce7; color: #166534; }
    .empty-state { color: #64748b; border: 1px dashed #cbd5e1; border-radius: 1rem; padding: 1rem; background: #f8fafc; }
    .spinner { width: 3rem; height: 3rem; border-radius: 50%; border: 0.35rem solid #dbeafe; border-top-color: #2563eb; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 760px) { .topbar, .split-panel, .notification, .hero-panel { grid-template-columns: 1fr; display: grid; } .topbar { align-items: stretch; } }
  `;
  documentRef.head.append(style);
}

if (typeof document !== "undefined") {
  injectStyles(document);
  const root = document.getElementById("app");
  if (root) {
    createFrontendApp({ root });
  }
}
