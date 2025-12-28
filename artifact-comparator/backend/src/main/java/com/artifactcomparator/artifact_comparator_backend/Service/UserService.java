package com.artifactcomparator.artifact_comparator_backend.Service;

import com.artifactcomparator.artifact_comparator_backend.DTO.RegisterDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.UserDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import com.artifactcomparator.artifact_comparator_backend.Repository.PasswordResetTokenRepository;
import com.artifactcomparator.artifact_comparator_backend.Repository.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.validation.ValidationException;
import org.springframework.data.crossstore.ChangeSetPersister;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public UserService(UserRepository userRepository,  JwtService jwtService, PasswordResetTokenRepository passwordResetTokenRepository) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    public User registerUser(RegisterDTO registerDTO) {
        // Check for duplicate username
        if (userRepository.existsByUsername(registerDTO.getUsername())) {
            throw new ValidationException("Username already taken");
        }

        // Check for duplicate email
        if (userRepository.existsByEmail(registerDTO.getEmail())) {
            throw new ValidationException("Email already in use");
        }

        // Validate password format
        if (!isPasswordValid(registerDTO.getPassword())) {
            throw new ValidationException("Invalid password. " +
                    "Password must be at least 8 characters long, " +
                    "contain at least one uppercase letter, one lowercase letter, " +
                    "one digit, and one special character.");
        }

        // Create user if everything is valid

        String role = registerDTO.getRole();
        Role userRole = null;
        if(role.equals("participant")){
            userRole = Role.PARTICIPANT;
        }
        else if(role.equals("admin")){
            userRole = Role.ADMIN;
        }
        else if(role.equals("reviewer")){
            userRole = Role.REVIEWER;
        }
        else if(role.equals("researcher")){
            userRole = Role.RESEARCHER;
        }

        UserDTO userDTO = new UserDTO(registerDTO.getUsername(), registerDTO.getName(), registerDTO.getLastname(), registerDTO.getEmail(), registerDTO.getPassword(), userRole);
        return createUser(userDTO);
    }

    public User createUser(UserDTO userDto){
        User user = new User();
        user.setUsername(userDto.getUsername());
        user.setPassword(userDto.getPassword());
        user.setEmail(userDto.getEmail());
        user.setLastname(userDto.getLastname());
        user.setName(userDto.getName());
        user.setRole(userDto.getRole());

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(String token){
        Long currentUserId = jwtService.validateAndExtractUserId(token);
        User user = userRepository.findById(currentUserId).orElseThrow(()->new ValidationException("User not found"));
        passwordResetTokenRepository.deleteByUserId(user.getId());
        userRepository.deleteById(currentUserId);
    }

    public void updateUserInfoWithoutPasswordAndEmail(UserDTO userDTO, String token){
        Long currentUserId = jwtService.validateAndExtractUserId(token);
        User u = userRepository.findById(currentUserId).orElse(null);
        userRepository.updateUserById(currentUserId, userDTO.getUsername(), userDTO.getName(), userDTO.getLastname(), userDTO.getEmail(), u.getPassword(), userDTO.getRole());
    }

    public UserDTO getUserInformation(String token){
        Long currentUserId = jwtService.validateAndExtractUserId(token);
        User u = userRepository.findById(currentUserId).orElse(null);
        return new UserDTO(u.getUsername(), u.getName(), u.getLastname(), u.getEmail(), u.getPassword(), u.getRole());
    }

    public boolean changeUserPassword(String oldPassword, String newPassword, String token) {
        Long currentUserId = jwtService.validateAndExtractUserId(token);
        User u = userRepository.findById(currentUserId).orElse(null);
        if(u.getPassword().equals(oldPassword)) {
            userRepository.updateUserById(currentUserId, u.getUsername(), u.getName(), u.getLastname(), u.getEmail(), newPassword, u.getRole());
            return true;
        }
        else  {
            return false;
        }
    }

    private boolean isPasswordValid(String password) {
        if (password == null) return false;

        // Regex: at least 8 chars, 1 digit, 1 upper, 1 lower, 1 special, no spaces
        String passwordPattern =
                "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!.])(?=\\S+$).{8,}$";

        return password.matches(passwordPattern);
    }


}
