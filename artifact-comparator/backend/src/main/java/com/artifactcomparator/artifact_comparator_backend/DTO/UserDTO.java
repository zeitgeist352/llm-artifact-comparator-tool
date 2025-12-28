package com.artifactcomparator.artifact_comparator_backend.DTO;

import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private String username;
    private String name;
    private String lastname;
    private String email;
    private String password;
    private Role role;
}
