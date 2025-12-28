package com.artifactcomparator.artifact_comparator_backend.Controller;

import com.artifactcomparator.artifact_comparator_backend.DTO.PasswordChangeDTO;
import com.artifactcomparator.artifact_comparator_backend.DTO.UserDTO;
import com.artifactcomparator.artifact_comparator_backend.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    private final UserService userService;

    public UserProfileController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/update")
    public ResponseEntity<String> updateUser(@RequestBody UserDTO userDTO, @RequestHeader("Authorization") String authHeader){
        String token = authHeader.replace("Bearer ", "");
        userService.updateUserInfoWithoutPasswordAndEmail(userDTO, token);
        return ResponseEntity.ok("Change Successful");
    }

    @GetMapping()
    public ResponseEntity<UserDTO> getCurrentUserInfo(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        UserDTO userDTO = userService.getUserInformation(token);

        if (userDTO == null) {
            return ResponseEntity.status(401).build(); // unauthorized if session missing
        }

        return ResponseEntity.ok(userDTO);
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@RequestBody PasswordChangeDTO passwordChangeDTO, @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        boolean changeSuccessful = userService.changeUserPassword(passwordChangeDTO.getCurrentPassword(), passwordChangeDTO.getNewPassword(), token);

        if (changeSuccessful) {
            return ResponseEntity.ok("Password changed successfully.");
        } else {
            // If old password doesn't match or new one invalid
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Password change failed. Please check your old password or new password format.");
        }
    }

    @PostMapping("/delete-account")
    public ResponseEntity<String> deleteUser(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        userService.deleteUser(token);
        return ResponseEntity.ok("Account deleted successfully.");
    }

}
