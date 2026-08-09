package com.example.helpify.config;

import com.example.helpify.service.JwtService;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class JwtFilter extends GenericFilter {

    @Autowired
    private JwtService jwtService;
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;

        String authHeader = req.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            String token = authHeader.substring(7);

            // 🔥 PROTECTION 1: empty / invalid token
            if (token == null || token.isEmpty() || !token.contains(".")) {
                chain.doFilter(request, response);
                return;
            }

            try {
                String email = jwtService.extractEmail(token);

                // 🔥 attach user to request
                req.setAttribute("userEmail", email);

            } catch (Exception e) {
                // 🔥 PROTECTION 2: don't crash server
                System.out.println("Invalid JWT token: " + token);
            }
        }

        chain.doFilter(request, response);
    }
}