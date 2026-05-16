package com.trade.CryptoTrading.Repository;

import com.trade.CryptoTrading.models.ForgotPasswordToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForgotPasswordRepository extends JpaRepository<ForgotPasswordToken,Long> {
    ForgotPasswordToken findByUserId(Long userId);
    ForgotPasswordToken findById(String id);

}
