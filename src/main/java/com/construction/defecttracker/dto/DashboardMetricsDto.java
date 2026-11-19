package com.construction.defecttracker.dto;

public record DashboardMetricsDto(
        long apartmentsInWork,
        long totalOpenDefects,
        long urgentOpenDefects,
        long closedThisWeek,
        long closedThisMonth
) {}
