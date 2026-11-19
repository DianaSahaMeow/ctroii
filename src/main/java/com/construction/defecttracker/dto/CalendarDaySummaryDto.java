package com.construction.defecttracker.dto;

import java.time.LocalDate;

public record CalendarDaySummaryDto(
        LocalDate date,
        long count
) {}
