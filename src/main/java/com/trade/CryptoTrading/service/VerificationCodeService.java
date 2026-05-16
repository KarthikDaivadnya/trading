package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.domain.VerificationType;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.models.VerificationCode;

public interface VerificationCodeService {
    VerificationCode sendVerificationCode(User user, VerificationType verificationType);

    VerificationCode getVerificationCodeById(Long id) throws Exception;

    VerificationCode getVerficationCodeByUser(Long userId);


    void deleteVerificationCodeById(VerificationCode verificationCode);
}
