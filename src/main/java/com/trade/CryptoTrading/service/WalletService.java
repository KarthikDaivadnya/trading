package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.models.Order;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.models.Wallet;

public interface WalletService {
    Wallet getUserWallet(User user);
    Wallet addBalance(Wallet wallet,Long amount);
    Wallet findWalletById(Long id) throws Exception;
    Wallet walletToWalletTransaction(User sender, Wallet receiverWallet,Long amount) throws Exception;
    Wallet payOrderPayment(Order order, User user) throws Exception;
}
