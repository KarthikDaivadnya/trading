package com.trade.CryptoTrading.service;

import com.trade.CryptoTrading.Repository.OrderItemRepository;
import com.trade.CryptoTrading.Repository.OrderRepository;
import com.trade.CryptoTrading.domain.OrderStatus;
import com.trade.CryptoTrading.domain.OrderType;
import com.trade.CryptoTrading.models.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.expression.ExpressionException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService{
@Autowired
private OrderRepository orderRepository;

@Autowired
private AssetService assetService;

@Autowired
private OrderItemRepository orderItemRepository;



@Autowired
private WalletService walletService;
    @Override
    public Order createOrder(User user, OrderItem orderItem, OrderType orderType) {
        double price = orderItem.getCoin()
                .getCurrentPrice()
                .multiply(BigDecimal.valueOf(orderItem.getQuantity()))
                .doubleValue();
             Order order = new Order();
             order.setUser(user);
             order.setOrderItem(orderItem);
             order.setOrderType(orderType);
             order.setPrice(BigDecimal.valueOf(price));
             order.setTimeStamp(LocalDateTime.now());
             order.setStatus(OrderStatus.PENDING);
             return orderRepository.save(order);

    }

    @Override
    public Order getOrderById(Long orderId) throws Exception {
       return orderRepository.findById(orderId).orElseThrow(()->new Exception("Order not found"));
    }

    @Override
    public List<Order> getAllOrdersOfUser(Long userId, OrderType OrderType, String assetSymbol) {
        return orderRepository.findByUserId(userId);
    }
   private OrderItem createOrderItem(Coin coin,double quantity,double buyPrice,double sellPrice){
        OrderItem orderItem = new OrderItem();
        orderItem.setCoin(coin);
        orderItem.setQuantity(quantity);
        orderItem.setBuyPrice(buyPrice);
        orderItem.setSellPrice(sellPrice);
        return orderItemRepository.save(orderItem);
   }
   @Transactional
   private Order buyAsset(Coin coin,double quantity,User user) throws Exception {
        if(quantity<=0){
            throw new Exception("quantity should be > 0");
        }
        double buyPrice = coin.getCurrentPrice().doubleValue();;
        OrderItem orderItem = createOrderItem(coin,quantity,buyPrice,0);
        Order order = createOrder(user,orderItem,OrderType.BUY);
        orderItem.setOrder(order);
        walletService.payOrderPayment(order,user);
        order.setStatus(OrderStatus.SUCCESS);
        order.setOrderType(OrderType.BUY);
        Order savedOrder = orderRepository.save(order);
         Asset oldAsset = assetService.findAssetByUserIdAndCoinId(order.getUser().getId(),order.getOrderItem().getCoin().getId());
         if(oldAsset==null){
             assetService.createAsset(user,orderItem.getCoin(),orderItem.getQuantity());
         }
         else{
             assetService.updateAsset(oldAsset.getId(),quantity);
         }
        return savedOrder;
   }
    @Transactional
    private Order sellAsset(Coin coin,double quantity,User user) throws Exception {
        if(quantity<=0){
            throw new Exception("quantity should be > 0");
        }
        Asset assetToSell = assetService.findAssetByUserIdAndCoinId(user.getId(),coin.getId());
        double buyPrice = assetToSell.getBuyPrice();
        double sellPrice = coin.getCurrentPrice().doubleValue();;
        if(assetToSell!=null){
            OrderItem orderItem = createOrderItem(coin,quantity,buyPrice,sellPrice);



        Order order = createOrder(user,orderItem,OrderType.SELL);
        orderItem.setOrder(order);
        if(assetToSell.getQuantity()>=quantity){
            order.setStatus(OrderStatus.SUCCESS);
            order.setOrderType(OrderType.SELL);
            Order savedOrder = orderRepository.save(order);
            walletService.payOrderPayment(order,user);
            Asset updatedAsset = assetService.updateAsset(
                    assetToSell.getId(),-quantity
            );
            BigDecimal totalValue = BigDecimal.valueOf(updatedAsset.getQuantity())
                    .multiply(coin.getCurrentPrice());

            if (totalValue.compareTo(BigDecimal.ONE) <= 0) {
                assetService.deleteAsset(updatedAsset.getId());
            }
            return savedOrder;
        }
        throw new Exception("Insufficient quantity to sell");
}
        throw new Exception("asset not found");

    }
    @Transactional
    @Override
    public Order processedOrder(Coin coin, double quantity, OrderType orderType, User user) throws Exception {
       if(orderType.equals(OrderType.BUY)){
           return buyAsset(coin,quantity,user);
       }
       else if(orderType.equals(OrderType.SELL)){
              return sellAsset(coin,quantity,user);
       }
       throw  new Exception("Invalid order type");
    }
}
