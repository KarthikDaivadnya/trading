package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.Repository.AssetRepository;
import com.trade.CryptoTrading.models.Asset;
import com.trade.CryptoTrading.models.Coin;
import com.trade.CryptoTrading.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssetServiceImpl implements AssetService {

    @Autowired
    private AssetRepository assetRepository;

    @Override
    public Asset createAsset(User user, Coin coin, double quantity) {
        Asset asset = new Asset();
        asset.setUser(user);
        asset.setCoin(coin);
        asset.setQuantity(quantity);

        // FIX 1: null check on getCurrentPrice()
        double price = (coin.getCurrentPrice() != null)
                ? coin.getCurrentPrice().doubleValue()
                : 0.0;
        asset.setBuyPrice(price);

        return assetRepository.save(asset);
    }

    @Override
    public Asset getAssetById(Long assetId) throws Exception {
        return assetRepository.findById(assetId)
                .orElseThrow(() -> new Exception("Asset not found with id: " + assetId));
    }

    @Override
    public Asset getAssetByUserIdAndId(Long userId, Long assetId) {
        // FIX 2: was returning null — now actually queries the DB
        return assetRepository.findByUserIdAndId(userId, assetId);
    }

    @Override
    public List<Asset> getUsersAssets(Long userId) {
        return assetRepository.findByUserId(userId);
    }

    @Override
    public Asset updateAsset(Long assetId, double quantity) throws Exception {
        Asset oldAsset = getAssetById(assetId);
        // FIX 3: add quantity, don't replace it (for buy more scenarios)
        oldAsset.setQuantity(oldAsset.getQuantity() + quantity);
        return assetRepository.save(oldAsset);
    }

    @Override
    public Asset findAssetByUserIdAndCoinId(Long userId, String coinId) {
        // FIX 4: added null safety log
        Asset asset = assetRepository.findByUserIdAndCoinId(userId, coinId);
        return asset; // returns null cleanly if not found — caller must null-check
    }

    @Override
    public void deleteAsset(Long assetId) {
        assetRepository.deleteById(assetId);
    }
}