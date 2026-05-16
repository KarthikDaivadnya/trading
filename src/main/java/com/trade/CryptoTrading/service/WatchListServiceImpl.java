package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.Repository.WatchListRepository;
import com.trade.CryptoTrading.models.Coin;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.models.WatchList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class WatchListServiceImpl implements WatchListService{
    @Autowired
    private WatchListRepository watchListRepository;
    @Override
    public WatchList findUserWatchList(Long userId) throws Exception {
        WatchList watchList = watchListRepository.findByUserId(userId);
        if(watchList==null){
            throw new Exception("watchlist not found");
        }
        return watchList;
    }

    @Override
    public WatchList createWatchList(User user) {
        WatchList watchList = new WatchList();
        watchList.setUser(user);

        return watchListRepository.save(watchList);
    }

    @Override
    public WatchList findById(Long id) throws Exception {
        Optional<WatchList> optionalWatchList = watchListRepository.findById(id);
        if(optionalWatchList.isEmpty()){
            throw new Exception("watchlist not found");
        }
        return optionalWatchList.get();
    }

    @Override
    public Coin addItemWatchList(Coin coin, User user) {
       WatchList watchList = watchListRepository.findByUserId(user.getId());
       if(watchList.getCoins().contains(coin)){
           watchList.getCoins().remove(coin);
       }
       else{
           watchList.getCoins().add(coin);
       }
       watchListRepository.save(watchList);
       return coin;
    }
}
