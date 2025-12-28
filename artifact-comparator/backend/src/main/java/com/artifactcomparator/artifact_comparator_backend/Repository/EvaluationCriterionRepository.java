package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.EvaluationCriterion;
import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EvaluationCriterionRepository extends JpaRepository<EvaluationCriterion, Long> {

    List<EvaluationCriterion> findByStudyOrderByPriorityOrderAsc(Study study);


    @Query("select c.id from EvaluationCriterion c where c.study = :study")
    List<Long> findIdsByStudy(@Param("study") Study study);


    @Modifying
    @Query("""
    DELETE FROM EvaluationCriterion c
    WHERE c.study = :study
""")
    void deleteByStudy(@Param("study") Study study);

}
