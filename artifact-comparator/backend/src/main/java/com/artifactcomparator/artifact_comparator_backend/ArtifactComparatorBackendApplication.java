package com.artifactcomparator.artifact_comparator_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ArtifactComparatorBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ArtifactComparatorBackendApplication.class, args);
	}



}
