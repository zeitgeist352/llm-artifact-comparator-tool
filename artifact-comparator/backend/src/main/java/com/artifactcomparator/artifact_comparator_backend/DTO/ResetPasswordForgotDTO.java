package com.artifactcomparator.artifact_comparator_backend.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordForgotDTO {
    private String token;
    private String newPassword;

    public ResetPasswordForgotDTO() {}

    public ResetPasswordForgotDTO(String token, String newPassword) {
        this.token = token;
        this.newPassword = newPassword;
    }
}
