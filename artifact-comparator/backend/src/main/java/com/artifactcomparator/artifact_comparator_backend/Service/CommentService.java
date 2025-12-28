package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.CommentResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.CreateCommentRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.DeletedCommentLogDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.*;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import com.artifactcomparator.artifact_comparator_backend.Repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final EvaluationTaskRepository taskRepository;
    private final CommentLikeRepository likeRepo;
    private final DeletedCommentLogRepository deletedCommentLogRepository;
    private final ResearcherActionLogRepository researcherActionLogRepository;

    public CommentResponseDTO createComment(CreateCommentRequestDTO req, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        EvaluationTask task = taskRepository.findById(req.getTaskId())
                .orElseThrow(() -> new RuntimeException("Task not found"));

        Comment parent = null;
        if (req.getParentCommentId() != null) {
            parent = commentRepository.findById(req.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found"));
        }


        Comment comment = Comment.builder()
                .user(user)
                .task(task)
                .fieldCode(req.getFieldCode())
                .content(req.getContent())
                .pinned(false)
                .likeCount(0)
                .replyCount(0)
                .parentComment(parent)
                .createdAt(LocalDateTime.now())
                .build();

        commentRepository.save(comment);

        if (parent != null) {
            parent.setReplyCount(parent.getReplyCount() + 1);
            commentRepository.save(parent);
        }

        return CommentResponseDTO.from(comment);
    }

    public List<CommentResponseDTO> getCommentsForField(Long taskId, String fieldCode) {

        // 1. SADECE ROOT COMMENTLER
        List<Comment> roots =
                commentRepository.findByTaskIdAndFieldCodeAndParentCommentIsNullOrderByCreatedAtAsc(
                        taskId, fieldCode
                );

        // 2. RECURSIVE DTO
        return roots.stream()
                .map(CommentResponseDTO::from) // RECURSIVE DÖNÜŞÜM
                .toList();
    }

    public CommentResponseDTO toggleLike(Long commentId, Long userId) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        boolean alreadyLiked = likeRepo.existsByUserIdAndCommentId(userId, commentId);

        if (alreadyLiked) {
            // UNLIKE
            likeRepo.deleteByUserIdAndCommentId(userId, commentId);
        } else {
            // LIKE
            CommentLike like = CommentLike.builder()
                    .user(userRepository.findById(userId).orElseThrow())
                    .comment(comment)
                    .build();
            likeRepo.save(like);
        }

        // likeCount güncelle
        int count = likeRepo.countByCommentId(commentId);
        comment.setLikeCount(count);
        commentRepository.save(comment);

        // frontend için userLiked bilgisi
        boolean nowLiked = !alreadyLiked;

        return CommentResponseDTO.from(comment, nowLiked);
    }

    @Transactional
    public void deleteComment(Long commentId, User deleter) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        // 🔥 SADECE RESEARCHER İSE LOG YAZ
        if (deleter.getRole() == Role.RESEARCHER) {
            ResearcherActionLog log = ResearcherActionLog.builder()
                    .researcher(deleter)
                    .action("DELETE_COMMENT")
                    .comment(comment)
                    .task(comment.getTask())
                    .createdAt(LocalDateTime.now())
                    .build();
            researcherActionLogRepository.save(log);
        }

        // Log kaydı oluştur
        if (!deletedCommentLogRepository.existsByOriginalCommentId(commentId)) {

            DeletedCommentLog log = DeletedCommentLog.builder()
                    .owner(comment.getUser())
                    .deletedBy(deleter)
                    .task(comment.getTask())
                    .study(comment.getTask().getStudy())
                    .originalContent(comment.getContent())
                    .originalCommentId(comment.getId())
                    .parentCommentId(comment.getParentComment() != null
                            ? comment.getParentComment().getId()
                            : null)
                    .deleteReason("Rule violation")
                    .build();

            deletedCommentLogRepository.save(log);
        }

        // Yorum gerçekten siliniyor
        comment.setDeleted(true);
        comment.setContent("deleted");
        commentRepository.save(comment);
    }

    public List<CommentResponseDTO> getAllCommentsForTask(Long taskId) {

        List<Comment> list = commentRepository.findByTaskId(taskId);

        return list.stream()
                .map(CommentResponseDTO::from)
                .toList();
    }

    public List<DeletedCommentLogDTO> getLogsForTask(Long taskId) {
        return deletedCommentLogRepository.findByTaskId(taskId)
                .stream()
                .map(DeletedCommentLogDTO::from)
                .toList();
    }

    @Transactional
    public CommentResponseDTO togglePin(Long commentId, User researcher) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        boolean newState = !comment.isPinned();
        comment.setPinned(newState);
        commentRepository.save(comment);

        researcherActionLogRepository.save(
                ResearcherActionLog.builder()
                        .researcher(researcher)
                        .targetUser(comment.getUser())
                        .task(comment.getTask())
                        .comment(comment)
                        .createdAt(LocalDateTime.now())
                        .action(newState ? "PIN_COMMENT" : "UNPIN_COMMENT")
                        .build()
        );

        return CommentResponseDTO.from(comment);
    }

    public List<CommentResponseDTO> getCommentsByParticipant(Long taskId, String username) {
        List<Comment> list = commentRepository.findByTaskIdAndUserUsername(taskId, username);

        return list.stream()
                .map(CommentResponseDTO::from)
                .toList();
    }

    @Transactional
    public void editComment(Long commentId, Long userId, String newContent) {

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUser().getId().equals(userId))
            throw new RuntimeException("You can only edit your own comments");

        if (comment.isDeleted())
            throw new RuntimeException("Cannot edit a deleted comment");

        comment.setContent(newContent);
        commentRepository.save(comment);
    }
}
