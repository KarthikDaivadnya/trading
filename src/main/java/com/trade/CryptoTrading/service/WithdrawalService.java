package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.models.Withdrawal;

import java.util.List;

public interface WithdrawalService  {
    Withdrawal requestWithdrawal(Long amount, User user);
    Withdrawal proceedWithdrawal(Long withdrawlId,boolean accept) throws Exception;

    List<Withdrawal> getUsersWithdrawalHistory(User user);

    List<Withdrawal> getAllWithdrawalRequest();
}
