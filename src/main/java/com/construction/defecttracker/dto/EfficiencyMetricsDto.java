package com.construction.defecttracker.dto;

import java.util.List;

public record EfficiencyMetricsDto(
        double overallKpiPercent,
        double urgentKpiPercent,
        double avgResolutionHours,
        double avgResolutionDays,
        long totalCreated,
        long totalAccepted,
        long totalInWork,
        long weeklyOpened,
        long weeklyClosed,
        long monthlyOpened,
        long monthlyClosed,
        String velocityStatus,
        List<WorkerStatsDto> workerStats
) {}
