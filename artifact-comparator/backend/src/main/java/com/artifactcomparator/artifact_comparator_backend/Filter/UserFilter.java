package com.artifactcomparator.artifact_comparator_backend.Filter;

import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserFilter {
    private String searchValue;
    private Role role;
}
