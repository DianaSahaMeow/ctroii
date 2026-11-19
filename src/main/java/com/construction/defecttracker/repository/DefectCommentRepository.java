package com.construction.defecttracker.repository;

import com.construction.defecttracker.domain.entity.DefectComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DefectCommentRepository extends JpaRepository<DefectComment, Long> {
    List<DefectComment> findByDefectIdOrderByCreatedAtAsc(Long defectId);
}
