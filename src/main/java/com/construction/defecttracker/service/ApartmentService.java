package com.construction.defecttracker.service;

import com.construction.defecttracker.domain.entity.Apartment;
import com.construction.defecttracker.domain.entity.Defect;
import com.construction.defecttracker.domain.enums.DefectStatus;
import com.construction.defecttracker.domain.enums.Urgency;
import com.construction.defecttracker.dto.*;
import com.construction.defecttracker.repository.ApartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;

    public ApartmentService(ApartmentRepository apartmentRepository) {
        this.apartmentRepository = apartmentRepository;
    }

    /**
     * Накопительный учет (Плюсование):
     * Если квартира уже есть в базе (включая статус «В архиве»), новая запись не создает дубликат —
     * дефект привязывается к существующей карточке, а квартира (если была в архиве)
     * автоматически возвращается в активный список.
     */
    @Transactional
    public Apartment getOrCreateAndActivate(Integer entranceNumber, Integer apartmentNumber) {
        return apartmentRepository.findByEntranceNumberAndApartmentNumber(entranceNumber, apartmentNumber)
                .map(existing -> {
                    if (Boolean.TRUE.equals(existing.getArchived())) {
                        existing.setArchived(false);
                    }
                    existing.setUpdatedAt(LocalDateTime.now());
                    return apartmentRepository.save(existing);
                })
                .orElseGet(() -> {
                    Apartment newApt = new Apartment(entranceNumber, apartmentNumber);
                    return apartmentRepository.save(newApt);
                });
    }

    @Transactional(readOnly = true)
    public List<ApartmentSummaryDto> getApartmentSummaries(Boolean isArchived) {
        List<Apartment> apartments = apartmentRepository.findByIsArchivedOrderByEntranceNumberAscApartmentNumberAsc(isArchived);
        List<ApartmentSummaryDto> summaries = new ArrayList<>();

        for (Apartment apt : apartments) {
            long total = apt.getDefects().size();
            long open = apt.getDefects().stream()
                    .filter(d -> d.getStatus() != DefectStatus.ACCEPTED)
                    .count();
            long urgent = apt.getDefects().stream()
                    .filter(d -> d.getStatus() != DefectStatus.ACCEPTED && d.getUrgency() == Urgency.URGENT)
                    .count();

            boolean canArchive = (open == 0 && total > 0 && !Boolean.TRUE.equals(apt.getArchived()));

            summaries.add(new ApartmentSummaryDto(
                    apt.getId(),
                    apt.getEntranceNumber(),
                    apt.getApartmentNumber(),
                    apt.getArchived(),
                    total,
                    open,
                    urgent,
                    apt.getUpdatedAt(),
                    canArchive
            ));
        }

        return summaries;
    }

    @Transactional(readOnly = true)
    public ApartmentDetailDto getApartmentDetail(Long id) {
        Apartment apt = apartmentRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("Квартира не найдена с ID: " + id));

        List<DefectDto> activeDefects = new ArrayList<>();
        List<DefectDto> acceptedDefects = new ArrayList<>();

        apt.getDefects().stream()
                .sorted(Comparator.comparing(Defect::getCreatedAt).reversed())
                .forEach(defect -> {
                    DefectDto dto = mapToDefectDto(defect);
                    if (defect.getStatus() == DefectStatus.ACCEPTED) {
                        acceptedDefects.add(dto);
                    } else {
                        activeDefects.add(dto);
                    }
                });

        boolean canArchive = (activeDefects.isEmpty() && !acceptedDefects.isEmpty() && !Boolean.TRUE.equals(apt.getArchived()));

        return new ApartmentDetailDto(
                apt.getId(),
                apt.getEntranceNumber(),
                apt.getApartmentNumber(),
                apt.getArchived(),
                apt.getCreatedAt(),
                apt.getUpdatedAt(),
                activeDefects,
                acceptedDefects,
                canArchive
        );
    }

    @Transactional
    public ApartmentDetailDto archiveApartment(Long id) {
        Apartment apt = apartmentRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new IllegalArgumentException("Квартира не найдена с ID: " + id));

        boolean hasUnaccepted = apt.getDefects().stream()
                .anyMatch(d -> d.getStatus() != DefectStatus.ACCEPTED);

        if (hasUnaccepted) {
            throw new IllegalStateException("Нельзя отправить квартиру в архив: имеются непринятые дефекты");
        }

        if (apt.getDefects().isEmpty()) {
            throw new IllegalStateException("Нельзя отправить в архив квартиру без дефектов");
        }

        apt.setArchived(true);
        apt.setUpdatedAt(LocalDateTime.now());
        apartmentRepository.save(apt);

        return getApartmentDetail(id);
    }

    @Transactional(readOnly = true)
    public List<Integer> getAvailableEntrances() {
        return apartmentRepository.findAllDistinctEntrances();
    }

    public static DefectDto mapToDefectDto(Defect d) {
        List<DefectPhotoDto> photoDtos = d.getPhotos().stream()
                .map(p -> new DefectPhotoDto(
                        p.getId(),
                        p.getFileName(),
                        p.getOriginalFileName(),
                        "/api/files/" + p.getFileName(),
                        p.getFileSize(),
                        p.getCreatedAt()
                ))
                .toList();

        List<DefectCommentDto> commentDtos = d.getComments().stream()
                .map(c -> new DefectCommentDto(
                        c.getId(),
                        d.getId(),
                        c.getAuthor() != null ? c.getAuthor().getFullName() : "Не указан",
                        c.getAuthor() != null ? c.getAuthor().getRole() : null,
                        c.getMessage(),
                        c.getCreatedAt()
                ))
                .toList();

        return new DefectDto(
                d.getId(),
                d.getApartment().getId(),
                d.getApartment().getEntranceNumber(),
                d.getApartment().getApartmentNumber(),
                d.getWorker() != null ? d.getWorker().getId() : null,
                d.getWorker() != null ? d.getWorker().getFullName() : "Не указан",
                d.getDescription(),
                d.getUrgency(),
                d.getUrgency().getDisplayName(),
                d.getStatus(),
                d.getStatus().getDisplayName(),
                d.getCreatedAt(),
                d.getUpdatedAt(),
                d.getClosedAt(),
                photoDtos,
                commentDtos
        );
    }
}
