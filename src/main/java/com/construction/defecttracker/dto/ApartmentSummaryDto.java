package com.construction.defecttracker.dto;

import java.time.LocalDateTime;

public record ApartmentSummaryDto(
        Long id,
        Integer entranceNumber,
        Integer apartmentNumber,
        Boolean isArchived,
        long totalDefects,
        long openDefects,
        long urgentDefects,
        LocalDateTime lastUpdated,
        boolean canArchive
) {}
