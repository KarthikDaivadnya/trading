package com.trade.CryptoTrading.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "cryptocurrency")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Coin {

        @Id
        @JsonProperty("id")
        private String id;

        @JsonProperty("symbol")
        private String symbol;

        @JsonProperty("name")
        private String name;

        @JsonProperty("image")
        private String image;

        @JsonProperty("current_price")
        private BigDecimal currentPrice;

        @JsonProperty("market_cap")
        private BigDecimal marketCap;

        @JsonProperty("market_cap_rank")
        private Integer marketCapRank;

        @JsonProperty("fully_diluted_valuation")
        private BigDecimal fullyDilutedValuation;

        @JsonProperty("total_volume")
        private BigDecimal totalVolume;

        @JsonProperty("high_24h")
        private BigDecimal high24h;

        @JsonProperty("low_24h")
        private BigDecimal low24h;

        @JsonProperty("price_change_24h")
        private BigDecimal priceChange24h;

        @JsonProperty("price_change_percentage_24h")
        private BigDecimal priceChangePercentage24h;

        @JsonProperty("market_cap_change_24h")
        private BigDecimal marketCapChange24h;

        @JsonProperty("market_cap_change_percentage_24h")
        private BigDecimal marketCapChangePercentage24h;

        @JsonProperty("circulating_supply")
        private BigDecimal circulatingSupply;

        @JsonProperty("total_supply")
        private BigDecimal totalSupply;

        @JsonProperty("max_supply")
        private BigDecimal maxSupply;

        @JsonProperty("ath")
        private BigDecimal ath;

        @JsonProperty("ath_change_percentage")
        private BigDecimal athChangePercentage;

        @JsonProperty("ath_date")
        private Instant athDate;

        @JsonProperty("atl")
        private BigDecimal atl;

        @JsonProperty("atl_change_percentage")
        private BigDecimal atlChangePercentage;

        @JsonProperty("atl_date")
        private Instant atlDate;

        @JsonProperty("last_updated")
        private Instant lastUpdated;
}
