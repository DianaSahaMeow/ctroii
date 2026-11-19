package com.construction.defecttracker.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Укажите логин")
        String username,

        @NotBlank(message = "Укажите пароль")
        String password
) {}
