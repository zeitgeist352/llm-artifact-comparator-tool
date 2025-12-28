package com.artifactcomparator.artifact_comparator_backend.Repository;

import com.artifactcomparator.artifact_comparator_backend.DTO.UserDTO;
import com.artifactcomparator.artifact_comparator_backend.Entity.Researcher;
import com.artifactcomparator.artifact_comparator_backend.Entity.User;
import com.artifactcomparator.artifact_comparator_backend.Enums.Role;
import com.artifactcomparator.artifact_comparator_backend.Filter.UserFilter;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    List<User> findByRole(Role role);

    // Check if a username already exists (used in UserService)
    boolean existsByUsername(String username);

    // Check if an email already exists (used in UserService)
    boolean existsByEmail(String email);

    @Query("SELECT new com.artifactcomparator.artifact_comparator_backend.DTO.UserDTO(u.username, u.name, u.lastname, u.email, u.password, u.role) " +
            "FROM User u WHERE u.username = :username")
    Optional<UserDTO> findUserDTOByUsername(@Param("username") String username);

    @Transactional
    @Modifying
    @Query("UPDATE User u SET u.username = :username, u.name = :name, u.lastname = :lastname, " +
            "u.email = :email, u.password = :password, u.role = :role " +
            "WHERE u.id = :id")
    int updateUserById(@Param("id") Long id,
                       @Param("username") String username,
                       @Param("name") String name,
                       @Param("lastname") String lastname,
                       @Param("email") String email,
                       @Param("password") String password,
                       @Param("role") Role role);

    //For admin usage
    @Query("""
    SELECT u FROM User u
    WHERE (:#{#filter.searchValue} IS NULL OR 
          LOWER(u.username) LIKE LOWER(CONCAT('%', :#{#filter.searchValue}, '%')) OR
          LOWER(u.name) LIKE LOWER(CONCAT('%', :#{#filter.searchValue}, '%')) OR
          LOWER(u.lastname) LIKE LOWER(CONCAT('%', :#{#filter.searchValue}, '%')))
      AND (:#{#filter.role} IS NULL OR u.role = :#{#filter.role})
""")
    List<User> searchAndFilterUsers(@Param("filter") UserFilter filter);





}
