package com.trade.CryptoTrading.controllers;

import com.razorpay.RazorpayException;
import com.stripe.exception.StripeException;
import com.trade.CryptoTrading.domain.PaymentMethod;
import com.trade.CryptoTrading.models.PaymentOrder;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.response.PaymentResponse;
import com.trade.CryptoTrading.service.PaymentService;
import com.trade.CryptoTrading.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class PaymentController {
    @Autowired
    private UserService userService;

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/api/payment/{paymentMethod}/amount/{amount}")
    public ResponseEntity<PaymentResponse> paymentHandler(@PathVariable PaymentMethod paymentMethod,
                                                          @PathVariable Long amount, @RequestHeader("Authorization") String jwt) throws Exception,RazorpayException, StripeException {
        User user = userService.findUserProfileByJwt(jwt);

        PaymentResponse paymentResponse;

        PaymentOrder order = paymentService.createOrder(user,amount,paymentMethod);
        if(paymentMethod.equals(PaymentMethod.RAZORPAY)){
            paymentResponse = paymentService.createRazorpayPaymentLink(user,amount);
        }
        else{
            paymentResponse = paymentService.createStripePaymentLink(user,amount, order.getId());
        }
        return new ResponseEntity<>(paymentResponse, HttpStatus.CREATED);
    }
}
