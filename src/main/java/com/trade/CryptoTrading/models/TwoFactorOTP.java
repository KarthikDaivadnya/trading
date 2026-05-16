package com.trade.CryptoTrading.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class TwoFactorOTP {
    @Id
    private String id;

    private String otp;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String jwt;

    @ManyToOne  // ✅ Properly map the relationship
    @JoinColumn(name = "user_id")  // ✅ Foreign key column
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private User user;
}
