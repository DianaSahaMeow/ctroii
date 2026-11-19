package com.construction.defecttracker.service;

import com.construction.defecttracker.domain.entity.Apartment;
import com.construction.defecttracker.domain.entity.Defect;
import com.construction.defecttracker.domain.enums.DefectStatus;
import com.construction.defecttracker.domain.enums.Urgency;
import com.construction.defecttracker.dto.ApartmentDetailDto;
import com.construction.defecttracker.repository.ApartmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApartmentServiceTest {

    @Mock
    private ApartmentRepository apartmentRepository;

    @InjectMocks
    private ApartmentService apartmentService;

    private Apartment activeApartment;
    private Apartment archivedApartment;

    @BeforeEach
    void setUp() {
        activeApartment = new Apartment(1, 10);
        activeApartment.setId(1L);
        activeApartment.setArchived(false);

        archivedApartment = new Apartment(2, 20);
        archivedApartment.setId(2L);
        archivedApartment.setArchived(true);
    }

    @Test
    @DisplayName("Накопительный учет: Создание новой квартиры если еще нет в базе")
    void testCreateNewApartmentWhenNotExists() {
        when(apartmentRepository.findByEntranceNumberAndApartmentNumber(1, 15))
                .thenReturn(Optional.empty());
        when(apartmentRepository.save(any(Apartment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Apartment result = apartmentService.getOrCreateAndActivate(1, 15);

        assertNotNull(result);
        assertEquals(1, result.getEntranceNumber());
        assertEquals(15, result.getApartmentNumber());
        assertFalse(result.getArchived());
        verify(apartmentRepository, times(1)).save(any(Apartment.class));
    }

    @Test
    @DisplayName("Накопительный учет: Возврат существующей активной квартиры без дублирования")
    void testReturnExistingActiveApartment() {
        when(apartmentRepository.findByEntranceNumberAndApartmentNumber(1, 10))
                .thenReturn(Optional.of(activeApartment));
        when(apartmentRepository.save(any(Apartment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Apartment result = apartmentService.getOrCreateAndActivate(1, 10);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertFalse(result.getArchived());
    }

    @Test
    @DisplayName("Накопительный учет (Плюсование): Автоматическая разархивация архивной квартиры при добавлении дефекта")
    void testAutoUnarchiveWhenAddingDefectToArchivedApartment() {
        when(apartmentRepository.findByEntranceNumberAndApartmentNumber(2, 20))
                .thenReturn(Optional.of(archivedApartment));
        when(apartmentRepository.save(any(Apartment.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        assertTrue(archivedApartment.getArchived());

        Apartment result = apartmentService.getOrCreateAndActivate(2, 20);

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertFalse(result.getArchived(), "Квартира должна быть разархивирована!");
        verify(apartmentRepository).save(archivedApartment);
    }

    @Test
    @DisplayName("Архивация: Успешный перевод в архив когда все дефекты приняты")
    void testArchiveSuccessWhenAllAccepted() {
        Defect acceptedDefect = new Defect(activeApartment, null, "Исправлено", Urgency.LOW);
        acceptedDefect.setStatus(DefectStatus.ACCEPTED);
        activeApartment.getDefects().add(acceptedDefect);

        when(apartmentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(activeApartment));
        when(apartmentRepository.save(any(Apartment.class))).thenAnswer(inv -> inv.getArgument(0));

        ApartmentDetailDto result = apartmentService.archiveApartment(1L);

        assertNotNull(result);
        assertTrue(activeApartment.getArchived());
    }

    @Test
    @DisplayName("Архивация: Ошибка если есть непринятые дефекты")
    void testArchiveThrowsWhenDefectsNotAccepted() {
        Defect openDefect = new Defect(activeApartment, null, "Не принято", Urgency.URGENT);
        openDefect.setStatus(DefectStatus.NEW);
        activeApartment.getDefects().add(openDefect);

        when(apartmentRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(activeApartment));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            apartmentService.archiveApartment(1L);
        });

        assertTrue(ex.getMessage().contains("имеются непринятые дефекты"));
        assertFalse(activeApartment.getArchived());
    }
}
