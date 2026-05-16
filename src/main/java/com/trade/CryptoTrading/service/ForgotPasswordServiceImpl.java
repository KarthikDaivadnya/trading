package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.Repository.ForgotPasswordRepository;
import com.trade.CryptoTrading.domain.VerificationType;
import com.trade.CryptoTrading.models.ForgotPasswordToken;
import com.trade.CryptoTrading.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.util.Optional;

@Service
public class ForgotPasswordServiceImpl implements ForgotPasswordService{
@Autowired
    private ForgotPasswordRepository passwordRepository;

    @Override
    public ForgotPasswordToken createToken(User user, String id, String otp, VerificationType verificationType, String sendTo) {
        ForgotPasswordToken token = new ForgotPasswordToken();
        token.setUser(user);
        token.setSendTo(sendTo);
        token.setOtp(otp);
        token.setId(id);
        return passwordRepository.save(token);
    }

    @Override
    public ForgotPasswordToken findById(String id) {
        Optional<ForgotPasswordToken> token = Optional.ofNullable(passwordRepository.findById(id));
        return token.orElse(null);
    }

    @Override
    public ForgotPasswordToken findByUser(Long userId) {
        return passwordRepository.findByUserId(userId);
    }

    @Override
    public void deleteToken(ForgotPasswordToken token) {
       passwordRepository.delete(token);
    }
}
