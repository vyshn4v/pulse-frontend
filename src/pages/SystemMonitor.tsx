import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../lib/api';
import {
  Cpu,
  Server,
  HardDrive,
  Activity,
  ArrowLeft,
  RefreshCw,
  Play,
  Pause,
  Clock,
  Zap,
  Globe,
  Radio,
  Layers,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
} from 'lucide-react';

interface CpuCoreInfo {
  core: number;
  model: string;
  speedMhz: number;
  usagePercent: number;
}

interface CpuMetrics {
  model: string;
  architecture: string;
  coreCount: number;
  overallUsagePercent: number;
  cores: CpuCoreInfo[];
  loadAverage: number[];
}

interface MemoryMetrics {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  usagePercent: number;
  totalFormatted: string;
  usedFormatted: string;
  freeFormatted: string;
  process: {
    rssBytes: number;
    rssFormatted: string;
    heapTotalBytes: number;
    heapTotalFormatted: string;
    heapUsedBytes: number;
    heapUsedFormatted: string;
    externalBytes: number;
    externalFormatted: string;
  };
}

interface DiskMetrics {
  totalBytes: number;
  freeBytes: number;
  usedBytes: number;
  usagePercent: number;
  totalFormatted: string;
  usedFormatted: string;
  freeFormatted: string;
  path: string;
}

interface HostInfo {
  hostname: string;
  platform: string;
  platformFormatted: string;
  type: string;
  release: string;
  arch: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  processUptimeSeconds: number;
  processUptimeFormatted: string;
  nodeVersion: string;
  v8Version: string;
  pid: number;
}

interface NetworkInterfaceInfo {
  name: string;
  ip: string;
  family: string;
  internal: boolean;
  mac: string;
}

export interface ServiceResourceUsage {
  service: 'postgres' | 'redis';
  displayName: string;
  status: 'running' | 'stopped' | 'offline';
  cpuPercent: number;
  memoryBytes: number;
  memoryFormatted: string;
  memoryPercent: number;
  details?: {
    activeConnections?: number;
    databaseSizeFormatted?: string;
    usedMemoryRssBytes?: number;
    usedMemoryPeakFormatted?: string;
    connectedClients?: number;
    processCount?: number;
  };
}

export interface ServicesMetrics {
  postgres: ServiceResourceUsage;
  redis: ServiceResourceUsage;
}

interface SystemSnapshot {
  timestamp: string;
  host: HostInfo;
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics | null;
  network: NetworkInterfaceInfo[];
  services?: ServicesMetrics;
  eventLoopLagMs: number;
}

interface MetricHistoryPoint {
  timeLabel: string;
  cpu: number;
  memory: number;
  heapUsedMb: number;
}

export const SystemMonitor: React.FC = () => {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [history, setHistory] = useState<MetricHistoryPoint[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'paused' | 'error'>('connecting');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'cores' | 'memory' | 'host'>('overview');
  const [chartHoverIndex, setChartHoverIndex] = useState<number | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const maxHistoryPoints = 30;

  // Process incoming metrics snapshot
  const processSnapshot = (data: SystemSnapshot) => {
    setSnapshot(data);
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString());

    const timeLabel = now.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    const heapUsedMb = Math.round(data.memory.process.heapUsedBytes / (1024 * 1024));

    setHistory((prev) => {
      const next = [
        ...prev,
        {
          timeLabel,
          cpu: data.cpu.overallUsagePercent,
          memory: data.memory.usagePercent,
          heapUsedMb,
        },
      ];
      if (next.length > maxHistoryPoints) {
        return next.slice(next.length - maxHistoryPoints);
      }
      return next;
    });
  };

  // Connect to SSE Stream
  const connectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');
    const streamUrl = apiUrl('/api/system-monitor/stream');

    try {
      const es = new EventSource(streamUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionStatus('connected');
      };

      es.addEventListener('metrics', (event: MessageEvent) => {
        try {
          const data: SystemSnapshot = JSON.parse(event.data);
          processSnapshot(data);
          setConnectionStatus('connected');
        } catch (err) {
          console.error('Failed to parse SSE metrics payload:', err);
        }
      });

      es.onerror = () => {
        setConnectionStatus('error');
        // Fallback: trigger a one-shot fetch snapshot
        fetchSnapshotFallback();
      };
    } catch (err) {
      console.error('SSE initialization error:', err);
      setConnectionStatus('error');
      fetchSnapshotFallback();
    }
  };

  const fetchSnapshotFallback = async () => {
    try {
      const res = await fetch(apiUrl('/api/system-monitor/stats'), { credentials: 'include' });
      if (res.ok) {
        const data: SystemSnapshot = await res.json();
        processSnapshot(data);
      }
    } catch {}
  };

  useEffect(() => {
    if (isStreaming) {
      connectSSE();
    } else {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnectionStatus('paused');
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isStreaming]);

  const toggleStreaming = () => {
    setIsStreaming((prev) => !prev);
  };

  const handleManualRefresh = async () => {
    await fetchSnapshotFallback();
  };

  // Color helper based on percentage load
  const getLoadColor = (percent: number): string => {
    if (percent < 60) return 'var(--accent-2, #5fa8a0)';
    if (percent < 85) return 'var(--accent, #e8a33d)';
    return 'var(--danger, #d66a5f)';
  };

  // SVG Chart path calculation
  const chartSvgPaths = useMemo(() => {
    if (history.length < 2) return { cpuPath: '', memPath: '', cpuArea: '', memArea: '' };

    const width = 600;
    const height = 140;
    const padding = 10;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const pointsCpu: [number, number][] = history.map((pt, i) => {
      const x = padding + (i / (history.length - 1)) * innerWidth;
      const y = height - padding - (pt.cpu / 100) * innerHeight;
      return [x, y];
    });

    const pointsMem: [number, number][] = history.map((pt, i) => {
      const x = padding + (i / (history.length - 1)) * innerWidth;
      const y = height - padding - (pt.memory / 100) * innerHeight;
      return [x, y];
    });

    const cpuPath = pointsCpu.reduce((acc, [x, y], i) => `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`, '');
    const memPath = pointsMem.reduce((acc, [x, y], i) => `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`, '');

    const cpuArea = `${cpuPath} L ${pointsCpu[pointsCpu.length - 1][0].toFixed(1)},${height - padding} L ${pointsCpu[0][0].toFixed(1)},${height - padding} Z`;
    const memArea = `${memPath} L ${pointsMem[pointsMem.length - 1][0].toFixed(1)},${height - padding} L ${pointsMem[0][0].toFixed(1)},${height - padding} Z`;

    return { cpuPath, memPath, cpuArea, memArea, pointsCpu, pointsMem };
  }, [history]);

  return (
    <div className="system-monitor-page" style={{ maxWidth: '1360px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '20px',
        }}
      >
        <div>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-muted)',
              fontSize: '0.84rem',
              marginBottom: '10px',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <ArrowLeft size={15} /> Back to Instrument Panel
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              SYSTEM RESOURCES
            </h1>
            {snapshot && (
              <span
                style={{
                  fontSize: '0.74rem',
                  fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  color: 'var(--text-muted)',
                }}
              >
                {snapshot.host.hostname} · {snapshot.host.platformFormatted} ({snapshot.host.arch})
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Real-time host CPU, memory allocation, storage partitions, and Node.js process telemetry streamed via SSE.
          </p>
        </div>

        {/* Action controls & stream status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Connection status indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontFamily: 'monospace',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor:
                  connectionStatus === 'connected'
                    ? 'var(--accent-2, #5fa8a0)'
                    : connectionStatus === 'paused'
                    ? 'var(--text-muted)'
                    : 'var(--danger)',
                boxShadow:
                  connectionStatus === 'connected'
                    ? '0 0 8px var(--accent-2, #5fa8a0)'
                    : 'none',
                display: 'inline-block',
                animation: connectionStatus === 'connected' ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span style={{ color: 'var(--text-primary)' }}>
              {connectionStatus === 'connected'
                ? 'LIVE SSE (2s)'
                : connectionStatus === 'connecting'
                ? 'CONNECTING...'
                : connectionStatus === 'paused'
                ? 'STREAM PAUSED'
                : 'RECONNECTING'}
            </span>
          </div>

          {/* Pause / Resume Button */}
          <button
            onClick={toggleStreaming}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
            title={isStreaming ? 'Pause live SSE stream' : 'Resume live SSE stream'}
          >
            {isStreaming ? <Pause size={14} /> : <Play size={14} />}
            <span>{isStreaming ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Manual Snapshot Refresh */}
          <button
            onClick={handleManualRefresh}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
            title="Fetch instantaneous snapshot"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary 4 Metric Gauges */}
      {snapshot ? (
        <div className="stats-row" style={{ marginBottom: '24px' }}>
          {/* 1. CPU Overall Load */}
          <div
            className="tile-card"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px 16px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                CPU Load
              </span>
              <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(232, 163, 61, 0.1)', color: 'var(--accent)' }}>
                <Cpu size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: getLoadColor(snapshot.cpu.overallUsagePercent),
                }}
              >
                {snapshot.cpu.overallUsagePercent}%
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {snapshot.cpu.coreCount} Cores ({snapshot.cpu.architecture})
              </span>
            </div>

            {/* Load Progress bar */}
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${snapshot.cpu.overallUsagePercent}%`,
                  background: getLoadColor(snapshot.cpu.overallUsagePercent),
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Load Avg:</span>
              <span style={{ fontFamily: 'monospace' }}>
                {snapshot.cpu.loadAverage.map((l) => l.toFixed(2)).join(' · ') || '0.00 · 0.00 · 0.00'}
              </span>
            </div>
          </div>

          {/* 2. System RAM Usage */}
          <div
            className="tile-card"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                System Memory
              </span>
              <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(95, 168, 160, 0.1)', color: 'var(--accent-2)' }}>
                <Layers size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: getLoadColor(snapshot.memory.usagePercent),
                }}
              >
                {snapshot.memory.usagePercent}%
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {snapshot.memory.usedFormatted} / {snapshot.memory.totalFormatted}
              </span>
            </div>

            {/* RAM Progress Bar */}
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${snapshot.memory.usagePercent}%`,
                  background: getLoadColor(snapshot.memory.usagePercent),
                  transition: 'width 0.4s ease',
                }}
              />
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Available Free:</span>
              <span style={{ fontFamily: 'monospace', color: 'var(--accent-2)' }}>{snapshot.memory.freeFormatted}</span>
            </div>
          </div>

          {/* 3. Host System Uptime */}
          <div
            className="tile-card"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Host Uptime
              </span>
              <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>
                <Clock size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                {snapshot.host.uptimeFormatted}
              </span>
            </div>

            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
              <div style={{ height: '100%', width: '100%', background: 'var(--accent-2)' }} />
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>OS Kernel:</span>
              <span style={{ fontFamily: 'monospace' }}>{snapshot.host.type} {snapshot.host.release}</span>
            </div>
          </div>

          {/* 4. Node.js Server Process */}
          <div
            className="tile-card"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Node Runtime & V8
              </span>
              <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(232, 163, 61, 0.1)', color: 'var(--accent)' }}>
                <Terminal size={18} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)' }}>
                {snapshot.memory.process.heapUsedFormatted}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Heap (RSS {snapshot.memory.process.rssFormatted})
              </span>
            </div>

            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((snapshot.memory.process.heapUsedBytes / (snapshot.memory.process.heapTotalBytes || 1)) * 100))}%`,
                  background: 'var(--accent)',
                }}
              />
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Process Uptime:</span>
              <span style={{ fontFamily: 'monospace' }}>{snapshot.host.processUptimeFormatted} (PID {snapshot.host.pid})</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Activity size={32} style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
          <p>Connecting to host telemetry stream...</p>
        </div>
      )}

      {/* Real-Time Live Trend Chart */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '20px 24px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              Live Telemetry Rolling Timeline
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Continuous real-time stream (last {history.length} samples at 2-second intervals)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '3px', background: 'var(--accent-2, #5fa8a0)', display: 'inline-block' }} />
              <span style={{ color: 'var(--accent-2, #5fa8a0)' }}>CPU Load ({history[history.length - 1]?.cpu || 0}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '3px', background: 'var(--accent, #e8a33d)', display: 'inline-block' }} />
              <span style={{ color: 'var(--accent, #e8a33d)' }}>RAM Usage ({history[history.length - 1]?.memory || 0}%)</span>
            </div>
          </div>
        </div>

        {/* SVG Sparkline Area */}
        <div style={{ width: '100%', height: '160px', position: 'relative' }}>
          {history.length > 1 ? (
            <svg
              viewBox="0 0 600 140"
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-2, #5fa8a0)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent-2, #5fa8a0)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent, #e8a33d)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--accent, #e8a33d)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="10" y1="10" x2="590" y2="10" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="10" y1="70" x2="590" y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="10" y1="130" x2="590" y2="130" stroke="rgba(255,255,255,0.08)" />

              {/* Areas */}
              <path d={chartSvgPaths.memArea} fill="url(#memGradient)" />
              <path d={chartSvgPaths.cpuArea} fill="url(#cpuGradient)" />

              {/* Lines */}
              <path d={chartSvgPaths.memPath} fill="none" stroke="var(--accent, #e8a33d)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d={chartSvgPaths.cpuPath} fill="none" stroke="var(--accent-2, #5fa8a0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              {/* Active data point nodes */}
              {chartSvgPaths.pointsCpu &&
                chartSvgPaths.pointsCpu.map(([x, y], idx) => (
                  <circle
                    key={`cpu-${idx}`}
                    cx={x}
                    cy={y}
                    r={idx === history.length - 1 || chartHoverIndex === idx ? 4 : 2}
                    fill="var(--accent-2, #5fa8a0)"
                    stroke="var(--surface)"
                    strokeWidth="1.5"
                    style={{ transition: 'r 0.15s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setChartHoverIndex(idx)}
                    onMouseLeave={() => setChartHoverIndex(null)}
                  />
                ))}

              {chartSvgPaths.pointsMem &&
                chartSvgPaths.pointsMem.map(([x, y], idx) => (
                  <circle
                    key={`mem-${idx}`}
                    cx={x}
                    cy={y}
                    r={idx === history.length - 1 || chartHoverIndex === idx ? 4 : 2}
                    fill="var(--accent, #e8a33d)"
                    stroke="var(--surface)"
                    strokeWidth="1.5"
                    style={{ transition: 'r 0.15s ease', cursor: 'pointer' }}
                    onMouseEnter={() => setChartHoverIndex(idx)}
                    onMouseLeave={() => setChartHoverIndex(null)}
                  />
                ))}
            </svg>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Collecting initial telemetry points...
            </div>
          )}

          {/* Tooltip on Hover */}
          {chartHoverIndex !== null && history[chartHoverIndex] && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#0e1217',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.76rem',
                fontFamily: 'monospace',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            >
              <div>Time: {history[chartHoverIndex].timeLabel}</div>
              <div style={{ color: 'var(--accent-2)' }}>CPU: {history[chartHoverIndex].cpu}%</div>
              <div style={{ color: 'var(--accent)' }}>RAM: {history[chartHoverIndex].memory}%</div>
              <div>Node Heap: {history[chartHoverIndex].heapUsedMb} MB</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs navigation for deep dive */}
      <div
        className="system-tabs-bar"
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '20px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          paddingBottom: '2px',
        }}
      >
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-muted)',
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <Activity size={15} /> All Cores & Storage
        </button>

        <button
          onClick={() => setActiveTab('memory')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'memory' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'memory' ? 'var(--accent)' : 'var(--text-muted)',
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <Layers size={15} /> Memory & Process Heap
        </button>

        <button
          onClick={() => setActiveTab('host')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'host' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'host' ? 'var(--accent)' : 'var(--text-muted)',
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <Server size={15} /> Hardware & Network Specs
        </button>

        <button
          onClick={() => setActiveTab('services' as any)}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: (activeTab as any) === 'services' ? '2px solid var(--accent)' : '2px solid transparent',
            color: (activeTab as any) === 'services' ? 'var(--accent)' : 'var(--text-muted)',
            padding: '8px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <Database size={15} /> Postgres & Redis RAM/CPU
        </button>
      </div>

      {/* Tab 1: Cores & Storage Breakdown */}
      {activeTab === 'overview' && snapshot && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Per-Core Load Grid */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '20px',
              gridColumn: 'span 2',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Logical Core Activity</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {snapshot.cpu.model}
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-muted)',
                }}
              >
                {snapshot.cpu.coreCount} Threads
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              {snapshot.cpu.cores.map((core) => (
                <div
                  key={core.core}
                  style={{
                    background: '#12161c',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      Core {core.core}
                    </span>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: getLoadColor(core.usagePercent),
                      }}
                    >
                      {core.usagePercent}%
                    </span>
                  </div>

                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${core.usagePercent}%`,
                        background: getLoadColor(core.usagePercent),
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {core.speedMhz > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
                      {core.speedMhz} MHz
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Disk Partition Card */}
          {snapshot.disk && (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Host Storage Partition</h3>
                <HardDrive size={18} color="var(--accent)" />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Mount Path: <code style={{ color: 'var(--text-primary)' }}>{snapshot.disk.path}</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'monospace', color: getLoadColor(snapshot.disk.usagePercent) }}>
                    {snapshot.disk.usagePercent}%
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {snapshot.disk.usedFormatted} / {snapshot.disk.totalFormatted}
                  </span>
                </div>

                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${snapshot.disk.usagePercent}%`,
                      background: getLoadColor(snapshot.disk.usagePercent),
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  <span>Free Space:</span>
                  <span style={{ color: 'var(--accent-2)', fontFamily: 'monospace' }}>{snapshot.disk.freeFormatted}</span>
                </div>
              </div>
            </div>
          )}

          {/* Database & Redis Services RAM & CPU Section */}
          {snapshot.services && (
            <div
              style={{
                gridColumn: '1 / -1',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={17} color="var(--accent)" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                      PostgreSQL & Redis Engine Metrics (RAM & CPU)
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Real-time physical memory (Resident Set Size) and CPU usage allocated to database and caching daemons
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* 1. PostgreSQL Database */}
                <div
                  style={{
                    background: '#12161c',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor:
                            snapshot.services.postgres.status === 'running'
                              ? 'var(--accent-2, #5fa8a0)'
                              : 'var(--danger, #d66a5f)',
                          boxShadow:
                            snapshot.services.postgres.status === 'running'
                              ? '0 0 6px var(--accent-2)'
                              : 'none',
                        }}
                      />
                      <strong style={{ fontSize: '0.92rem' }}>PostgreSQL Database</strong>
                    </div>
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background:
                          snapshot.services.postgres.status === 'running'
                            ? 'rgba(95, 168, 160, 0.1)'
                            : 'rgba(214, 106, 95, 0.1)',
                        color:
                          snapshot.services.postgres.status === 'running'
                            ? 'var(--accent-2)'
                            : 'var(--danger)',
                        border: '1px solid currentColor',
                        textTransform: 'uppercase',
                      }}
                    >
                      {snapshot.services.postgres.status}
                    </span>
                  </div>

                  {/* RAM and CPU Stat Pair */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'var(--surface)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RAM (RSS Memory)</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-2)', marginTop: '2px' }}>
                        {snapshot.services.postgres.memoryFormatted || '0 B'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {snapshot.services.postgres.memoryPercent}% of Host RAM
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPU Load</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)', marginTop: '2px' }}>
                        {snapshot.services.postgres.cpuPercent}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Across {snapshot.services.postgres.details?.processCount || 1} workers
                      </div>
                    </div>
                  </div>

                  {/* Sub details */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                    <span>DB Disk Footprint: <strong style={{ color: 'var(--text-primary)' }}>{snapshot.services.postgres.details?.databaseSizeFormatted || 'N/A'}</strong></span>
                    <span>Active Conns: <strong style={{ color: 'var(--text-primary)' }}>{snapshot.services.postgres.details?.activeConnections ?? '1'}</strong></span>
                  </div>
                </div>

                {/* 2. Redis Cache */}
                <div
                  style={{
                    background: '#12161c',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor:
                            snapshot.services.redis.status === 'running'
                              ? 'var(--accent-2, #5fa8a0)'
                              : 'var(--text-muted)',
                          boxShadow:
                            snapshot.services.redis.status === 'running'
                              ? '0 0 6px var(--accent-2)'
                              : 'none',
                        }}
                      />
                      <strong style={{ fontSize: '0.92rem' }}>Redis Cache & Queues</strong>
                    </div>
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background:
                          snapshot.services.redis.status === 'running'
                            ? 'rgba(95, 168, 160, 0.1)'
                            : 'rgba(255, 255, 255, 0.05)',
                        color:
                          snapshot.services.redis.status === 'running'
                            ? 'var(--accent-2)'
                            : 'var(--text-muted)',
                        border: '1px solid currentColor',
                        textTransform: 'uppercase',
                      }}
                    >
                      {snapshot.services.redis.status}
                    </span>
                  </div>

                  {/* RAM and CPU Stat Pair */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'var(--surface)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RAM (Allocated RSS)</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-2)', marginTop: '2px' }}>
                        {snapshot.services.redis.memoryFormatted || '0 B'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {snapshot.services.redis.memoryPercent}% of Host RAM
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface)', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPU Load</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)', marginTop: '2px' }}>
                        {snapshot.services.redis.cpuPercent}%
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Redis Daemon
                      </div>
                    </div>
                  </div>

                  {/* Sub details */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                    <span>Connected Clients: <strong style={{ color: 'var(--text-primary)' }}>{snapshot.services.redis.details?.connectedClients ?? '0'}</strong></span>
                    <span>Peak Memory: <strong style={{ color: 'var(--text-primary)' }}>{snapshot.services.redis.details?.usedMemoryPeakFormatted || 'N/A'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Dedicated Services (Postgres & Redis) */}
      {(activeTab as any) === 'services' && snapshot && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {snapshot.services ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* PostgreSQL Detailed Card */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(95, 168, 160, 0.1)', color: 'var(--accent-2)' }}>
                      <Database size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>PostgreSQL Database Engine</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        Host Relational Storage & Prisma Backend
                      </p>
                    </div>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(95, 168, 160, 0.12)',
                      color: 'var(--accent-2)',
                      border: '1px solid var(--accent-2)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {snapshot.services.postgres.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#12161c', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RAM Consumption</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-2)', marginTop: '4px' }}>
                      {snapshot.services.postgres.memoryFormatted}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {snapshot.services.postgres.memoryPercent}% of Total Host RAM
                    </div>
                  </div>

                  <div style={{ background: '#12161c', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPU Consumption</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)', marginTop: '4px' }}>
                      {snapshot.services.postgres.cpuPercent}%
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {snapshot.services.postgres.details?.processCount || 1} Worker Processes
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Database Footprint on Disk:</span>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{snapshot.services.postgres.details?.databaseSizeFormatted || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Active Database Connections:</span>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--accent-2)' }}>{snapshot.services.postgres.details?.activeConnections ?? '1'}</strong>
                  </div>
                </div>
              </div>

              {/* Redis Detailed Card */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(232, 163, 61, 0.1)', color: 'var(--accent)' }}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Redis Cache & Message Broker</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        In-memory Key-Value & Background Worker Queue
                      </p>
                    </div>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: 'rgba(232, 163, 61, 0.12)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {snapshot.services.redis.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#12161c', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RAM Consumption</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-2)', marginTop: '4px' }}>
                      {snapshot.services.redis.memoryFormatted}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {snapshot.services.redis.memoryPercent}% of Total Host RAM
                    </div>
                  </div>

                  <div style={{ background: '#12161c', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CPU Consumption</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)', marginTop: '4px' }}>
                      {snapshot.services.redis.cpuPercent}%
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Single-threaded Event Loop
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Peak Memory Recorded:</span>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{snapshot.services.redis.details?.usedMemoryPeakFormatted || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Connected Client Sockets:</span>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{snapshot.services.redis.details?.connectedClients ?? '0'}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="panel" style={{ textAlign: 'center', padding: '40px' }}>
              <div className="mono" style={{ color: 'var(--text-muted)' }}>Collecting services metrics...</div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Memory & Process Heap Breakdown */}
      {activeTab === 'memory' && snapshot && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Node.js Heap Distribution */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>V8 Runtime Memory Breakdown</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Internal Node.js execution memory structures and heap allocation
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>V8 Heap Used:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent)' }}>
                    {snapshot.memory.process.heapUsedFormatted}
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(snapshot.memory.process.heapUsedBytes / (snapshot.memory.process.heapTotalBytes || 1)) * 100}%`,
                      background: 'var(--accent)',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>V8 Total Heap Allocated:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {snapshot.memory.process.heapTotalFormatted}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Resident Set Size (RSS):</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-2)' }}>
                    {snapshot.memory.process.rssFormatted}
                  </span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>C++ External Bindings:</span>
                  <span style={{ fontFamily: 'monospace' }}>
                    {snapshot.memory.process.externalFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Event Loop & Latency */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Event Loop Health & Latency</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Micro-task scheduling delay and event loop response time
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(95, 168, 160, 0.1)',
                  color: 'var(--accent-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={28} />
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-2)' }}>
                  {snapshot.eventLoopLagMs} ms
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {snapshot.eventLoopLagMs < 5 ? 'Optimal (Near Zero Lag)' : 'Active Async Workload'}
                </div>
              </div>
            </div>

            <div style={{ background: '#12161c', padding: '12px 14px', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Fastify event loop latency measures tick execution delay. Values &lt; 10ms indicate healthy, non-blocking asynchronous I/O execution.
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Hardware & Network Specs */}
      {activeTab === 'host' && snapshot && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Host Server Specs Table */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>Host Environment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Hostname:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{snapshot.host.hostname}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>OS Platform:</span>
                <span>{snapshot.host.platformFormatted} ({snapshot.host.platform})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kernel Release:</span>
                <span style={{ fontFamily: 'monospace' }}>{snapshot.host.release}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>CPU Arch:</span>
                <span style={{ fontFamily: 'monospace' }}>{snapshot.host.arch}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Node.js Version:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{snapshot.host.nodeVersion}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>V8 Engine:</span>
                <span style={{ fontFamily: 'monospace' }}>{snapshot.host.v8Version}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Server Process PID:</span>
                <span style={{ fontFamily: 'monospace' }}>{snapshot.host.pid}</span>
              </div>
            </div>
          </div>

          {/* Network Interfaces Roster */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>Active Network Interfaces</h3>
            {snapshot.network.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {snapshot.network.map((net, i) => (
                  <div
                    key={`${net.name}-${i}`}
                    style={{
                      background: '#12161c',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '10px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{net.name}</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: net.internal ? 'rgba(255,255,255,0.05)' : 'rgba(95,168,160,0.15)',
                          color: net.internal ? 'var(--text-muted)' : 'var(--accent-2)',
                        }}
                      >
                        {net.internal ? 'Internal' : 'External'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      IP: <strong style={{ color: 'var(--text-primary)' }}>{net.ip}</strong> · MAC: {net.mac || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>No network interfaces detected.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
