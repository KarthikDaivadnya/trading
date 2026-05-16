package com.trade.CryptoTrading.Repository;

import com.trade.CryptoTrading.models.Coin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoinRepository extends JpaRepository<Coin,String> {

}
