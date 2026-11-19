package com.construction.defecttracker.dto;

import com.construction.defecttracker.domain.enums.Role;

public record UserDto(
        Long id,
        String username,
        String fullName,
        Role role
) {}
