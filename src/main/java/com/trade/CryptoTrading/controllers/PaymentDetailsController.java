package com.trade.CryptoTrading.controllers;

import com.trade.CryptoTrading.models.PaymentDetails;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.service.PaymentDetailsService;
import com.trade.CryptoTrading.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PaymentDetailsController {

    @Autowired
    private PaymentDetailsService paymentDetailsService;

    @Autowired
    private UserService userService;

    @PostMapping("/payment-details/add")
    public PaymentDetails addPaymentDetails(@RequestParam Long userId,
                                            @RequestParam String accountNumber,
                                            @RequestParam String accountHolderName,
                                            @RequestParam String ifsc,
                                            @RequestParam String bankName) throws Exception {
        User user = userService.findUserById(userId);
        return paymentDetailsService.addPaymentDetails(accountNumber, accountHolderName, ifsc, bankName, user);
    }

    @GetMapping("payment-details/{userId}")
    public PaymentDetails getUsersPaymentDetails(@PathVariable Long userId) throws Exception {
        User user = userService.findUserById(userId);
        return paymentDetailsService.getUsersPaymentDetails(user);
    }
}
