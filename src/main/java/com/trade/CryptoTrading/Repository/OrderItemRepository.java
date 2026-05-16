package com.trade.CryptoTrading.Repository;

import com.trade.CryptoTrading.models.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem,Long> {

}
