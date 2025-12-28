package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.ForgotPasswordDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.ResetPasswordForgotDTO;
import com.artifactcomparator.artifact_comparator_backend.Service.PasswordResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/password")
public class PasswordController {

    private final PasswordResetService passwordResetService;

    public PasswordController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    // ✅ 1️⃣ Forgot password — send reset email
    @PostMapping("/forgot")
    public ResponseEntity<String> forgot(@RequestBody ForgotPasswordDTO forgotPasswordDTO) {
        passwordResetService.sendResetLink(forgotPasswordDTO.getEmail());
        System.out.println("📩 Reset email sent to: " + forgotPasswordDTO.getEmail());
        return ResponseEntity.ok("Reset email sent successfully!");
    }

    // ✅ 2️⃣ Reset password — update password in DB
    @PostMapping("/reset")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordForgotDTO resetPasswordForgotDTO) {
        passwordResetService.resetPassword(resetPasswordForgotDTO);
        System.out.println("🔐 Password reset successful for token: " + resetPasswordForgotDTO.getToken());
        return ResponseEntity.ok("Password reset successful!");
    }
}
