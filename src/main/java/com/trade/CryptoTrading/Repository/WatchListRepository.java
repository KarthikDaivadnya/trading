package com.trade.CryptoTrading.Repository;

import com.trade.CryptoTrading.models.WatchList;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchListRepository extends JpaRepository<WatchList,Long> {
    WatchList findByUserId(Long userId);

}
