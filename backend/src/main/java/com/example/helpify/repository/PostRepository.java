package com.example.helpify.repository;


import com.example.helpify.entity.Post;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByPostedByName(String postedByName);

    List<Post> findByType(String type);
    List<Post> findByPostedByEmail(String postedByEmail);
}
