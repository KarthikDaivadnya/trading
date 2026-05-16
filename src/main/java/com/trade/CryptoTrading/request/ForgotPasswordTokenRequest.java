package com.trade.CryptoTrading.request;

import com.trade.CryptoTrading.domain.VerificationType;
import lombok.Data;

@Data
public class ForgotPasswordTokenRequest {
    private String sendTo;
    private VerificationType verificationType;
}
