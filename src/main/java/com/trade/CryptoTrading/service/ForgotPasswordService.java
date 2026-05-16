package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.domain.VerificationType;
import com.trade.CryptoTrading.models.ForgotPasswordToken;
import com.trade.CryptoTrading.models.User;

public interface ForgotPasswordService {
    ForgotPasswordToken createToken(User user, String id, String otp, VerificationType verificationType, String sendTo);

    ForgotPasswordToken findById(String id);

    ForgotPasswordToken findByUser(Long userId);

    void deleteToken(ForgotPasswordToken token);
}
