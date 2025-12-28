package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.Entity.MultipleChoiceCriterion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface McOptionRepository
        extends JpaRepository<MultipleChoiceCriterion, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(
            value = """
            DELETE FROM mc_options
            WHERE criterion_id IN (:ids)
        """,
            nativeQuery = true
    )
    void deleteOptionsByCriterionIds(@Param("ids") List<Long> ids);
}
