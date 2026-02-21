import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { devLog, DevTools } from 'devtools-log-popover';

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
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <SafeAreaView style={s.safe}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          <Text style={s.title}>devtools-log-popover</Text>
          <Text style={s.subtitle}>
            Native example — tap the buttons below to generate log entries, then open the 🛠 bubble in the bottom-right corner.
          </Text>

          <Section label="Basic logs">
            <DemoButton
              label="Info log"
              onPress={() => devLog('App mounted successfully')}
            />
            <DemoButton
              label="Log with data"
              onPress={() =>
                devLog('Config loaded', {
                  theme: 'dark',
                  locale: 'en-US',
                  featureFlags: { newDashboard: true, betaSearch: false },
                })
              }
            />
            <DemoButton
              label="Log array"
              onPress={() =>
                devLog('Active sessions', [
                  'session-a1b2',
                  'session-c3d4',
                  'session-e5f6',
                ])
              }
            />
          </Section>

          <Section label="Auth">
            <DemoButton
              color="#89b4fa"
              label="User signed in"
              onPress={() =>
                devLog(
                  'User signed in',
                  { userId: 'user-001', method: 'oauth', provider: 'google' },
                  'auth',
                )
              }
            />
            <DemoButton
              color="#89b4fa"
              label="Token refresh failed"
              onPress={() =>
                devLog(
                  'Token refresh failed',
                  { reason: 'expired', retryIn: 30 },
                  'auth',
                )
              }
            />
          </Section>

          <Section label="API">
            <DemoButton
              color="#a6e3a1"
              label="GET /api/users"
              onPress={() =>
                devLog(
                  'GET /api/users',
                  { status: 200, duration: '142ms', count: 24 },
                  'api',
                )
              }
            />
            <DemoButton
              color="#a6e3a1"
              label="POST /api/orders failed"
              onPress={() =>
                devLog(
                  'POST /api/orders failed',
                  { status: 422, error: 'Insufficient stock', sku: 'WIDGET-99' },
                  'api',
                )
              }
            />
          </Section>

          <Section label="UI">
            <DemoButton
              color="#f9e2af"
              label="Modal opened"
              onPress={() =>
                devLog(
                  'Modal opened',
                  { id: 'confirm-delete', trigger: 'button-tap' },
                  'ui',
                )
              }
            />
            <DemoButton
              color="#f9e2af"
              label="Screen navigated"
              onPress={() =>
                devLog(
                  'Screen navigated',
                  { from: 'Home', to: 'Settings' },
                  'ui',
                )
              }
            />
          </Section>

          <Section label="Performance">
            <DemoButton
              color="#fab387"
              label="Render time"
              onPress={() =>
                devLog(
                  'Render time',
                  { component: 'FlatList', ms: 87, items: 500 },
                  'perf',
                )
              }
            />
          </Section>

          <Section label="Burst">
            <DemoButton
              label="Log 10 entries"
              onPress={() => {
                const categories = ['auth', 'api', 'ui', 'perf', 'ws'];
                for (let i = 0; i < 10; i++) {
                  const cat = categories[i % categories.length];
                  devLog(`Burst log #${i + 1}`, { index: i, ts: Date.now() }, cat);
                }
              }}
            />
          </Section>
        </ScrollView>
      </SafeAreaView>

      {/* Rendered outside SafeAreaView so position:absolute is relative to the
          full screen and the bubble is always on top of all content. */}
      <DevTools isEnabled title="Native Example Logs" users={DEMO_USERS} />
    </View>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionButtons}>{children}</View>
    </View>
  );
}

function DemoButton({
  label,
  color = '#45475a',
  onPress,
}: {
  label: string;
  color?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.btn, { borderColor: color }]}
      activeOpacity={0.7}
    >
      <Text style={[s.btnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#13131a',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#cdd6f4',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#6c7086',
    lineHeight: 20,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c7086',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  sectionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  btn: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  btnText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
