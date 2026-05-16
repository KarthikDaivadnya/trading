package com.trade.CryptoTrading.request;

import com.trade.CryptoTrading.domain.OrderType;
import lombok.Data;

@Data
public class CreateOrderRequest {
     private String coinId;
     private OrderType orderType;
     private double quantity;
}
