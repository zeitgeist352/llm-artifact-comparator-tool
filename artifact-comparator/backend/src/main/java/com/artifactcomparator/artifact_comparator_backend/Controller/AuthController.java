package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.LoginDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.RegisterDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import com.artifactcomparator.artifact_comparator_backend.Security.JwtUtil;
import com.artifactcomparator.artifact_comparator_backend.Service.AuthService;
import com.artifactcomparator.artifact_comparator_backend.Service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserService userService, UserRepository userRepository) {
        this.authService = authService;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    // ✅ 1️⃣ LOGIN (JWT + USER INFO)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO loginDTO) {
        User user = userRepository.findByUsername(loginDTO.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("🔍 DB password: " + user.getPassword());
        System.out.println("🔍 entered password: " + loginDTO.getPassword());

        if (!user.getPassword().trim().equals(loginDTO.getPassword().trim())) {
            return ResponseEntity.status(401).body("Invalid credentials ❌");
        }

        // Token oluştur
        String token = JwtUtil.generateToken(user.getId(), user.getUsername(), String.valueOf(user.getRole()));

        // Şifreyi response’a koyma
        user.setPassword(null);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user);

        System.out.println("✅ Login successful for user: " + user.getUsername());
        return ResponseEntity.ok(response);
    }

    // ✅ 2️⃣ REGISTER
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterDTO registerDTO) {
        if (!authService.isRegisterSuccessful(registerDTO)) {
            return ResponseEntity.badRequest().body("Register failed ❌");
        } else {
            userService.registerUser(registerDTO);
            return ResponseEntity.ok("Register successful ✅");
        }
    }
}
