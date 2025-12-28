package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.AdminActionLogDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.RegisterDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.StudyResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.StudyResponseDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.UserDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.AdminActionLog;
import com.artifactcomparator.artifact_comparator_backend.Filter.UserFilter;
import com.artifactcomparator.artifact_comparator_backend.Service.AdminService;
import com.artifactcomparator.artifact_comparator_backend.Repository.StudyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final StudyRepository studyRepository;
    public AdminController(AdminService adminService, StudyRepository studyRepository) {
        this.adminService = adminService;
        this.studyRepository = studyRepository;
    }

    @GetMapping("/user-panel")
    public List<UserDTO> getUsersFiltered(UserFilter filter) {
        return adminService.getAllUsersFiltered(filter);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete-user/{username}")
    public ResponseEntity<String> deleteUser(@PathVariable String username) {
        boolean deleted = adminService.deleteUserByUsername(username);
        if (deleted) {
            return ResponseEntity.ok("User deleted successfully");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }

    @PatchMapping("/change-role/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> changeUserRole(
            @PathVariable String username,
            @RequestParam String newRole
    ) {
        boolean updated = adminService.changeUserRole(username, newRole);
        if (updated) {
            return ResponseEntity.ok("User role updated successfully");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/action-log")
    public ResponseEntity<List<AdminActionLogDTO>> getActionLogs() {
        List<AdminActionLogDTO> logs = adminService.getAllActionLogs();
        return ResponseEntity.ok(logs);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create-user")
    public ResponseEntity<String> createUser(@RequestBody RegisterDTO dto) {
        boolean created = adminService.createNewUser(dto);
        if (created) {
            return ResponseEntity.ok("User created successfully");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Username or email already exists");
        }
    }

    @PatchMapping("/update-user/{username}")
    public ResponseEntity<?> updateUser(@PathVariable String username, @RequestBody UserDTO updatedUser) {
        boolean updated = adminService.updateUserInfo(username, updatedUser);
        if (updated) {
            return ResponseEntity.ok("✅ User updated successfully");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("❌ User not found");
        }
    }

    @GetMapping("/study-panel")
    public ResponseEntity<List<StudyResponseDTO>> getAllStudies() {
        List<StudyResponseDTO> studies = adminService.getAllStudies();
        return ResponseEntity.ok(studies);
    }
    @GetMapping("/{studyId}/reason")
    public ResponseEntity<String> getTheReason(@PathVariable Long studyId) {
        String reason = studyRepository.findRejectionReasonById(studyId) == null? "" : studyRepository.findRejectionReasonById(studyId);
        return ResponseEntity.ok(reason);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/study/{id}")
    public ResponseEntity<StudyResponseDTO> getStudyDetails(@PathVariable Long id) {
        StudyResponseDTO dto = adminService.getStudyDetails(id);
        return dto != null ? ResponseEntity.ok(dto)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/study/{id}/block")
    public ResponseEntity<String> blockStudy(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String reason = body != null ? body.getOrDefault("reason", "").trim() : "";
        if (reason.isEmpty()) {
            return ResponseEntity.badRequest().body("Blocking reason is required.");
        }
        boolean ok = adminService.blockStudy(id, reason);
        return ok ? ResponseEntity.ok("Study blocked.")
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Study not found.");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/study/{id}/unblock")
    public ResponseEntity<String> unblockStudy(@PathVariable Long id) {
        boolean ok = adminService.unblockStudy(id);
        return ok ? ResponseEntity.ok("Study unblocked.")
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body("Study not found.");
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('RESEARCHER')")
    @GetMapping("/all-users")
    public ResponseEntity<List<UserDTO>> getAllUsersForValidation() {
        try {
            List<UserDTO> users = adminService.getAllUsersFiltered(new UserFilter());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
}

