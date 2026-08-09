package com.example.helpify.service;

import com.example.helpify.entity.Comment;
import com.example.helpify.entity.Post;
import com.example.helpify.entity.User;
import com.example.helpify.repository.PostRepository;
import com.example.helpify.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;
    private final UserRepository  userRepository;

    // get post
    public List<Post> getAllPosts(){
        List<Post> posts = postRepository.findAll();
        posts = posts.stream()
                .filter(Post::isActive)
                .toList();
        posts.sort((a,b)-> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return posts;
    }

    //create post
    public Post createPost(Post post, String email){

        if (post.getContent() == null || post.getContent().trim().isEmpty() ) {
            throw new RuntimeException("Post cannot be empty");
        }
        User user = userRepository.findByEmail(email).orElseThrow(()->new RuntimeException("User not found"));

        post.setUserId(user.getId());
        post.setPostedByEmail(user.getEmail());
        post.setPostedByName(user.getUsername());
        post.setPostedByGender(user.getGender());

        post.setCreatedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    // get post by email
    public List<Post> getPostByEmail(String email){

        return postRepository.findByPostedByEmail(email);
    }

    //get post by type
    public List<Post> getPostByType(String type){
         return postRepository.findByType(type);
    }

    // add likes
    public Post likePost(String id, String email){
        Post post = postRepository.findById(id).orElseThrow(()-> new RuntimeException("Post not fount"));
        if(post.getLikedBy().contains(email)){
            post.getLikedBy().remove(email);
        }else{
            post.getLikedBy().add(email);
        }
        return postRepository.save(post);
    }

    // add view viewer
    public void increaseViewCount(String id){
        Post post = postRepository.findById(id).orElseThrow(()-> new RuntimeException("Post not fount"));
        post.setViews(post.getViews() + 1);
        postRepository.save(post);
    }

    // add comment
    public Post addComment(String id, String email, Comment comment){
        Post post = postRepository.findById(id).orElseThrow(()-> new RuntimeException("Post not fount"));
        User user = userRepository.findByEmail(email).orElseThrow(()->new RuntimeException("User not found"));
        comment.setUserId(user.getId());
        comment.setUsername(user.getUsername());
        comment.setCommentedAt(LocalDateTime.now());
        post.getComments().add(comment);
        return postRepository.save(post);
    }

    // delete the post
    public void deletePost(String id, String email){
        Post post = postRepository.findById(id).orElseThrow(()-> new RuntimeException("Post not fount"));
        if(!(post.getPostedByEmail().equals(email))){
            throw new RuntimeException("You can only delete your own post");
        }
        post.setActive(false);
        postRepository.save(post);
    }

}
