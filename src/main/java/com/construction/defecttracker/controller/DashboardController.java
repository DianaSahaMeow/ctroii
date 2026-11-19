package com.construction.defecttracker.controller;

import com.construction.defecttracker.dto.CalendarDaySummaryDto;
import com.construction.defecttracker.dto.DashboardMetricsDto;
import com.construction.defecttracker.dto.EfficiencyMetricsDto;
import com.construction.defecttracker.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@PreAuthorize("hasRole('MANAGER')")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsDto> getMetrics() {
        return ResponseEntity.ok(dashboardService.getMetrics());
    }

    @GetMapping("/efficiency")
    public ResponseEntity<EfficiencyMetricsDto> getEfficiency() {
        return ResponseEntity.ok(dashboardService.getEfficiencyMetrics());
    }

    @GetMapping("/calendar")
    public ResponseEntity<List<CalendarDaySummaryDto>> getCalendar(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        LocalDate now = LocalDate.now();
        int queryYear = (year != null) ? year : now.getYear();
        int queryMonth = (month != null) ? month : now.getMonthValue();
        return ResponseEntity.ok(dashboardService.getCalendarDays(queryYear, queryMonth));
    }
}
