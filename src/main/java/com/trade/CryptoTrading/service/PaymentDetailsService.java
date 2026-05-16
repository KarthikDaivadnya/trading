package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.models.PaymentDetails;
import com.trade.CryptoTrading.models.User;

public interface PaymentDetailsService {
    public PaymentDetails addPaymentDetails(String accountNumber, String accountHolderName, String ifsc, String bankName, User user);
    public PaymentDetails getUsersPaymentDetails(User user);

}
