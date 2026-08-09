package com.example.helpify.service;

import com.example.helpify.entity.Order;
import com.example.helpify.entity.User;
import com.example.helpify.repository.OrderRepository;
import com.example.helpify.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class OrderService {
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private UserRepository userRepository;

    public Order createOrder(Order order, String email) {

        User user = userRepository.findByEmail(email).orElseThrow();

        order.setPostedBy(email);
        order.setPostedByName(user.getUsername());
        order.setPostedByPhone(user.getPhone());
        order.setPostedByGender(user.getGender());

        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("POSTED");
        }
        if (order.getPlatform() == null || order.getPlatform().isBlank()) {
            order.setPlatform("Other");
        }
        if (order.getPreferredGender() == null || order.getPreferredGender().isBlank()) {
            order.setPreferredGender("Any");
        }

        order.setCreatedAt(new Date());

        return orderRepository.save(order);
    }
    public List<Order> getAllOrders(String email) {

        List<Order> all = orderRepository.findAll();

        return all.stream()
                .filter(o -> {
                    // hide delivered from public
                    if ("DELIVERED".equals(o.getStatus())) {
                        return email.equals(o.getPostedBy()) || email.equals(o.getAcceptedBy());
                    }

                    // hide accepted orders from others
                    if ("ACCEPTED".equals(o.getStatus())) {
                        return email.equals(o.getAcceptedBy()) || email.equals(o.getPostedBy());
                    }

                    return true; // only POSTED visible to all
                })
                .toList();
    }

    public Order acceptOrder(String id, String email, String name) {

        Order o = orderRepository.findById(id).orElseThrow();
        if ("DELIVERED".equals(o.getStatus())) {
            throw new RuntimeException("Already delivered");
        }
        User user = userRepository.findByEmail(email).orElseThrow();
        if (email.equals(o.getPostedBy())) {
            throw new RuntimeException("You can't accept your own order");
        }
        if (o.getStatus().equals("ACCEPTED")) {
            throw new RuntimeException("Already accepted");
        }

        if (o.getPreferredGender() != null && !o.getPreferredGender().equalsIgnoreCase("Any") && !o.getPreferredGender().equalsIgnoreCase(user.getGender())) {
            throw new RuntimeException("Only " + o.getPreferredGender() + " users can accept this request.");
        }

        o.setStatus("ACCEPTED");
        o.setAcceptedBy(email);
        o.setAcceptedByName(user.getUsername());
        o.setAcceptedByPhone(user.getPhone());
        o.setAcceptedByGender(user.getGender());

        return orderRepository.save(o);
    }

    public Order completeOrder(String id, String email) {

        Order order = orderRepository.findById(id).orElseThrow();

        if (!email.equals(order.getAcceptedBy())) {
            throw new RuntimeException("Only delivery person can complete");
        }

        order.setStatus("DELIVERED");

        return orderRepository.save(order);
    }
    public double distance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(Math.toRadians(lat1)) *
                        Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon/2) * Math.sin(dLon/2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    public List<Order> getNearbyOrders(User user) {
        if (user.getLatitude() == null || user.getLongitude() == null) {
            return new ArrayList<>();
        }

        List<Order> allOrders = orderRepository.findAll();

        return allOrders.stream()
                .filter(order -> distance(
                        user.getLatitude(),
                        user.getLongitude(),
                        order.getLat(),
                        order.getLng()
                ) < 1.0) // 1 km radius
                .toList();
    }
    public Order cancelOrder(String id, String email) {
        Order o = orderRepository.findById(id).orElseThrow();


        if (!email.equals(o.getAcceptedBy())) {
            throw new RuntimeException("Not your order");
        }

        o.setStatus("POSTED");
        o.setAcceptedBy(null);
        o.setAcceptedByName(null);
        o.setAcceptedByPhone(null);

        return orderRepository.save(o);
    }
    public Map<String, Object> getStats(String email) {

        int totalPosted = orderRepository.countByPostedBy(email);

        int delivered = orderRepository
                .countByAcceptedByAndStatus(email, "DELIVERED");

        int active = orderRepository.countByStatus("POSTED");

        int earnings = orderRepository
                .findByAcceptedByAndStatus(email, "DELIVERED")
                .stream()
                .mapToInt(o -> o.getReward() != 0 ? o.getReward() : 0)
                .sum();

        return Map.of(
                "totalRequests", totalPosted,
                "delivered", delivered,
                "active", active,
                "earnings", earnings
        );

    }

}
