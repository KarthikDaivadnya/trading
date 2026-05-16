package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.models.Coin;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.models.WatchList;

public interface WatchListService {
    WatchList findUserWatchList(Long userId) throws Exception;
    WatchList  createWatchList(User user);
    WatchList findById(Long id) throws Exception;

    Coin addItemWatchList(Coin coin,User user);


}
