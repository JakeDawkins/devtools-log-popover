import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Linking,
} from 'react-native';
import {
  listeners,
  getCategoryColor,
  type LogEntry,
  type UserEntry,
  type UserMetadata,
  type Listener,
} from './core';

export function DevTools({
  users,
  title,
  isEnabled,
}: {
  users?: Record<string, UserEntry>;
  title?: string;
  isEnabled?: boolean;
}) {
  if (!isEnabled) return null;
  return <DevToolsInner title={title} users={users} />;
}

function DevToolsInner({
  users,
  title,
}: {
  users?: Record<string, UserEntry>;
  title?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const listener: Listener = (entry) => {
      setLogs((prev) => [...prev, entry]);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [logs, isOpen]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const entry of logs) {
      if (entry.category && !seen.has(entry.category)) {
        seen.add(entry.category);
        result.push(entry.category);
      }
    }
    return result;
  }, [logs]);

  useEffect(() => {
    if (activeCategory && !categories.includes(activeCategory)) {
      setActiveCategory(null);
    }
  }, [categories, activeCategory]);

  const visibleLogs = activeCategory
    ? logs.filter((e) => e.category === activeCategory)
    : logs;

  const hasUsers = users && Object.keys(users).length > 0;
  const hasFilterBar = categories.length > 0 || hasUsers;

  return (
    <>
      {/* Floating bubble */}
      <TouchableOpacity
        onPress={() => setIsOpen((o) => !o)}
        style={s.bubble}
        activeOpacity={0.8}
      >
        <Text style={s.bubbleIcon}>🛠</Text>
        {logs.length > 0 && !isOpen && (
          <View style={s.badge}>
            <Text style={s.badgeText}>
              {logs.length > 99 ? '99+' : logs.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Panel modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={s.modalContainer}>
          <View style={s.panel}>
            {/* Header */}
            <View style={s.header}>
              <Text style={s.headerTitle}>{title ?? 'Logs'}</Text>
              <View style={s.headerActions}>
                <TouchableOpacity
                  onPress={() => setLogs([])}
                  style={s.clearBtn}
                >
                  <Text style={s.clearBtnText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsOpen(false)}
                  style={s.closeBtn}
                >
                  <Text style={s.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter bar */}
            {hasFilterBar && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.filterBar}
                contentContainerStyle={s.filterBarContent}
              >
                <FilterPill
                  label="All"
                  active={activeCategory === null && !showUsers}
                  color="#cdd6f4"
                  onPress={() => {
                    setActiveCategory(null);
                    setShowUsers(false);
                  }}
                />
                {categories.map((cat) => (
                  <FilterPill
                    key={cat}
                    label={cat}
                    active={activeCategory === cat && !showUsers}
                    color={getCategoryColor(categories, cat)}
                    onPress={() => {
                      setShowUsers(false);
                      setActiveCategory((prev) => (prev === cat ? null : cat));
                    }}
                  />
                ))}
                {hasUsers && (
                  <FilterPill
                    label="Users"
                    active={showUsers}
                    color="#f5c2e7"
                    onPress={() => {
                      setShowUsers((v) => !v);
                      setActiveCategory(null);
                    }}
                  />
                )}
              </ScrollView>
            )}

            {/* Content */}
            <ScrollView ref={scrollRef} style={s.content}>
              {showUsers ? (
                Object.entries(users ?? {}).map(
                  ([userId, { link, metadata }]) => (
                    <UserRow
                      key={userId}
                      userId={userId}
                      metadata={metadata}
                      link={link}
                    />
                  ),
                )
              ) : logs.length === 0 ? (
                <Text style={s.emptyText}>
                  No logs yet. Call devLog() to add entries.
                </Text>
              ) : visibleLogs.length === 0 ? (
                <Text style={s.emptyText}>No logs in this category.</Text>
              ) : (
                visibleLogs.map((entry) => (
                  <LogRow
                    key={entry.id}
                    entry={entry}
                    categoryColor={
                      entry.category
                        ? getCategoryColor(categories, entry.category)
                        : undefined
                    }
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function FilterPill({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        s.pill,
        {
          backgroundColor: active ? color : 'transparent',
          borderColor: active ? color : '#45475a',
        },
      ]}
    >
      <Text style={[s.pillText, { color: active ? '#1e1e2e' : color }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function UserRow({
  userId,
  metadata,
  link,
}: {
  userId: string;
  metadata: UserMetadata;
  link?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <TouchableOpacity
      onPress={() => setExpanded((e) => !e)}
      style={s.row}
      activeOpacity={0.7}
    >
      <View style={s.rowHeader}>
        <View style={s.userBadge}>
          <Text style={s.userBadgeText}>user</Text>
        </View>
        <Text style={s.rowMessage} numberOfLines={1}>
          {userId}
        </Text>
        {link && (
          <TouchableOpacity
            onPress={() => Linking.openURL(link)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={s.rowLink}>↗</Text>
          </TouchableOpacity>
        )}
        <Text style={s.rowChevron}>{expanded ? '▲' : '▼'}</Text>
      </View>
      {expanded && (
        <Text style={s.pre}>{JSON.stringify(metadata, null, 2)}</Text>
      )}
    </TouchableOpacity>
  );
}

function LogRow({
  entry,
  categoryColor,
}: {
  entry: LogEntry;
  categoryColor?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasData = entry.data !== undefined;
  const time = entry.timestamp.toLocaleTimeString('en-US', { hour12: false });

  return (
    <TouchableOpacity
      onPress={hasData ? () => setExpanded((e) => !e) : undefined}
      activeOpacity={hasData ? 0.7 : 1}
      style={s.row}
    >
      <View style={s.rowHeader}>
        <Text style={s.rowTime}>{time}</Text>
        {entry.category && categoryColor && (
          <View style={[s.categoryBadge, { borderColor: categoryColor }]}>
            <Text style={[s.categoryBadgeText, { color: categoryColor }]}>
              {entry.category}
            </Text>
          </View>
        )}
        <Text style={s.rowMessage} numberOfLines={expanded ? undefined : 2}>
          {entry.message}
        </Text>
        {hasData && <Text style={s.rowChevron}>{expanded ? '▲' : '▼'}</Text>}
      </View>
      {expanded && hasData && (
        <Text style={s.pre}>{JSON.stringify(entry.data, null, 2)}</Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  bubble: {
    position: 'absolute',
    bottom: 128,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e1e2e',
    borderWidth: 2,
    borderColor: '#45475a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  bubbleIcon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#f38ba8',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#1e1e2e',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#1e1e2e',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: '#313244',
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#313244',
    backgroundColor: '#181825',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerTitle: {
    color: '#cdd6f4',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#45475a',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearBtnText: {
    color: '#a6adc8',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  closeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  closeBtnText: {
    color: '#6c7086',
    fontSize: 16,
    lineHeight: 20,
  },
  filterBar: {
    backgroundColor: '#181825',
    borderBottomWidth: 1,
    borderBottomColor: '#313244',
    flexShrink: 0,
    maxHeight: 40,
  },
  filterBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pill: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
  },
  emptyText: {
    color: '#6c7086',
    fontSize: 12,
    padding: 16,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#181825',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTime: {
    color: '#6c7086',
    fontSize: 10,
    flexShrink: 0,
    fontFamily: 'monospace',
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 5,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 14,
    fontFamily: 'monospace',
  },
  userBadge: {
    borderWidth: 1,
    borderColor: '#f5c2e7',
    borderRadius: 8,
    paddingHorizontal: 5,
  },
  userBadgeText: {
    color: '#f5c2e7',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 14,
    fontFamily: 'monospace',
  },
  rowMessage: {
    color: '#cdd6f4',
    fontSize: 12,
    flex: 1,
    fontFamily: 'monospace',
  },
  rowLink: {
    color: '#89b4fa',
    fontSize: 12,
    flexShrink: 0,
  },
  rowChevron: {
    color: '#45475a',
    fontSize: 10,
    flexShrink: 0,
  },
  pre: {
    marginTop: 4,
    color: '#a6e3a1',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
