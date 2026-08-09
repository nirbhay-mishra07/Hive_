package com.example.helpify.controller;

import com.example.helpify.entity.Order;
import com.example.helpify.entity.User;
import com.example.helpify.service.OrderService;
import com.example.helpify.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserService userService;

    // ===== CREATE ORDER =====
    @PostMapping
    public Order create(@RequestBody Order order, HttpServletRequest req) {
        String email = (String) req.getAttribute("userEmail");

        if (email == null) {
            throw new RuntimeException("Not logged in");
        }

        return orderService.createOrder(order, email);
    }

    // ===== GET ALL ORDERS =====
    @GetMapping
    public List<Order> getAll(HttpServletRequest req) {

        String email = (String) req.getAttribute("userEmail");

        if (email == null) {
            throw new RuntimeException("Not logged in");
        }

        return orderService.getAllOrders(email);
    }

    // ===== ACCEPT ORDER =====
    @PutMapping("/{id}/accept")
    public Order accept(@PathVariable String id, HttpServletRequest req) {

        String email = (String) req.getAttribute("userEmail");

        if (email == null) {
            throw new RuntimeException("Not logged in");
        }

        User user = userService.findByEmail(email);

        return orderService.acceptOrder(id, email, user.getUsername());
    }
    // ===== COMPLETE ORDER =====
    @PutMapping("/{id}/complete")
    public Order complete(@PathVariable String id, HttpServletRequest req) {

        String email = (String) req.getAttribute("userEmail");

        if (email == null) {
            throw new RuntimeException("Not logged in");
        }

        return orderService.completeOrder(id, email);
    }

    // ===== CANCEL ORDER =====
    @PutMapping("/{id}/cancel")
    public Order cancel(@PathVariable String id, HttpServletRequest req) {

        String email = (String) req.getAttribute("userEmail");

        if (email == null) {
            throw new RuntimeException("Not logged in");
        }

        return orderService.cancelOrder(id, email);
    }
    // ===== NEARBY ORDERS =====
    @GetMapping("/nearby")
    public List<Order> getNearby(HttpServletRequest req) {

        String email = (String) req.getAttribute("userEmail");

        if (email == null) {
            throw new RuntimeException("Not logged in");
        }

        User user = userService.findByEmail(email);

        return orderService.getNearbyOrders(user);
    }
    @GetMapping("/stats")
    public Map<String, Object> stats(HttpServletRequest req) {

        String email = (String) req.getAttribute("userEmail");

        if (email == null) {
            throw new RuntimeException("Not logged in");
        }

        return orderService.getStats(email);
    }
}