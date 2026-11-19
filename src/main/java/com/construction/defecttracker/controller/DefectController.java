package com.construction.defecttracker.controller;

import com.construction.defecttracker.domain.entity.User;
import com.construction.defecttracker.domain.enums.DefectStatus;
import com.construction.defecttracker.domain.enums.Urgency;
import com.construction.defecttracker.dto.*;
import com.construction.defecttracker.service.DefectService;
import com.construction.defecttracker.service.UserService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/defects")
public class DefectController {

    private final DefectService defectService;
    private final UserService userService;

    public DefectController(DefectService defectService, UserService userService) {
        this.defectService = defectService;
        this.userService = userService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('WORKER', 'MANAGER')")
    public ResponseEntity<DefectDto> createDefect(
            @RequestParam("entranceNumber") Integer entranceNumber,
            @RequestParam("apartmentNumber") Integer apartmentNumber,
            @RequestParam("description") String description,
            @RequestParam("urgency") Urgency urgency,
            @RequestParam(value = "photos", required = false) List<MultipartFile> photos
    ) {
        User currentUser = userService.getCurrentUser();
        CreateDefectRequest request = new CreateDefectRequest(entranceNumber, apartmentNumber, description, urgency);
        DefectDto created = defectService.createDefect(request, photos, currentUser);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('WORKER', 'MANAGER')")
    public ResponseEntity<List<DefectDto>> getMyDefects() {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(defectService.getDefectsByWorker(currentUser.getId()));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('WORKER', 'MANAGER')")
    public ResponseEntity<List<DefectDto>> searchDefects(
            @RequestParam(required = false) Integer entranceNumber,
            @RequestParam(required = false) Integer apartmentNumber,
            @RequestParam(required = false) Urgency urgency,
            @RequestParam(required = false) DefectStatus status,
            @RequestParam(required = false) Boolean isArchived
    ) {
        return ResponseEntity.ok(defectService.searchDefects(entranceNumber, apartmentNumber, urgency, status, isArchived));
    }

    @GetMapping("/by-date")
    @PreAuthorize("hasAnyRole('WORKER', 'MANAGER')")
    public ResponseEntity<List<DefectDto>> getDefectsByDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(defectService.getDefectsByDate(date));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('WORKER', 'MANAGER')")
    public ResponseEntity<DefectDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request
    ) {
        return ResponseEntity.ok(defectService.updateStatus(id, request.status()));
    }

    @PatchMapping("/{id}/urgency")
    @PreAuthorize("hasAnyRole('WORKER', 'MANAGER')")
    public ResponseEntity<DefectDto> updateUrgency(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUrgencyRequest request
    ) {
        return ResponseEntity.ok(defectService.updateUrgency(id, request.urgency()));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("hasAnyRole('WORKER', 'MANAGER')")
    public ResponseEntity<DefectDto> addComment(
            @PathVariable Long id,
            @Valid @RequestBody AddCommentRequest request
    ) {
        User currentUser = userService.getCurrentUser();
        return ResponseEntity.ok(defectService.addComment(id, request.message(), currentUser));
    }
}
