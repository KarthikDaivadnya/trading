package com.trade.CryptoTrading.controllers;

import com.trade.CryptoTrading.domain.OrderType;
import com.trade.CryptoTrading.models.Coin;
import com.trade.CryptoTrading.models.Order;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.request.CreateOrderRequest;
import com.trade.CryptoTrading.service.CoinService;
import com.trade.CryptoTrading.service.OrderService;
import com.trade.CryptoTrading.service.UserService;
import com.trade.CryptoTrading.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private CoinService coinService;

    @Autowired
    private UserService userService;

    @Autowired
    private WalletService walletService;

    // Process new order (Buy/Sell)
    @PostMapping("/pay")
    public ResponseEntity<Order> payOrderPayment(@RequestHeader("Authorization")String jwt, @RequestBody CreateOrderRequest req) throws Exception{
        User user = userService.findUserProfileByJwt(jwt);
        Coin coin = coinService.findById(req.getCoinId());

        Order order = orderService.processedOrder(coin,req.getQuantity(),req.getOrderType(),user);
        return ResponseEntity.ok(order);
    }
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderById(@RequestHeader("Authorization") String jwt,@PathVariable Long orderId) {
        try {
            Order order = orderService.getOrderById(orderId);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.status(404).body("Order not found: " + e.getMessage());
        }
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getAllOrdersForUser(@RequestHeader("Authorization") String jwt,@PathVariable Long userId,
                                                           @RequestParam(required = false) OrderType orderType,
                                                           @RequestParam(required = false) String assetSymbol) {
        List<Order> orders = orderService.getAllOrdersOfUser(userId, orderType, assetSymbol);
        return ResponseEntity.ok(orders);
    }
}
