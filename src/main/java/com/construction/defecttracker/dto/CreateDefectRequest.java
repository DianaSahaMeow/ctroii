package com.construction.defecttracker.dto;

import com.construction.defecttracker.domain.enums.Urgency;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateDefectRequest(
        @NotNull(message = "Номер подъезда обязателен")
        @Min(value = 1, message = "Номер подъезда должен быть больше 0")
        Integer entranceNumber,

        @NotNull(message = "Номер квартиры обязателен")
        @Min(value = 1, message = "Номер квартиры должен быть больше 0")
        Integer apartmentNumber,

        @NotBlank(message = "Укажите суть замечания / что исправить")
        String description,

        @NotNull(message = "Укажите уровень срочности")
        Urgency urgency
) {}
