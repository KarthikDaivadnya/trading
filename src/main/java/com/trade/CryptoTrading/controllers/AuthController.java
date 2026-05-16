package com.trade.CryptoTrading.controllers;

import com.trade.CryptoTrading.Repository.UserRepository;
import com.trade.CryptoTrading.config.JwtProvider;
import com.trade.CryptoTrading.models.TwoFactorOTP;
import com.trade.CryptoTrading.models.User;
import com.trade.CryptoTrading.response.AuthResponse;
import com.trade.CryptoTrading.service.CustomUserDetailsService;
import com.trade.CryptoTrading.service.EmailService;
import com.trade.CryptoTrading.service.TwoFactorOtpService;
import com.trade.CryptoTrading.utils.OtpUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import java.lang.Exception;
import java.sql.SQLException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;

@RestController
@RequestMapping("/auth")
public class AuthController {
@Autowired
    private UserRepository userRepository;
@Autowired
private CustomUserDetailsService customUserDetailsService;
@Autowired
private EmailService emailService;

@Autowired
    TwoFactorOtpService twoFactorOtpService;




@PostMapping("/signup")
    public ResponseEntity<AuthResponse> register(@RequestBody User user) throws Exception {

          User isEmailExist = userRepository.findByEmail(user.getEmail());
          if(isEmailExist!=null){
              throw new Exception("Email is already registered with another account");
          }
    User newUser = new User();
    newUser.setEmail(user.getEmail());
    newUser.setFullName(user.getFullName());
    newUser.setPassword(user.getPassword());
    newUser.setMobile(user.getMobile());

          User savedUser = userRepository.save(newUser);
    Authentication authentication = new UsernamePasswordAuthenticationToken(
            user.getEmail(),
           user.getPassword()
            );
    SecurityContextHolder.getContext().setAuthentication(authentication);
    String jwt = JwtProvider.generateToken(authentication);

    AuthResponse res = new AuthResponse();
    res.setJwt(jwt);
    res.setStatus(true);
    res.setMessage("registration successful");

          return new ResponseEntity<>(res, HttpStatus.CREATED);
    }
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody User user) throws Exception {

        String userName = user.getEmail();
        String password = user.getPassword();

        Authentication authentication = authenticate(userName,password);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = JwtProvider.generateToken(authentication);

        User authUser = userRepository.findByEmail(userName);

        if(user.getTwoFactorAuth().isEnabled()){
          AuthResponse res = new AuthResponse();
          res.setMessage("Two factor enabled");
          res.setTwoFactorAuthEnabled(true);
          String otp = OtpUtils.generateOtp();

            TwoFactorOTP oldTwoFactorOPT = twoFactorOtpService.findByUser(authUser.getId());

            if(oldTwoFactorOPT!=null){
                twoFactorOtpService.deleteTwoFactorOtp(oldTwoFactorOPT);
            }
            TwoFactorOTP newTwoFactorOTP = twoFactorOtpService.createTwoFactorOtp(authUser,otp,jwt);

            emailService.sendVerificationOtpEmail(userName,otp);
            res.setSession(newTwoFactorOTP.getId());
            return new ResponseEntity<>(res,HttpStatus.ACCEPTED);
        }
        AuthResponse res = new AuthResponse();
        res.setJwt(jwt);
        res.setStatus(true);
        res.setMessage("Login successful");

        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    private Authentication authenticate(String userName, String password) throws Exception {
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(userName);

        if(userDetails==null){
            throw new Exception("Invalid username");
        }
        if(!password.equals(userDetails.getPassword())){
            throw new Exception("Invalid password");
        }
        return new UsernamePasswordAuthenticationToken(userName,password,userDetails.getAuthorities());
    }

        @PostMapping("/two-factor/otp/{otp}")
        public ResponseEntity<AuthResponse> verifySigninOtp(@PathVariable String otp,@RequestParam String id) throws Exception {
                   TwoFactorOTP twoFactorOTP = twoFactorOtpService.findById(id);
                   if(twoFactorOtpService.verifyTwoFactorOtp(twoFactorOTP,otp)){
                       AuthResponse res = new AuthResponse();
                       res.setMessage("Two factor authentication verified");
                       res.setTwoFactorAuthEnabled(true);
                       res.setJwt(twoFactorOTP.getJwt());
                       return new ResponseEntity<>(res,HttpStatus.OK);
                   }
                   throw new Exception("invalid otp");
        }
}
