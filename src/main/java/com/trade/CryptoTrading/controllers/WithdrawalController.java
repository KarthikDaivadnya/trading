package com.trade.CryptoTrading.controllers;

import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.models.Wallet;
import com.trade.CryptoTrading.models.WalletTransaction;
import com.trade.CryptoTrading.models.Withdrawal;
import com.trade.CryptoTrading.service.UserService;
import com.trade.CryptoTrading.service.WalletService;
import com.trade.CryptoTrading.service.WithdrawalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/withdrawal")
public class WithdrawalController {

    @Autowired
    private WithdrawalService withdrawalService;

    @Autowired
    private UserService userService;

    @Autowired
    private WalletService walletService;

    @PostMapping("/api/withdrawal/{amount}")
    public ResponseEntity<?> requestWithdrawal(@RequestParam Long userId,
                                      @PathVariable Long amount) throws Exception {
        User user = userService.findUserById(userId);
        Wallet userWallet = walletService.getUserWallet(user);

        Withdrawal withdrawal = withdrawalService.requestWithdrawal(amount,user);
        walletService.addBalance(userWallet, -withdrawal.getAmount());

        return new ResponseEntity<>(withdrawal, HttpStatus.OK);
    }

    @PutMapping("/api/admin/withdrawal/{id}/proceed/{accept}")
    public ResponseEntity<?> proceedWithdrawal(@RequestHeader("Authorization") String jwt,@RequestParam Long withdrawalId,
                                      @RequestParam boolean accept) throws Exception {
           User user = userService.findUserProfileByJwt(jwt);
           Withdrawal withdrawal = withdrawalService.proceedWithdrawal(withdrawalId,accept);
           Wallet userWallet = walletService.getUserWallet(user);

           if(!accept){
               walletService.addBalance(userWallet,withdrawal.getAmount());
           }
           return new ResponseEntity<>(withdrawal,HttpStatus.OK);
    }

    @GetMapping("/api/withdrawal")
    public List<Withdrawal> getUserWithdrawalHistory(@RequestHeader("Authorization") String jwt) throws Exception {
        User user = userService.findUserProfileByJwt(jwt);
        return withdrawalService.getUsersWithdrawalHistory(user);
    }

    @GetMapping("/all")
    public List<Withdrawal> getAllWithdrawalRequests() {
        return withdrawalService.getAllWithdrawalRequest();
    }
}
