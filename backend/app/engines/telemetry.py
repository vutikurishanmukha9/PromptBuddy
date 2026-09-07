"""Telemetry & In-Memory Metrics Collector."""

from __future__ import annotations

import threading
import time
from collections import defaultdict
from typing import Any


class TelemetryCollector:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._total_requests = 0
        self._successful_requests = 0
        self._failed_requests = 0
        self._latencies: list[int] = []
        self._framework_counts: dict[str, int] = defaultdict(int)
        self._started_at = time.time()

    def record_request(self, framework: str, latency_ms: int, success: bool = True) -> None:
        with self._lock:
            self._total_requests += 1
            if success:
                self._successful_requests += 1
            else:
                self._failed_requests += 1
            self._latencies.append(latency_ms)
            if len(self._latencies) > 1000:
                self._latencies = self._latencies[-1000:]
            self._framework_counts[framework] += 1

    def get_stats(self) -> dict[str, Any]:
        with self._lock:
            avg_latency = (
                sum(self._latencies) / len(self._latencies)
                if self._latencies
                else 0
            )
            p95_latency = (
                sorted(self._latencies)[int(len(self._latencies) * 0.95)]
                if self._latencies
                else 0
            )
            uptime_seconds = int(time.time() - self._started_at)

            return {
                "uptime_seconds": uptime_seconds,
                "total_requests": self._total_requests,
                "successful_requests": self._successful_requests,
                "failed_requests": self._failed_requests,
                "avg_latency_ms": round(avg_latency, 2),
                "p95_latency_ms": p95_latency,
                "framework_distribution": dict(self._framework_counts),
            }


telemetry = TelemetryCollector()
