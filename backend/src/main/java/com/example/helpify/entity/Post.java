package com.example.helpify.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "post")
public class Post {
    @Id
    private String id;
    private String userId;
    private String postedByEmail;
    private String postedByName;
    private String postedByGender;
    private String type; // campusTea, seniorGuidance, randomQuestion
    private String content;
    private List<Comment> comments = new ArrayList<>();
    private List<String> imageUrls = new ArrayList<>();
    private List<String> likedBy = new ArrayList<>();
    private boolean active = true;
    private boolean anonymous = false;
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime createdAt;
    private boolean edited = false;
    private LocalDateTime editedAt;
    private int views = 0;
}
