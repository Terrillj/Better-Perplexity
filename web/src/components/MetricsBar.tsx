interface MetricsBarProps {
  timeMs?: number;
  sourceCount?: number;
}

export function MetricsBar({ timeMs, sourceCount }: MetricsBarProps) {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-500 py-2 px-4 bg-gray-50 rounded border border-gray-200">
      {timeMs !== undefined && (
        <div className="flex items-center gap-1">
          <span className="font-semibold">Time:</span>
          <span>{(timeMs / 1000).toFixed(2)}s</span>
        </div>
      )}
      {sourceCount !== undefined && (
        <div className="flex items-center gap-1">
          <span className="font-semibold">Sources:</span>
          <span>{sourceCount}</span>
        </div>
      )}
    </div>
  );
}

