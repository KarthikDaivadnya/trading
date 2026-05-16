package com.trade.CryptoTrading.controllers;

import com.trade.CryptoTrading.models.Asset;
import com.trade.CryptoTrading.models.Coin;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.service.AssetService;
import com.trade.CryptoTrading.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asset")
public class AssetController {

    @Autowired
    private AssetService assetService;

    @Autowired
    private UserService userService;

    @PostMapping("/create")
    public Asset createAsset(@RequestParam Long userId,
                             @RequestBody Coin coin,
                             @RequestParam double quantity) throws Exception {
        User user = userService.findUserById(userId);
        return assetService.createAsset(user, coin, quantity);
    }

    @GetMapping("/{assetId}")
    public Asset getAssetById(@PathVariable Long assetId) throws Exception {
        return assetService.getAssetById(assetId);
    }

    @GetMapping("/user/{userId}")
    public List<Asset> getUsersAssets(@PathVariable Long userId) {
        return assetService.getUsersAssets(userId);
    }

    @PutMapping("/update")
    public Asset updateAsset(@RequestParam Long assetId,
                             @RequestParam double quantity) throws Exception {
        return assetService.updateAsset(assetId, quantity);
    }

    @GetMapping("/find")
    public Asset findAssetByUserIdAndCoinId(@RequestParam Long userId,
                                            @RequestParam String coinId) {
        return assetService.findAssetByUserIdAndCoinId(userId, coinId);
    }

    @DeleteMapping("/delete/{assetId}")
    public void deleteAsset(@PathVariable Long assetId) {
        assetService.deleteAsset(assetId);
    }
}
