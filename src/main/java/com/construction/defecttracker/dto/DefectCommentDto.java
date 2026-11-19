package com.construction.defecttracker.dto;

import com.construction.defecttracker.domain.enums.Role;
import java.time.LocalDateTime;

public record DefectCommentDto(
        Long id,
        Long defectId,
        String authorName,
        Role authorRole,
        String message,
        LocalDateTime createdAt
) {}
