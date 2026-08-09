package com.example.helpify.service;

import com.example.helpify.entity.User;
import com.example.helpify.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service

public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmailService emailService;

    // ===== REGISTER =====
    public User register(User user) {

        user.setEmail(user.getEmail().toLowerCase());

        if (!user.getEmail().endsWith("@bennett.edu.in")) {
            throw new RuntimeException("Only college email allowed");
        }

        Optional<User> existing = userRepository.findByEmail(user.getEmail());

        if (existing.isPresent()) {
            User oldUser = existing.get();

            // resend OTP only if not verified
            if (!oldUser.isVerified()) {
                String otp = generateOTP();
                oldUser.setOtp(otp);
                sendEmail(oldUser.getEmail(), otp);
                return userRepository.save(oldUser);
            }

            throw new RuntimeException("User already exists and verified");
        }

        user.setVerified(false);

        String otp = generateOTP();
        user.setOtp(otp);

        sendEmail(user.getEmail(), otp);

        return userRepository.save(user);
    }
    // ===== LOGIN =====
    public User login(String email, String password) {
        email = email.toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isVerified()) {
            throw new RuntimeException("Email not verified");
        }

        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Wrong password");
        }
        return user;
    }
    // ===== VERIFY OTP =====
    public String verifyOTP(String email, String otp) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOtp().equals(otp)) {
            user.setVerified(true);
            user.setOtp(null);
            userRepository.save(user);
            return "Verified successfully";
        }

        return "Invalid OTP";
    }
    // ===== GENERATE OTP =====
    public String generateOTP() {
        return String.valueOf((int)(Math.random() * 900000) + 100000);
    }

    // ===== SEND EMAIL =====
    public void sendEmail(String to, String otp) {
        emailService.sendEmail(to, otp);
    }
    // ===== SAVE USER (for location updates etc.) =====
    public User save(User user) {
        return userRepository.save(user);
    }
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
    public User updateLocation(String email, Double lat, Double lng) {
        User user = userRepository.findByEmail(email).orElseThrow();
        user.setLatitude(lat);
        user.setLongitude(lng);
        return userRepository.save(user);
    }
//    public User updateProfile(String email, User updatedData) {
//
//        User user = userRepository.findByEmail(email).orElseThrow();
//
//        if (updatedData.getUsername() != null)
//            user.setUsername(updatedData.getUsername());
//
//        if (updatedData.getPhone() != null)
//            user.setPhone(updatedData.getPhone());
//
//        if (updatedData.getHostelBlock() != null)
//            user.setHostelBlock(updatedData.getHostelBlock());
//
//        if (updatedData.getRoomNumber() != null)
//            user.setRoomNumber(updatedData.getRoomNumber());
//
//        return userRepository.save(user);
//    }
    // ===== FORGOT PASSWORD (SEND OTP) =====
public String forgotPassword(String email) {
    email = email.toLowerCase();

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    String otp = generateOTP();
    System.out.println("RESET OTP: " + otp);
    user.setOtp(otp);

    sendEmail(email, otp);

    userRepository.save(user);

    return "OTP sent to email";
}

// ===== RESET PASSWORD =====
public String resetPassword(String email, String otp, String newPassword) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (!otp.equals(user.getOtp())) {
        throw new RuntimeException("Invalid OTP");
    }

    user.setPassword(newPassword);
    user.setOtp(null);

    userRepository.save(user);

    return "Password updated successfully";
}

}
