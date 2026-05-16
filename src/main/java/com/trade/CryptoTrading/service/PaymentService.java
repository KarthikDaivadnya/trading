package com.trade.CryptoTrading.service;

import com.razorpay.RazorpayException;
import com.trade.CryptoTrading.domain.PaymentMethod;
import com.trade.CryptoTrading.models.PaymentOrder;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.response.PaymentResponse;

public interface PaymentService {
    PaymentOrder createOrder(User user, Long amount, PaymentMethod paymentMethod);
    PaymentOrder getPaymentOrderById(Long id) throws Exception;
    Boolean ProceedPaymentOrder(PaymentOrder paymentOrder, String paymentId) throws RazorpayException;
    PaymentResponse createRazorpayPaymentLink(User user, Long amount);
    PaymentResponse createStripePaymentLink(User user,Long amount,Long orderId);
}
