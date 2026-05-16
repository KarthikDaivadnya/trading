package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.domain.VerificationType;
import com.trade.CryptoTrading.models.User;

public interface UserService {
    public User findUserProfileByJwt(String jwt) throws Exception;
    public User findUserByEmail(String email) throws Exception;
    public User findUserById(Long userId) throws Exception;

    public User enableTwofactorAuthentication(VerificationType verificationType,String sendTo,User user);

    User updatePassword(User user, String newPassword);

}
