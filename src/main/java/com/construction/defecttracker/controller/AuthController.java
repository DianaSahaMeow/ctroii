package com.construction.defecttracker.controller;

import com.construction.defecttracker.dto.UserDto;
import com.construction.defecttracker.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        try {
            return ResponseEntity.ok(userService.getCurrentUserDto());
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }
}
