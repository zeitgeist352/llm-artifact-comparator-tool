package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.Study;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewerService {

    private final UserRepository userRepository;
    private final StudyRepository studyRepository;

    @Autowired
    public ReviewerService(UserRepository userRepository, StudyRepository studyRepository) {
        this.userRepository = userRepository;
        this.studyRepository = studyRepository;
    }

    /**
     * Adds a reviewer to a study.
     * @param reviewerId The ID of the user (who must be a reviewer)
     * @param studyId The ID of the study
     */
    @Transactional
    public void joinStudy(Long reviewerId, Long studyId) {
        // Fetch the user
        User user = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + reviewerId));

        // Validate that the user is actually a Reviewer
        if (user.getRole() != Role.REVIEWER) {
            throw new RuntimeException("User does not have the REVIEWER role.");
        }

        // Fetch the study
        Study study = studyRepository.findById(studyId)
                .orElseThrow(() -> new RuntimeException("Study not found with ID: " + studyId));

        // Check if already joined
        // We check the 'reviewers' list on the Study entity because it owns the relationship
        if (study.getReviewers().contains(user)) {
            // We return silently or log if already joined, so we don't break the flow
            // when clicking "Approve" on a study already joined.
            return;
        }

        // Add user to study's reviewer list
        study.getReviewers().add(user);

        // Save the Study (the owning side) to update the Join Table (study_reviewer)
        studyRepository.save(study);
    }

    /**
     * Retrieves all studies that a specific reviewer has joined.
     * @param reviewerId The ID of the reviewer
     * @return List of Studies
     */
    public List<Study> getJoinedStudies(Long reviewerId) {
        // Requires findByReviewers_Id in StudyRepository
        return studyRepository.findByReviewers_Id(reviewerId);
    }
}