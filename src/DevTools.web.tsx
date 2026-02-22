import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  listeners,
  getCategoryColor,
  formatLogsAsMarkdown,
  formatEntryAsMarkdown,
  type LogEntry,
  type UserEntry,
  type UserMetadata,
  type Listener,
} from './core';

export function DevTools({
  users,
  title,
  top,
  bottom,
  left,
  right,
}: {
  users?: Record<string, UserEntry>;
  title?: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) {
  return <DevToolsInner title={title} users={users} top={top} bottom={bottom} left={left} right={right} />;
}

type ResizeEdge = 'left' | 'top' | 'top-left';

interface ResizeDrag {
  edge: ResizeEdge;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
}

function DevToolsInner({
  users,
  title,
  top,
  bottom,
  left,
  right,
}: {
  users?: Record<string, UserEntry>;
  title?: string;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false);
  const [size, setSize] = useState({ width: 360, height: 320 });
  const logsEndRef = useRef<HTMLDivElement>(null);
  const resizeDrag = useRef<ResizeDrag | null>(null);

  useEffect(() => setMounted(true), []);

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
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = resizeDrag.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setSize((prev) => {
        const next = { ...prev };
        if (drag.edge === 'left' || drag.edge === 'top-left') {
          next.width = Math.max(240, drag.startW - dx);
        }
        if (drag.edge === 'top' || drag.edge === 'top-left') {
          next.height = Math.max(140, drag.startH - dy);
        }
        return next;
      });
    };
    const onMouseUp = () => {
      resizeDrag.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const startResize = (edge: ResizeEdge) => (e: React.MouseEvent) => {
    e.preventDefault();
    resizeDrag.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor =
      edge === 'left'
        ? 'ew-resize'
        : edge === 'top'
          ? 'ns-resize'
          : 'nw-resize';
  };

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

  if (!mounted) return null;

  // Determine anchor edge: if only top is given (no bottom), anchor top; otherwise anchor bottom.
  // Same logic for left vs right.
  const anchoredTop = top !== undefined && bottom === undefined;
  const anchoredLeft = left !== undefined && right === undefined;

  const containerPos: React.CSSProperties = {
    bottom: anchoredTop ? undefined : (bottom ?? 16),
    top: anchoredTop ? top : undefined,
    right: anchoredLeft ? undefined : (right ?? 16),
    left: anchoredLeft ? left : undefined,
  };

  // Panel opens away from the anchor edge
  const panelPos: React.CSSProperties = {
    bottom: anchoredTop ? undefined : 56,
    top: anchoredTop ? 56 : undefined,
    right: anchoredLeft ? undefined : 0,
    left: anchoredLeft ? 0 : undefined,
  };

  return (
    <div style={{ ...s.container, ...containerPos }}>
      {isOpen && (
        <div
          style={{
            ...s.panel,
            ...panelPos,
            width: size.width,
            height: size.height,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Resize handles */}
          <div onMouseDown={startResize('left')} style={s.resizeLeft} />
          <div onMouseDown={startResize('top')} style={s.resizeTop} />
          <div onMouseDown={startResize('top-left')} style={s.resizeTopLeft} />

          {/* Header */}
          <div style={s.header}>
            <span style={s.headerTitle}>{title ?? 'Logs'}</span>
            <div style={s.headerActions}>
              <CopyButton
                getText={() => formatLogsAsMarkdown(visibleLogs)}
                label="Copy all"
              />
              <button onClick={() => setLogs([])} style={s.clearBtn}>
                Clear
              </button>
              <button onClick={() => setIsOpen(false)} style={s.closeBtn}>
                ✕
              </button>
            </div>
          </div>

          {/* Category filter bar */}
          {(categories.length > 0 || hasUsers) && (
            <div style={s.filterBar}>
              <FilterPill
                label="All"
                active={activeCategory === null && !showUsers}
                color="#cdd6f4"
                onClick={() => {
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
                  onClick={() => {
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
                  onClick={() => {
                    setShowUsers((v) => !v);
                    setActiveCategory(null);
                  }}
                />
              )}
            </div>
          )}

          {/* Content */}
          <div style={s.content}>
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
              <div style={s.emptyText}>
                No logs yet. Call <code style={s.emptyCode}>devLog()</code> to
                add entries.
              </div>
            ) : visibleLogs.length === 0 ? (
              <div style={s.emptyText}>No logs in this category.</div>
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
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        title="Dev Tools"
        style={{ ...s.bubble, background: isOpen ? '#313244' : '#1e1e2e' }}
      >
        🛠
        {logs.length > 0 && !isOpen && (
          <span style={s.badge}>{logs.length > 99 ? '99+' : logs.length}</span>
        )}
      </button>
    </div>
  );
}

function CopyButton({
  getText,
  label = '⎘',
}: {
  getText: () => string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy as markdown"
      style={{ ...s.copyBtn, color: copied ? '#a6e3a1' : '#a6adc8' }}
    >
      {copied ? '✓' : label}
    </button>
  );
}

function FilterPill({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? color : 'transparent',
        border: `1px solid ${active ? color : '#45475a'}`,
        color: active ? '#1e1e2e' : color,
        borderRadius: 12,
        padding: '1px 8px',
        fontSize: 10,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'monospace',
        transition: 'all 0.1s',
      }}
    >
      {label}
    </button>
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
    <div onClick={() => setExpanded((e) => !e)} style={s.row}>
      <div style={s.rowHeader}>
        <span style={s.userBadge}>user</span>
        <span style={s.rowMessage}>{userId}</span>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={s.rowLink}
          >
            <LinkIcon size={14} />
          </a>
        )}
        <span style={s.rowChevron}>{expanded ? '▲' : '▼'}</span>
        <span style={s.rowCopy}>
          <CopyButton
            getText={() => JSON.stringify({ [userId]: metadata }, null, 2)}
          />
        </span>
      </div>
      {expanded && <pre style={s.pre}>{JSON.stringify(metadata, null, 2)}</pre>}
    </div>
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
    <div
      onClick={hasData ? () => setExpanded((e) => !e) : undefined}
      style={{ ...s.row, cursor: hasData ? 'pointer' : 'default' }}
    >
      <div style={{ ...s.rowHeader, alignItems: 'baseline' }}>
        <span style={s.rowTime}>{time}</span>
        {entry.category && categoryColor && (
          <span
            style={{
              ...s.categoryBadge,
              color: categoryColor,
              border: `1px solid ${categoryColor}`,
            }}
          >
            {entry.category}
          </span>
        )}
        <span style={s.rowMessage}>{entry.message}</span>
        {hasData && <span style={s.rowChevron}>{expanded ? '▲' : '▼'}</span>}
        <span style={s.rowCopy}>
          <CopyButton getText={() => formatEntryAsMarkdown(entry)} />
        </span>
      </div>
      {expanded && hasData && (
        <pre style={s.pre}>{JSON.stringify(entry.data, null, 2)}</pre>
      )}
    </div>
  );
}

function LinkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      style={{ width: size, height: size, flexShrink: 0 }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
    >
      <rect width="256" height="256" fill="none" />
      <path
        d="M141.38,64.68l11-11a46.62,46.62,0,0,1,65.94,0h0a46.62,46.62,0,0,1,0,65.94L193.94,144,183.6,154.34a46.63,46.63,0,0,1-66-.05h0A46.48,46.48,0,0,1,104,120.06"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
      <path
        d="M114.62,191.32l-11,11a46.63,46.63,0,0,1-66-.05h0a46.63,46.63,0,0,1,.06-65.89L72.4,101.66a46.62,46.62,0,0,1,65.94,0h0A46.45,46.45,0,0,1,152,135.94"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="16"
      />
    </svg>
  );
}

// Static styles object — dynamic values are handled inline at the call site
const s: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 16,
    right: 16,
    zIndex: 99999,
  },
  panel: {
    position: 'absolute',
    bottom: 56,
    right: 0,
    maxWidth: 'calc(100vw - 32px)',
    maxHeight: 'calc(100vh - 88px)',
    background: '#1e1e2e',
    border: '1px solid #313244',
    borderRadius: 10,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: 'monospace',
  },
  resizeLeft: {
    position: 'absolute',
    top: 6,
    left: 0,
    bottom: 6,
    width: 6,
    cursor: 'ew-resize',
    zIndex: 1,
  },
  resizeTop: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 6,
    height: 6,
    cursor: 'ns-resize',
    zIndex: 1,
  },
  resizeTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 6,
    height: 6,
    cursor: 'nw-resize',
    zIndex: 2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #313244',
    background: '#181825',
    flexShrink: 0,
  },
  headerTitle: {
    color: '#cdd6f4',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  headerActions: {
    display: 'flex',
    gap: 8,
  },
  clearBtn: {
    background: 'none',
    border: '1px solid #45475a',
    color: '#a6adc8',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    cursor: 'pointer',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#6c7086',
    fontSize: 16,
    cursor: 'pointer',
    lineHeight: 1,
    padding: '2px 4px',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderBottom: '1px solid #313244',
    background: '#181825',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '6px 0',
  },
  emptyText: {
    color: '#6c7086',
    fontSize: 12,
    padding: '12px 16px',
    textAlign: 'center',
  },
  emptyCode: {
    color: '#89b4fa',
  },
  bubble: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '2px solid #45475a',
    color: '#cdd6f4',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    transition: 'background 0.15s',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    background: '#f38ba8',
    color: '#1e1e2e',
    borderRadius: '50%',
    width: 16,
    height: 16,
    fontSize: 9,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'monospace',
  },
  copyBtn: {
    background: 'none',
    border: '1px solid #45475a',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'color 0.15s',
    flexShrink: 0,
  },
  row: {
    padding: '4px 12px',
    borderBottom: '1px solid #181825',
    cursor: 'pointer',
  },
  rowHeader: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  rowTime: {
    color: '#6c7086',
    fontSize: 10,
    flexShrink: 0,
  },
  categoryBadge: {
    fontSize: 9,
    fontWeight: 700,
    flexShrink: 0,
    borderRadius: 8,
    padding: '0 5px',
    lineHeight: '14px',
    opacity: 0.85,
  },
  userBadge: {
    color: '#f5c2e7',
    border: '1px solid #f5c2e7',
    fontSize: 9,
    fontWeight: 700,
    flexShrink: 0,
    borderRadius: 8,
    padding: '0 5px',
    lineHeight: '14px',
    opacity: 0.85,
  },
  rowMessage: {
    color: '#cdd6f4',
    fontSize: 12,
    wordBreak: 'break-word',
  },
  rowLink: {
    color: '#89b4fa',
    fontSize: 10,
    flexShrink: 0,
  },
  rowChevron: {
    color: '#45475a',
    fontSize: 10,
    flexShrink: 0,
  },
  rowCopy: {
    marginLeft: 'auto',
  },
  pre: {
    marginTop: 4,
    color: '#a6e3a1',
    fontSize: 11,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
};
