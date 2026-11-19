package com.construction.defecttracker.repository;

import com.construction.defecttracker.domain.entity.Defect;
import com.construction.defecttracker.domain.enums.DefectStatus;
import com.construction.defecttracker.domain.enums.Urgency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DefectRepository extends JpaRepository<Defect, Long> {

    @Query("SELECT d FROM Defect d LEFT JOIN FETCH d.photos LEFT JOIN FETCH d.apartment WHERE d.worker.id = :workerId ORDER BY d.createdAt DESC")
    List<Defect> findByWorkerIdWithDetails(@Param("workerId") Long workerId);

    @Query("SELECT d FROM Defect d LEFT JOIN FETCH d.photos LEFT JOIN FETCH d.worker WHERE d.apartment.id = :apartmentId ORDER BY d.createdAt DESC")
    List<Defect> findByApartmentIdWithDetails(@Param("apartmentId") Long apartmentId);

    long countByStatusNot(DefectStatus status);

    long countByStatusNotAndUrgency(DefectStatus status, Urgency urgency);

    @Query("SELECT COUNT(d) FROM Defect d WHERE d.status = :status AND d.updatedAt >= :since")
    long countByStatusAndUpdatedAtAfter(@Param("status") DefectStatus status, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(d) FROM Defect d WHERE d.apartment.id = :apartmentId AND d.status <> 'ACCEPTED'")
    long countUnacceptedByApartmentId(@Param("apartmentId") Long apartmentId);

    @Query("SELECT d FROM Defect d LEFT JOIN FETCH d.photos LEFT JOIN FETCH d.worker LEFT JOIN FETCH d.apartment " +
           "WHERE (:entranceNumber IS NULL OR d.apartment.entranceNumber = :entranceNumber) " +
           "AND (:apartmentNumber IS NULL OR d.apartment.apartmentNumber = :apartmentNumber) " +
           "AND (:urgency IS NULL OR d.urgency = :urgency) " +
           "AND (:status IS NULL OR d.status = :status) " +
           "AND (:isArchived IS NULL OR d.apartment.isArchived = :isArchived) " +
           "ORDER BY d.createdAt DESC")
    List<Defect> searchDefects(
            @Param("entranceNumber") Integer entranceNumber,
            @Param("apartmentNumber") Integer apartmentNumber,
            @Param("urgency") Urgency urgency,
            @Param("status") DefectStatus status,
            @Param("isArchived") Boolean isArchived
    );

    @Query("SELECT d FROM Defect d LEFT JOIN FETCH d.photos LEFT JOIN FETCH d.worker LEFT JOIN FETCH d.apartment " +
           "WHERE d.createdAt >= :startOfDay AND d.createdAt < :endOfDay ORDER BY d.createdAt DESC")
    List<Defect> findDefectsByDateRange(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);
}
