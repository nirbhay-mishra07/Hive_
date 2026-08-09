package com.example.helpify.repository;

import com.example.helpify.entity.Order;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface OrderRepository extends MongoRepository<Order, String> {
    int countByPostedBy(String email);

    int countByAcceptedByAndStatus(String email, String status);

    int countByStatus(String status);

    List<Order> findByAcceptedByAndStatus(String email, String status);
}
