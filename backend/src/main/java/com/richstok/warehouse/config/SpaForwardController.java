package com.richstok.warehouse.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping(value = {
            "/",
            "/login",
            "/b4b-access",
            "/admin",
            "/account",
            "/cart",
            "/products",
            "/products/{id}"
    })
    public String forwardToSpa() {
        return "forward:/index.html";
    }
}
