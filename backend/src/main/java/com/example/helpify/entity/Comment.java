package com.example.helpify.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Comment {
    private String userId;
    private String username;
    private String comment;
    private LocalDateTime commentedAt;
}
