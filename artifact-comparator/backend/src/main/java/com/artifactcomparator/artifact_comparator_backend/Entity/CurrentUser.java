package com.artifactcomparator.artifact_comparator_backend.Entity;

import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

@Component
@RequestScope
public class CurrentUser {

    private final HttpSession httpSession;

    public CurrentUser(HttpSession session) {
        this.httpSession = session;
    }

    public Long getId() {
        return (Long) httpSession.getAttribute("userId");
    }

}
