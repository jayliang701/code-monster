package NAMESPACE;

import com.alibaba.fastjson.JSONObject;
import com.magicfish.weroll.annotation.API;
import com.magicfish.weroll.annotation.Method;
import com.magicfish.weroll.annotation.Param;
import com.magicfish.weroll.exception.ServiceException;
import com.magicfish.weroll.net.APIAction;
import com.magicfish.weroll.net.HttpAction;
import org.springframework.beans.factory.annotation.Autowired;

@API(name = "SERVICE_NAME_GROUP")
public class SERVICE_NAMEAPI {

    @Autowired
    private SomeService someService;

    @Method(needLogin = true)
    public Object info(HttpAction action) throws Exception {
        String userId = action.getUserPayload().getId();
        return userId;
    }

    @Method(needLogin = true)
    public Object echo(String name,
                       Integer age,
                       @Param(defaultValue = "{ \"city\":\"Shanghai\", \"country\":\"China\" }") LocationParam location,
                       @Param(defaultValue = "[]", required = false) String[] tags,
                       APIAction action) throws ServiceException {
        JSONObject result = new JSONObject();
        result.put("name", name);
        result.put("age", age);
        result.put("tags", tags);
        result.put("location", location);

        // action.isLogined()  // boolean, user logined or not
        // action.getUserPayload().getId()   // If logined, then we can get user's id. Otherwise getUserPayload() will return null.

        // action.getPostBody().getData()     // Get full post data

        return result;
    }

}
