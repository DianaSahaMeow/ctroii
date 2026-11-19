package com.construction.defecttracker.dto;

import com.construction.defecttracker.domain.enums.Urgency;
import jakarta.validation.constraints.NotNull;

public record UpdateUrgencyRequest(
        @NotNull(message = "Срочность обязательна")
        Urgency urgency
) {}
