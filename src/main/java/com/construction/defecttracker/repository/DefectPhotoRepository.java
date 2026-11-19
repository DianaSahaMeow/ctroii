package com.construction.defecttracker.repository;

import com.construction.defecttracker.domain.entity.DefectPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DefectPhotoRepository extends JpaRepository<DefectPhoto, Long> {
    List<DefectPhoto> findByDefectId(Long defectId);
}
