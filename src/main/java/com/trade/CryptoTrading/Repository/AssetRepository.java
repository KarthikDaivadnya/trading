package com.trade.CryptoTrading.Repository;

import com.trade.CryptoTrading.models.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    List<Asset> findByUserId(Long userId);

    @Query("SELECT a FROM Asset a WHERE a.user.id = :userId AND a.coin.id = :coinId")
    Asset findByUserIdAndCoinId(@Param("userId") Long userId, @Param("coinId") String coinId);

    @Query("SELECT a FROM Asset a WHERE a.user.id = :userId AND a.id = :assetId")
    Asset findByUserIdAndId(@Param("userId") Long userId, @Param("assetId") Long assetId);

}