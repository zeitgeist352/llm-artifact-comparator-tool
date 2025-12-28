package com.artifactcomparator.artifact_comparator_backend.DTO;

import com.artifactcomparator.artifact_comparator_backend.Entity.Comment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CommentResponseDTO {

    private Long id;

    private Long userId;
    private String username;

    private Long taskId;
    private String fieldCode;

    private boolean userLiked;

    private String content;
    private LocalDateTime createdAt;

    private boolean isPinned;

    private int likeCount;
    private int replyCount;

    private Long parentCommentId;
    private boolean deleted;

    private List<CommentResponseDTO> replies;

    // -----------------------------------------------------------
    // DEFAULT MAPPER (recursive replies dahil)
    // -----------------------------------------------------------
    public static CommentResponseDTO from(Comment c) {
        return CommentResponseDTO.builder()
                .id(c.getId())
                .userId(c.getUser().getId())
                .username(c.getUser().getUsername())
                .taskId(c.getTask().getId())
                .fieldCode(c.getFieldCode())
                .content(c.isDeleted() ? "[deleted]" : c.getContent())
                .createdAt(c.getCreatedAt())
                .isPinned(c.isPinned())
                .likeCount(c.getLikeCount())
                .replyCount(c.getReplyCount())
                .deleted(c.isDeleted())
                .parentCommentId(
                        c.getParentComment() != null ? c.getParentComment().getId() : null
                )
                .userLiked(false)

                // 🟢 RECURSIVE REPLIES
                .replies(
                        c.getReplies() != null
                                ? c.getReplies().stream()
                                .map(CommentResponseDTO::from)
                                .toList()
                                : List.of()
                )
                .build();
    }

    // -----------------------------------------------------------
    // LIKE-MAPPER (recursive replies dahil)
    // -----------------------------------------------------------
    public static CommentResponseDTO from(Comment c, boolean userLiked) {
        return CommentResponseDTO.builder()
                .id(c.getId())
                .userId(c.getUser().getId())
                .username(c.getUser().getUsername())
                .taskId(c.getTask().getId())
                .fieldCode(c.getFieldCode())
                .content(c.isDeleted() ? "[deleted]" : c.getContent())
                .createdAt(c.getCreatedAt())
                .isPinned(c.isPinned())
                .likeCount(c.getLikeCount())
                .replyCount(c.getReplyCount())
                .deleted(c.isDeleted())
                .parentCommentId(
                        c.getParentComment() != null ? c.getParentComment().getId() : null
                )
                .userLiked(userLiked)

                // 🟢 SAME RECURSIVE REPLY LOGIC
                .replies(
                        c.getReplies() != null
                                ? c.getReplies().stream()
                                .map(child -> CommentResponseDTO.from(child, false))
                                .toList()
                                : List.of()
                )
                .build();
    }
}

