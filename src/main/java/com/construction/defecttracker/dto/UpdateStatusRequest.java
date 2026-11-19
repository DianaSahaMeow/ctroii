package com.construction.defecttracker.dto;

import com.construction.defecttracker.domain.enums.DefectStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull(message = "Статус обязателен")
        DefectStatus status
) {}
