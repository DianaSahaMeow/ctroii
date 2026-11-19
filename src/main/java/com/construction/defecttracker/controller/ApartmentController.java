package com.construction.defecttracker.controller;

import com.construction.defecttracker.dto.ApartmentDetailDto;
import com.construction.defecttracker.dto.ApartmentSummaryDto;
import com.construction.defecttracker.service.ApartmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/apartments")
public class ApartmentController {

    private final ApartmentService apartmentService;

    public ApartmentController(ApartmentService apartmentService) {
        this.apartmentService = apartmentService;
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<ApartmentSummaryDto>> getApartments(
            @RequestParam(name = "archived", defaultValue = "false") Boolean archived
    ) {
        return ResponseEntity.ok(apartmentService.getApartmentSummaries(archived));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApartmentDetailDto> getApartmentDetail(@PathVariable Long id) {
        return ResponseEntity.ok(apartmentService.getApartmentDetail(id));
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApartmentDetailDto> archiveApartment(@PathVariable Long id) {
        return ResponseEntity.ok(apartmentService.archiveApartment(id));
    }

    @GetMapping("/entrances")
    public ResponseEntity<List<Integer>> getEntrances() {
        return ResponseEntity.ok(apartmentService.getAvailableEntrances());
    }
}
