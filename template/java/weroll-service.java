package com.magicfish.web.api;

import com.magicfish.weroll.annotation.API;
import com.magicfish.weroll.annotation.Method;
import com.magicfish.weroll.annotation.Param;
import com.magicfish.weroll.exception.ServiceException;
import com.magicfish.weroll.net.APIAction;
import com.magicfish.web.model.User;
import com.magicfish.web.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;

@API(name = "user")
public class UserAPI {

    @Autowired
    private UserService userService;

    @Method(name = "login",
            params = {
                    @Param(name = "username", type = "string"),
                    @Param(name = "password", type = "string")
            })
    public Object login(String username, String password, APIAction request) throws ServiceException {
        String token = null;
        try {
            token = userService.login(username, password);
            return token;
        } catch (Exception e) {
            throw ServiceException.wrapper(e);
        }
    }

}
