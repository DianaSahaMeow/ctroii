package com.construction.defecttracker.service;

import com.construction.defecttracker.domain.entity.Defect;
import com.construction.defecttracker.domain.entity.User;
import com.construction.defecttracker.domain.enums.DefectStatus;
import com.construction.defecttracker.domain.enums.Role;
import com.construction.defecttracker.domain.enums.Urgency;
import com.construction.defecttracker.dto.*;
import com.construction.defecttracker.repository.ApartmentRepository;
import com.construction.defecttracker.repository.DefectRepository;
import com.construction.defecttracker.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ApartmentRepository apartmentRepository;
    private final DefectRepository defectRepository;
    private final UserRepository userRepository;

    public DashboardService(
            ApartmentRepository apartmentRepository,
            DefectRepository defectRepository,
            UserRepository userRepository
    ) {
        this.apartmentRepository = apartmentRepository;
        this.defectRepository = defectRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsDto getMetrics() {
        long apartmentsInWork = apartmentRepository.countActiveApartments();
        long totalOpenDefects = defectRepository.countByStatusNot(DefectStatus.ACCEPTED);
        long urgentOpenDefects = defectRepository.countByStatusNotAndUrgency(DefectStatus.ACCEPTED, Urgency.URGENT);
        long closedThisWeek = defectRepository.countByStatusAndUpdatedAtAfter(
                DefectStatus.ACCEPTED,
                LocalDateTime.now().minusDays(7)
        );
        long closedThisMonth = defectRepository.countByStatusAndUpdatedAtAfter(
                DefectStatus.ACCEPTED,
                LocalDateTime.now().minusDays(30)
        );

        return new DashboardMetricsDto(
                apartmentsInWork,
                totalOpenDefects,
                urgentOpenDefects,
                closedThisWeek,
                closedThisMonth
        );
    }

    /**
     * Расчет КПД и показателей строительной эффективности
     */
    @Transactional(readOnly = true)
    public EfficiencyMetricsDto getEfficiencyMetrics() {
        List<Defect> allDefects = defectRepository.findAll();
        long totalCreated = allDefects.size();

        long totalAccepted = allDefects.stream()
                .filter(d -> d.getStatus() == DefectStatus.ACCEPTED)
                .count();

        long totalInWork = totalCreated - totalAccepted;

        double overallKpi = totalCreated > 0
                ? Math.round(((double) totalAccepted / totalCreated) * 1000.0) / 10.0
                : 100.0;

        long totalUrgent = allDefects.stream()
                .filter(d -> d.getUrgency() == Urgency.URGENT)
                .count();

        long acceptedUrgent = allDefects.stream()
                .filter(d -> d.getUrgency() == Urgency.URGENT && d.getStatus() == DefectStatus.ACCEPTED)
                .count();

        double urgentKpi = totalUrgent > 0
                ? Math.round(((double) acceptedUrgent / totalUrgent) * 1000.0) / 10.0
                : 100.0;

        // Расчет среднего времени устранения (MTTR) для закрытых дефектов
        List<Duration> resolutionDurations = allDefects.stream()
                .filter(d -> d.getStatus() == DefectStatus.ACCEPTED && d.getCreatedAt() != null)
                .map(d -> {
                    LocalDateTime closeTime = d.getClosedAt() != null ? d.getClosedAt() : d.getUpdatedAt();
                    if (closeTime.isBefore(d.getCreatedAt())) {
                        closeTime = d.getCreatedAt();
                    }
                    return Duration.between(d.getCreatedAt(), closeTime);
                })
                .toList();

        double avgResolutionHours = 0.0;
        double avgResolutionDays = 0.0;
        if (!resolutionDurations.isEmpty()) {
            double totalHours = resolutionDurations.stream().mapToDouble(d -> Math.max(1.0, d.toHours())).sum();
            avgResolutionHours = Math.round((totalHours / resolutionDurations.size()) * 10.0) / 10.0;
            avgResolutionDays = Math.round((avgResolutionHours / 24.0) * 10.0) / 10.0;
        }

        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        LocalDateTime monthAgo = LocalDateTime.now().minusDays(30);

        long weeklyOpened = allDefects.stream().filter(d -> d.getCreatedAt().isAfter(weekAgo)).count();
        long weeklyClosed = allDefects.stream().filter(d -> d.getStatus() == DefectStatus.ACCEPTED && (d.getClosedAt() != null ? d.getClosedAt() : d.getUpdatedAt()).isAfter(weekAgo)).count();

        long monthlyOpened = allDefects.stream().filter(d -> d.getCreatedAt().isAfter(monthAgo)).count();
        long monthlyClosed = allDefects.stream().filter(d -> d.getStatus() == DefectStatus.ACCEPTED && (d.getClosedAt() != null ? d.getClosedAt() : d.getUpdatedAt()).isAfter(monthAgo)).count();

        String velocityStatus;
        if (weeklyClosed > weeklyOpened) {
            velocityStatus = "ПОЛОЖИТЕЛЬНЫЙ (устраняется быстрее, чем заводится: +" + (weeklyClosed - weeklyOpened) + " за нед.)";
        } else if (weeklyClosed < weeklyOpened) {
            velocityStatus = "ОТСТАВАНИЕ (накопление дефектов: заведено на " + (weeklyOpened - weeklyClosed) + " больше, чем закрыто)";
        } else {
            velocityStatus = "СТАБИЛЬНЫЙ (паритет поступления и закрытия)";
        }

        // Статистика по приемщикам
        List<User> workers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.WORKER)
                .toList();

        List<WorkerStatsDto> workerStats = new ArrayList<>();
        for (User w : workers) {
            long reported = allDefects.stream().filter(d -> d.getWorker() != null && d.getWorker().getId().equals(w.getId())).count();
            long urgent = allDefects.stream().filter(d -> d.getWorker() != null && d.getWorker().getId().equals(w.getId()) && d.getUrgency() == Urgency.URGENT).count();
            long resolved = allDefects.stream().filter(d -> d.getWorker() != null && d.getWorker().getId().equals(w.getId()) && d.getStatus() == DefectStatus.ACCEPTED).count();
            workerStats.add(new WorkerStatsDto(w.getId(), w.getFullName(), reported, urgent, resolved));
        }

        return new EfficiencyMetricsDto(
                overallKpi,
                urgentKpi,
                avgResolutionHours,
                avgResolutionDays,
                totalCreated,
                totalAccepted,
                totalInWork,
                weeklyOpened,
                weeklyClosed,
                monthlyOpened,
                monthlyClosed,
                velocityStatus,
                workerStats
        );
    }

    @Transactional(readOnly = true)
    public List<CalendarDaySummaryDto> getCalendarDays(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = yearMonth.atEndOfMonth().plusDays(1).atStartOfDay();

        List<Defect> defects = defectRepository.findDefectsByDateRange(startOfMonth, endOfMonth);

        Map<LocalDate, Long> countsByDate = defects.stream()
                .collect(Collectors.groupingBy(
                        d -> d.getCreatedAt().toLocalDate(),
                        Collectors.counting()
                ));

        List<CalendarDaySummaryDto> result = new ArrayList<>();
        int daysInMonth = yearMonth.lengthOfMonth();
        for (int day = 1; day <= daysInMonth; day++) {
            LocalDate date = yearMonth.atDay(day);
            long count = countsByDate.getOrDefault(date, 0L);
            result.add(new CalendarDaySummaryDto(date, count));
        }

        return result;
    }
}
