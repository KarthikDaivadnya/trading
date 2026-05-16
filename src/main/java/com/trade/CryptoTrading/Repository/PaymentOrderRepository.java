package com.trade.CryptoTrading.Repository;

import com.trade.CryptoTrading.models.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentOrderRepository extends JpaRepository<PaymentOrder,Long> {
}
