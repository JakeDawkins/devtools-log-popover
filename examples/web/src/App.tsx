import { useState } from 'react';
import { devLog, DevTools, PRESET_COLORS, type PresetColor } from 'devtools-log-popover';

const DEMO_USERS = {
  'user-001': {
    link: 'https://example.com/users/001',
    metadata: { name: 'Alice', role: 'admin', plan: 'pro', logins: 42 },
  },
  'user-002': {
    metadata: { name: 'Bob', role: 'viewer', plan: 'free', logins: 7 },
  },
};

export default function App() {
  const [buttonColor, setButtonColor] = useState<PresetColor | undefined>(undefined);
  const [label, setLabel] = useState('');

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>devtools-log-popover</h1>
        <p style={s.subtitle}>Web example — click the buttons below to generate log entries, then open the 🛠 popover in the bottom-right corner.</p>

        <Section label="Basic logs">
          <Row>
            <DemoButton
              label="Info log"
              onClick={() => devLog('App mounted successfully')}
            />
            <DemoButton
              label="Log with data"
              onClick={() =>
                devLog('Config loaded', { theme: 'dark', locale: 'en-US', featureFlags: { newDashboard: true, betaSearch: false } })
              }
            />
            <DemoButton
              label="Log array"
              onClick={() =>
                devLog('Active sessions', ['session-a1b2', 'session-c3d4', 'session-e5f6'])
              }
            />
          </Row>
        </Section>

        <Section label="Categorised logs">
          <Row>
            <DemoButton
              color="#89b4fa"
              label="Auth event"
              onClick={() =>
                devLog('User signed in', { userId: 'user-001', method: 'oauth', provider: 'google' }, 'auth')
              }
            />
            <DemoButton
              color="#89b4fa"
              label="Auth error"
              onClick={() =>
                devLog('Token refresh failed', { reason: 'expired', retryIn: 30 }, 'auth')
              }
            />
          </Row>
          <Row>
            <DemoButton
              color="#a6e3a1"
              label="API request"
              onClick={() =>
                devLog('GET /api/users', { status: 200, duration: '142ms', count: 24 }, 'api')
              }
            />
            <DemoButton
              color="#a6e3a1"
              label="API error"
              onClick={() =>
                devLog('POST /api/orders failed', { status: 422, error: 'Insufficient stock', sku: 'WIDGET-99' }, 'api')
              }
            />
          </Row>
          <Row>
            <DemoButton
              color="#f9e2af"
              label="UI interaction"
              onClick={() =>
                devLog('Modal opened', { id: 'confirm-delete', trigger: 'button-click' }, 'ui')
              }
            />
            <DemoButton
              color="#f9e2af"
              label="Navigation"
              onClick={() =>
                devLog('Route changed', { from: '/dashboard', to: '/settings/profile' }, 'ui')
              }
            />
          </Row>
          <Row>
            <DemoButton
              color="#fab387"
              label="Perf metric"
              onClick={() =>
                devLog('Render time', { component: 'DataTable', ms: 87, rows: 500 }, 'perf')
              }
            />
            <DemoButton
              color="#cba6f7"
              label="WS event"
              onClick={() =>
                devLog('Socket message received', { event: 'price_update', symbol: 'BTC', price: 67420.5 }, 'ws')
              }
            />
          </Row>
        </Section>

        <Section label="Burst">
          <Row>
            <DemoButton
              label="Log 10 entries"
              onClick={() => {
                const categories = ['auth', 'api', 'ui', 'perf', 'ws'];
                for (let i = 0; i < 10; i++) {
                  const cat = categories[i % categories.length];
                  devLog(`Burst log #${i + 1}`, { index: i, ts: Date.now() }, cat);
                }
              }}
            />
          </Row>
        </Section>

        <Section label="DevTools button">
          <div style={s.configRow}>
            <span style={s.configLabel}>Color</span>
            <div style={s.swatches}>
              <button
                style={{
                  ...s.swatch,
                  background: 'transparent',
                  border: buttonColor === undefined ? '2px solid #cdd6f4' : '2px solid #45475a',
                  color: '#6c7086',
                }}
                onClick={() => setButtonColor(undefined)}
                title="Default"
              >
                –
              </button>
              {(Object.entries(PRESET_COLORS) as [PresetColor, string][]).map(([name, hex]) => (
                <button
                  key={name}
                  style={{
                    ...s.swatch,
                    background: hex,
                    border: buttonColor === name ? '2px solid #cdd6f4' : '2px solid transparent',
                  }}
                  onClick={() => setButtonColor(name)}
                  title={name}
                />
              ))}
            </div>
          </div>
          <div style={s.configRow}>
            <span style={s.configLabel}>Label</span>
            <input
              style={s.input}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. staging"
              maxLength={20}
            />
          </div>
        </Section>
      </div>

      <DevTools title="Web Example Logs" users={DEMO_USERS} buttonColor={buttonColor} label={label || undefined} />
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={s.section}>
      <p style={s.sectionLabel}>{label}</p>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={s.row}>{children}</div>;
}

function DemoButton({
  label,
  color = '#45475a',
  onClick,
}: {
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ ...s.btn, borderColor: color, color }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = color + '22';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {label}
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 16px 100px',
  },
  card: {
    width: '100%',
    maxWidth: 560,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#cdd6f4',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#6c7086',
    lineHeight: 1.6,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6c7086',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  row: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  btn: {
    background: 'transparent',
    border: '1px solid',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'monospace',
    transition: 'background 0.12s',
  },
  configRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  configLabel: {
    fontSize: 11,
    color: '#6c7086',
    fontFamily: 'monospace',
    width: 36,
    flexShrink: 0,
  },
  swatches: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    cursor: 'pointer',
    padding: 0,
    fontSize: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    background: 'transparent',
    border: '1px solid #45475a',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 12,
    color: '#cdd6f4',
    fontFamily: 'monospace',
    outline: 'none',
    width: 160,
  },
};
