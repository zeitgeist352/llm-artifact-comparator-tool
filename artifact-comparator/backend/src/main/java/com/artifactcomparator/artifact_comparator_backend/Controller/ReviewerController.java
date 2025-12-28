package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Service.ReviewerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
@RequestMapping("/api/reviewers")
public class ReviewerController {

    private final ReviewerService reviewerService;

    @Autowired
    public ReviewerController(ReviewerService reviewerService) {
        this.reviewerService = reviewerService;
    }

    /**
     * Endpoint for a reviewer to join a specific study.
     * @param reviewerId The ID of the reviewer
     * @param studyId The ID of the study to join
     * @return ResponseEntity with a success message
     */
    @PostMapping("/{reviewerId}/join-study/{studyId}")
    public ResponseEntity<String> joinStudy(@PathVariable Long reviewerId, @PathVariable Long studyId) {
        try {
            reviewerService.joinStudy(reviewerId, studyId);
            return ResponseEntity.ok("Reviewer successfully joined the study.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Endpoint to get all studies joined by a specific reviewer.
     * @param reviewerId The ID of the reviewer
     * @return List of Studies
     */
    @GetMapping("/{reviewerId}/joined-studies")
    public ResponseEntity<List<Study>> getJoinedStudies(@PathVariable Long reviewerId) {
        return ResponseEntity.ok(reviewerService.getJoinedStudies(reviewerId));
    }
}