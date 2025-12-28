package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.Entity.ArtifactUpload;
import com.artifactcomparator.artifact_comparator_backend.Repository.ArtifactUploadRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskArtifactService {

    private final ArtifactUploadRepository repo;

    public TaskArtifactService(ArtifactUploadRepository repo) {
        this.repo = repo;
    }

    public List<ArtifactUpload> getArtifactsByIds(List<Long> ids) {
        return repo.findAllById(ids);
    }

    public ArtifactUpload getArtifactById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Artifact not found: " + id));
    }
}
