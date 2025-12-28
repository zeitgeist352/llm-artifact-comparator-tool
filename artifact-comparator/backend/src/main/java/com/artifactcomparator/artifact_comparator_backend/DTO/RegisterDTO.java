package com.artifactcomparator.artifact_comparator_backend.DTO;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import jakarta.persistence.*;
import lombok.Data;

@Data
public class RegisterDTO {

    private String username;
    private String name;
    private String lastname;
    private String email;
    private String password;
    private String role;

}
