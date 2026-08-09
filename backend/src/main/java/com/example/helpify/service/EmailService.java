package com.example.helpify.service;

import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Value("${SENDGRID_API_KEY:}")
    private String apiKey;

    public void sendEmail(String to, String otp) {
        Email from = new Email("helpify.uni@gmail.com");
        String subject = "Helpify OTP";
        Email toEmail = new Email(to);
        Content content = new Content("text/plain", "Your OTP is: " + otp);

        Mail mail = new Mail(from, subject, toEmail, content);

        SendGrid sg = new SendGrid(apiKey);
        Request request = new Request();

        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            System.out.println(response.getStatusCode());
        } catch (Exception ex) {
            throw new RuntimeException("Email sending failed");
        }
    }
}