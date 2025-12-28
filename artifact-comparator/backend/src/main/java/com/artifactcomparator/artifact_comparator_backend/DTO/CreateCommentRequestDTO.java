package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Data;

@Data
public class CreateCommentRequestDTO {
    private Long taskId;
    private String fieldCode;
    private String content;
    private Long parentCommentId;  // null = root comment
}