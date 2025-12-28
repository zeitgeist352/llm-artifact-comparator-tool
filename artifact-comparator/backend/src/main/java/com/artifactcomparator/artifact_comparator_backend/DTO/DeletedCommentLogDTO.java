package com.artifactcomparator.artifact_comparator_backend.DTO;

import com.artifactcomparator.artifact_comparator_backend.Entity.DeletedCommentLog;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeletedCommentLogDTO {
    private Long id;
    private Long ownerId;
    private String ownerUsername;
    private Long deletedById;
    private String deletedByUsername;
    private String originalContent;
    private String deleteReason;
    private LocalDateTime deletedAt;
    private Long originalCommentId;
    private Long parentCommentId;

    public static DeletedCommentLogDTO from(DeletedCommentLog log) {
        return DeletedCommentLogDTO.builder()
                .id(log.getId())
                .ownerId(log.getOwner().getId())
                .ownerUsername(log.getOwner().getUsername())
                .deletedById(log.getDeletedBy().getId())
                .deletedByUsername(log.getDeletedBy().getUsername())
                .originalContent(log.getOriginalContent())
                .originalCommentId(log.getOriginalCommentId())
                .parentCommentId(log.getParentCommentId())   // 🔥 ARTIK DOĞRUDAN LOG’DAN
                .deleteReason(log.getDeleteReason())
                .deletedAt(log.getDeletedAt())
                .build();
    }
}

