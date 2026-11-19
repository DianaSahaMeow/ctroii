package com.construction.defecttracker.dto;

import java.time.LocalDateTime;

public record DefectPhotoDto(
        Long id,
        String fileName,
        String originalFileName,
        String url,
        Long fileSize,
        LocalDateTime createdAt
) {}
