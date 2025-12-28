package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.CommentResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.CreateCommentRequestDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.DeletedCommentLogDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.ResearcherActionLogDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.ResearcherActionLog;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.DeletedCommentLogRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.ResearcherActionLogRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Security.JwtUtil;
import com.artifactcomparator.artifact_comparator_backend.Service.CommentService;
import com.artifactcomparator.artifact_comparator_backend.Service.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class CommentController {

    private final CommentService commentService;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final CommentService deletedCommentLogService;
    private final ResearcherActionLogRepository researcherActionLogRepository;

    @PostMapping
    public CommentResponseDTO createComment(
            @RequestBody CreateCommentRequestDTO req,
            @RequestHeader("Authorization") String authHeader
    ) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid or missing token");
        }

        // 🔓 Token → userId çıkar
        String token = authHeader.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);

        // 🟢 Servise gönder
        return commentService.createComment(req, userId);
    }

    @GetMapping("/task/{taskId}/field/{fieldCode}")
    public List<CommentResponseDTO> getComments(
            @PathVariable Long taskId,
            @PathVariable String fieldCode
    ) {
        return commentService.getCommentsForField(taskId, fieldCode);
    }

    @Transactional
    @PostMapping("/{commentId}/like")
    public CommentResponseDTO toggleLike(
            @PathVariable Long commentId,
            @RequestHeader("Authorization") String authHeader
    ) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Invalid or missing token");
        }

        String token = authHeader.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);

        return commentService.toggleLike(commentId, userId);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable Long commentId,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        Long userId = JwtUtil.extractUserId(token);
        User deleter = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        commentService.deleteComment(commentId, deleter);

        return ResponseEntity.ok("Comment deleted");
    }

    @GetMapping("/task/{taskId}")
    public List<CommentResponseDTO> getAllCommentsForTask(@PathVariable Long taskId) {
        return commentService.getAllCommentsForTask(taskId);
    }

    @GetMapping("/task/{taskId}/deleted")
    public List<DeletedCommentLogDTO> getDeletedComments(@PathVariable Long taskId) {
        return deletedCommentLogService.getLogsForTask(taskId);
    }

    @PutMapping("/{commentId}/pin")
    public ResponseEntity<?> togglePin(
            @PathVariable Long commentId,
            @RequestHeader("Authorization") String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(401).body("Missing token");

        String token = authHeader.substring(7);
        Long userId = JwtUtil.extractUserId(token);

        User actor = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(commentService.togglePin(commentId, actor));
    }

    @GetMapping("/task/{taskId}/participant/{username}")
    public List<CommentResponseDTO> getCommentsByParticipant(
            @PathVariable Long taskId,
            @PathVariable String username
    ) {
        return commentService.getCommentsByParticipant(taskId, username);
    }

    @GetMapping("/task/{taskId}/researcher-logs")
    public ResponseEntity<?> getResearcherLogsForTask(@PathVariable Long taskId) {
        try {
            List<ResearcherActionLog> logs = researcherActionLogRepository.findByTaskId(taskId);

            List<ResearcherActionLogDTO> dtoList = logs.stream()
                    .map(log -> new ResearcherActionLogDTO(
                            log.getResearcher().getUsername(),
                            log.getAction(),
                            log.getTargetUser() != null ? log.getTargetUser().getUsername() : null,
                            log.getComment() != null ? log.getComment().getId() : null,
                            log.getCreatedAt()
                    ))
                    .toList();

            return ResponseEntity.ok(dtoList);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error fetching researcher logs: " + e.getMessage());
        }
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<?> editComment(
            @PathVariable Long commentId,
            @RequestBody CreateCommentRequestDTO req,
            @RequestHeader("Authorization") String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(401).body("Missing or invalid token");

        String token = authHeader.substring(7);
        Long userId = jwtService.validateAndExtractUserId(token);

        commentService.editComment(commentId, userId, req.getContent());

        return ResponseEntity.ok("Comment updated successfully");
    }

    @GetMapping("/task/{taskId}/artifact/{fieldCode}")
    public List<CommentResponseDTO> getCommentsByArtifactFieldCode(
            @PathVariable Long taskId,
            @PathVariable String fieldCode
    ) {
        return commentService.getCommentsForField(taskId, fieldCode);
    }
}