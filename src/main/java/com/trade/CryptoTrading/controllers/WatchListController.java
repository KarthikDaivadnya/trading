package com.trade.CryptoTrading.controllers;

import com.trade.CryptoTrading.models.Coin;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.models.WatchList;
import com.trade.CryptoTrading.service.UserService;
import com.trade.CryptoTrading.service.WatchListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/watchlist")
public class WatchListController {

    @Autowired
    private WatchListService watchListService;

    @Autowired
    private UserService userService;

    @GetMapping("/{userId}")
    public WatchList getUserWatchList(@PathVariable Long userId) throws Exception {
        return watchListService.findUserWatchList(userId);
    }

    @PostMapping("/create")
    public WatchList createWatchList(@RequestParam Long userId) throws Exception {
        User user = userService.findUserById(userId);
        return watchListService.createWatchList(user);
    }

    @GetMapping("/id/{id}")
    public WatchList getWatchListById(@PathVariable Long id) throws Exception {
        return watchListService.findById(id);
    }

    @PostMapping("/add/coin")
    public Coin addCoinInWatchList(@RequestParam Long userId,
                                      @RequestBody Coin coin) throws Exception {
        User user = userService.findUserById(userId);
        return watchListService.addItemWatchList(coin, user);
    }
}
