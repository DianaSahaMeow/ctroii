package com.construction.defecttracker.service;

import com.construction.defecttracker.domain.entity.Apartment;
import com.construction.defecttracker.domain.entity.Defect;
import com.construction.defecttracker.domain.entity.DefectPhoto;
import com.construction.defecttracker.domain.entity.User;
import com.construction.defecttracker.domain.enums.DefectStatus;
import com.construction.defecttracker.domain.enums.Urgency;
import com.construction.defecttracker.dto.CreateDefectRequest;
import com.construction.defecttracker.dto.DefectDto;
import com.construction.defecttracker.repository.DefectCommentRepository;
import com.construction.defecttracker.repository.DefectPhotoRepository;
import com.construction.defecttracker.repository.DefectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DefectService {

    private static final Logger log = LoggerFactory.getLogger(DefectService.class);

    private final DefectRepository defectRepository;
    private final DefectPhotoRepository photoRepository;
    private final DefectCommentRepository commentRepository;
    private final ApartmentService apartmentService;
    private final StorageService storageService;

    public DefectService(
            DefectRepository defectRepository,
            DefectPhotoRepository photoRepository,
            DefectCommentRepository commentRepository,
            ApartmentService apartmentService,
            StorageService storageService
    ) {
        this.defectRepository = defectRepository;
        this.photoRepository = photoRepository;
        this.commentRepository = commentRepository;
        this.apartmentService = apartmentService;
        this.storageService = storageService;
    }

    /**
     * Создание нового дефекта.
     * Применяется логика накопительного учета по квартире.
     */
    @Transactional
    public DefectDto createDefect(CreateDefectRequest request, List<MultipartFile> files, User worker) {
        if (request.urgency() == null) {
            throw new IllegalArgumentException("Рабочий обязан указать уровень срочности");
        }

        // Получаем существующую квартиру или создаем новую. Если квартира в архиве — разархивируем
        Apartment apartment = apartmentService.getOrCreateAndActivate(
                request.entranceNumber(),
                request.apartmentNumber()
        );

        Defect defect = new Defect(
                apartment,
                worker,
                request.description(),
                request.urgency()
        );

        Defect savedDefect = defectRepository.save(defect);

        // Обработка загруженных фотографий
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    try {
                        String storedFileName = storageService.storeFile(file);
                        DefectPhoto photo = new DefectPhoto(
                                storedFileName,
                                file.getOriginalFilename(),
                                storedFileName,
                                file.getContentType() != null ? file.getContentType() : "image/jpeg",
                                file.getSize()
                        );
                        savedDefect.addPhoto(photo);
                        photoRepository.save(photo);
                    } catch (Exception e) {
                        log.error("Ошибка сохранения фото дефекта: {}", e.getMessage(), e);
                    }
                }
            }
        }

        return ApartmentService.mapToDefectDto(savedDefect);
    }

    @Transactional
    public DefectDto addComment(Long defectId, String message, User author) {
        Defect defect = defectRepository.findById(defectId)
                .orElseThrow(() -> new IllegalArgumentException("Замечание не найдено с ID: " + defectId));

        com.construction.defecttracker.domain.entity.DefectComment comment =
                new com.construction.defecttracker.domain.entity.DefectComment(defect, author, message);

        defect.addComment(comment);
        defect.setUpdatedAt(LocalDateTime.now());
        commentRepository.save(comment);

        Defect updated = defectRepository.save(defect);
        return ApartmentService.mapToDefectDto(updated);
    }

    @Transactional
    public DefectDto updateStatus(Long defectId, DefectStatus newStatus) {
        Defect defect = defectRepository.findById(defectId)
                .orElseThrow(() -> new IllegalArgumentException("Замечание не найдено с ID: " + defectId));

        defect.setStatus(newStatus);
        if (newStatus == DefectStatus.ACCEPTED) {
            if (defect.getClosedAt() == null) {
                defect.setClosedAt(LocalDateTime.now());
            }
        } else {
            defect.setClosedAt(null);
        }
        defect.setUpdatedAt(LocalDateTime.now());
        defect.getApartment().setUpdatedAt(LocalDateTime.now());

        Defect updated = defectRepository.save(defect);
        return ApartmentService.mapToDefectDto(updated);
    }

    @Transactional
    public DefectDto updateUrgency(Long defectId, Urgency newUrgency) {
        Defect defect = defectRepository.findById(defectId)
                .orElseThrow(() -> new IllegalArgumentException("Замечание не найдено с ID: " + defectId));

        defect.setUrgency(newUrgency);
        defect.setUpdatedAt(LocalDateTime.now());
        defect.getApartment().setUpdatedAt(LocalDateTime.now());

        Defect updated = defectRepository.save(defect);
        return ApartmentService.mapToDefectDto(updated);
    }

    @Transactional(readOnly = true)
    public List<DefectDto> getDefectsByWorker(Long workerId) {
        return defectRepository.findByWorkerIdWithDetails(workerId).stream()
                .map(ApartmentService::mapToDefectDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DefectDto> searchDefects(
            Integer entranceNumber,
            Integer apartmentNumber,
            Urgency urgency,
            DefectStatus status,
            Boolean isArchived
    ) {
        return defectRepository.searchDefects(entranceNumber, apartmentNumber, urgency, status, isArchived).stream()
                .map(ApartmentService::mapToDefectDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DefectDto> getDefectsByDate(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        return defectRepository.findDefectsByDateRange(start, end).stream()
                .map(ApartmentService::mapToDefectDto)
                .toList();
    }
}
