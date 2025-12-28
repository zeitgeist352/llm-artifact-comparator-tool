package com.artifactcomparator.artifact_comparator_backend.Entity;

import com.artifactcomparator.artifact_comparator_backend.Entity.Base.BaseEvaluation;
import com.artifactcomparator.artifact_comparator_backend.Enums.UIChangeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "snapshot_evaluations")
@Getter
@Setter
public class SnapShotEvaluation extends BaseEvaluation {

    private boolean colorChange;
    private boolean shapeChange;
    private boolean positionChange;
    private boolean layoutChange;
    private boolean visibilityChange;
    private boolean fontChange;
    private boolean contentChange;
    private boolean sizeChange;

    private boolean unknownChange;
}
