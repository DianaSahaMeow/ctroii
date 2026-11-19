package com.construction.defecttracker.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ApartmentDetailDto(
        Long id,
        Integer entranceNumber,
        Integer apartmentNumber,
        Boolean isArchived,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<DefectDto> activeDefects,
        List<DefectDto> acceptedDefects,
        boolean canArchive
) {}
