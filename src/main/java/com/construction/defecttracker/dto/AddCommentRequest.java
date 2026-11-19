package com.construction.defecttracker.dto;

import jakarta.validation.constraints.NotBlank;

public record AddCommentRequest(
        @NotBlank(message = "Текст комментария не может быть пустым")
        String message
) {}
