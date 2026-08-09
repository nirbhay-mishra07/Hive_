package com.example.helpify.controller;

import com.example.helpify.entity.Comment;
import com.example.helpify.entity.Post;
import com.example.helpify.service.PostService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/posts")

public class PostController {
    private final  PostService postService;

    @GetMapping
    public List<Post> getAllPost() {
        return postService.getAllPosts();
    }

    @GetMapping("/me")
    public List<Post> myPost(HttpServletRequest req){
        String email = (String) req.getAttribute("userEmail");
        if(email == null){
           throw new RuntimeException("Not logged in");
        }
        return postService.getPostByEmail(email);
    }


    //create order
    @PostMapping
    public Post createPost(@RequestBody Post post, HttpServletRequest req){
        String email = (String) req.getAttribute("userEmail");
        if(email == null){
            throw new RuntimeException("Not logged in");
        }
        return postService.createPost(post, email);
    }

    //get post by type
    @GetMapping("/type/{type}")
    public List<Post> getAllPostByType(@PathVariable String type){

        return postService.getPostByType(type);
    }

    @PutMapping("/{id}/like")
    public Post likePost(@PathVariable String id, HttpServletRequest req){
        String email = (String) req.getAttribute("userEmail");
        if(email == null){
            throw new RuntimeException("Not logged in");
        }
        return postService.likePost(id,email);
    }

    @PostMapping("/{id}/comment")
    public Post commentPost(@PathVariable String id, @RequestBody Comment comment, HttpServletRequest req){
        String email = (String) req.getAttribute("userEmail");
        if(email == null){
            throw new RuntimeException("Not logged in");
        }
        return postService.addComment(id,email,comment);
    }

    @DeleteMapping("/{id}")
    public String deletePost(@PathVariable String id, HttpServletRequest req){
        String email = (String) req.getAttribute("userEmail");
        if(email == null){
            throw new RuntimeException("Not logged in");
        }
        postService.deletePost(id, email);
        return "Post deleted successfully";
    }

    @PutMapping("/{id}/view")
    public void viewPost(@PathVariable String id) {
        postService.increaseViewCount(id);
    }
}
