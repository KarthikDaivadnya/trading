package com.trade.CryptoTrading.Repository;

import com.trade.CryptoTrading.models.User;
import org.springframework.data.jpa.repository.JpaRepository;


public interface UserRepository extends JpaRepository<User,Long> {
 User findByEmail(String email);
}
