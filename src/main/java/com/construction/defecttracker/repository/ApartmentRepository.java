package com.construction.defecttracker.repository;

import com.construction.defecttracker.domain.entity.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Long> {

    Optional<Apartment> findByEntranceNumberAndApartmentNumber(Integer entranceNumber, Integer apartmentNumber);

    List<Apartment> findByIsArchivedOrderByEntranceNumberAscApartmentNumberAsc(Boolean isArchived);

    @Query("SELECT DISTINCT a FROM Apartment a LEFT JOIN FETCH a.defects d LEFT JOIN FETCH d.worker WHERE a.id = :id")
    Optional<Apartment> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT COUNT(a) FROM Apartment a WHERE a.isArchived = false")
    long countActiveApartments();

    @Query("SELECT DISTINCT a.entranceNumber FROM Apartment a ORDER BY a.entranceNumber ASC")
    List<Integer> findAllDistinctEntrances();
}
