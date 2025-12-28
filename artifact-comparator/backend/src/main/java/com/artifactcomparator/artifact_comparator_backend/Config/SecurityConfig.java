package com.artifactcomparator.artifact_comparator_backend.Config;

import com.artifactcomparator.artifact_comparator_backend.Security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(request -> {
                    var config = new CorsConfiguration();
                    config.setAllowedOrigins(List.of("http://localhost:3000"));
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(List.of("*")); // Authorization dahil
                    config.setAllowCredentials(true);
                    return config;
                }))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/api/auth/**",
                                "/api/password/**"
                        ).permitAll()

                        .requestMatchers("/file/**").authenticated()

                        .requestMatchers(
                                "/uploadFile",
                                "/myFiles",
                                "/renameFile/**",
                                "/deleteFile/**",
                                "/classifyFile/**"
                        ).authenticated()

                        // ⭐ ADD THESE LINES HERE
                        .requestMatchers("/api/artifact-folders/**").authenticated()
                        .requestMatchers("/api/artifacts/**").authenticated()

                        .anyRequest().permitAll()

                )
                // ⭐ JWT filtresini UsernamePasswordAuthenticationFilter'dan ÖNCE ekle
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
