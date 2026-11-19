package com.construction.defecttracker.dto;

public record WorkerStatsDto(
        Long workerId,
        String workerName,
        long totalReported,
        long urgentReported,
        long resolved
) {}
