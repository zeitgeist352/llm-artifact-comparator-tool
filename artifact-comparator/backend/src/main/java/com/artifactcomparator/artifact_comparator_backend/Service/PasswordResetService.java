package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.ResetPasswordForgotDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.PasswordResetToken;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.PasswordResetTokenRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final JavaMailSender mailSender;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.mailSender = mailSender;
    }

    public void sendEmail(String email) {
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(email);
        mail.setSubject("Password Reset Link");
        mail.setText("Click the link below to reset your password:\n");

        mailSender.send(mail);
    }

    @Transactional
    public void sendResetLink(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No user found with this email"));

        // Delete the old token (optional but safer)
        tokenRepository.deleteByUserId(user.getId());

        // Generate new token
        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(token);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(1));
        tokenRepository.save(resetToken);

        // Create email
        String resetUrl = "http://localhost:3000/reset-password?token=" + token;

        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(email);
        mail.setSubject("Password Reset Link");
        mail.setText("Click the following link to reset your password:\n" + resetUrl);

        mailSender.send(mail);
    }

    private boolean isPasswordValid(String password) {
        if (password == null) return false;

        // Regex: at least 8 chars, 1 digit, 1 upper, 1 lower, 1 special, no spaces
        String passwordPattern =
                "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!.])(?=\\S+$).{8,}$";

        return password.matches(passwordPattern);
    }

    public void resetPassword(ResetPasswordForgotDTO dto) {
        PasswordResetToken token = tokenRepository.findByToken(dto.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }

        // ✅ Şifre karmaşıklık kontrolü
        if (!isPasswordValid(dto.getNewPassword())) {
            throw new RuntimeException(
                    "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character."
            );
        }

        User user = token.getUser();
        user.setPassword(dto.getNewPassword()); // TODO: encode later
        userRepository.save(user);

        tokenRepository.delete(token);
    }

}
