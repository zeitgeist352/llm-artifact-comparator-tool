package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.LoginDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.RegisterDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User isLoginSuccessful(LoginDTO loginDto) {
        Optional<User> userOpt = userRepository.findByUsername(loginDto.getUsername());
        return userOpt.orElse(null);
    }

    public boolean isRegisterSuccessful(RegisterDTO registerDto) {
        if (registerDto == null) {
            return false;
        }

        return isNotBlank(registerDto.getUsername()) &&
                isNotBlank(registerDto.getName()) &&
                isNotBlank(registerDto.getLastname()) &&
                isNotBlank(registerDto.getEmail()) &&
                isNotBlank(registerDto.getPassword()) &&
                isNotBlank(registerDto.getRole());
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
