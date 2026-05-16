package com.trade.CryptoTrading.models;

import com.trade.CryptoTrading.domain.OrderStatus;
import com.trade.CryptoTrading.domain.OrderType;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "orders")
public class Order {
    @Id
   @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
     @ManyToOne
    private User user;

     @Column(nullable = false)
     private OrderType orderType;

     @Column(nullable = false)
     private BigDecimal price;

     private LocalDateTime timeStamp = LocalDateTime.now();

     @Column(nullable = false)
     private OrderStatus status;

     @OneToOne(mappedBy = "order",cascade = CascadeType.ALL)
    private OrderItem orderItem;
}
