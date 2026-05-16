package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.domain.OrderType;
import com.trade.CryptoTrading.models.Coin;
import com.trade.CryptoTrading.models.Order;
import com.trade.CryptoTrading.models.OrderItem;
import com.trade.CryptoTrading.models.User;

import java.util.List;

public interface OrderService {
    Order createOrder(User user, OrderItem orderItem, OrderType orderType);
    Order getOrderById(Long orderId) throws Exception;
    List<Order> getAllOrdersOfUser(Long userId,OrderType OrderType,String assetSymbol);
    Order processedOrder(Coin coin,double quantity,OrderType orderType,User user) throws Exception;


}
