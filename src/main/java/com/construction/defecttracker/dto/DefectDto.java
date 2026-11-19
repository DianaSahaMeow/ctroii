package com.construction.defecttracker.dto;

import com.construction.defecttracker.domain.enums.DefectStatus;
import com.construction.defecttracker.domain.enums.Urgency;
import java.time.LocalDateTime;
import java.util.List;

public record DefectDto(
        Long id,
        Long apartmentId,
        Integer entranceNumber,
        Integer apartmentNumber,
        Long workerId,
        String workerName,
        String description,
        Urgency urgency,
        String urgencyDisplayName,
        DefectStatus status,
        String statusDisplayName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime closedAt,
        List<DefectPhotoDto> photos,
        List<DefectCommentDto> comments
) {}
