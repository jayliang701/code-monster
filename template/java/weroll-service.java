package NAMESPACE;

import com.magicfish.weroll.annotation.API;
import com.magicfish.weroll.annotation.Method;
import com.magicfish.weroll.annotation.Param;
import com.magicfish.weroll.exception.ServiceException;
import com.magicfish.weroll.net.APIAction;
import org.springframework.beans.factory.annotation.Autowired;

@API(name = "SERVICE_NAME_GROUP")
public class SERVICE_NAMEAPI {

    @Autowired
    private SomeService someService;

    @Method(name = "echo",
            needLogin = false,
            params = {
                    @Param(name = "name", type = "string"),
                    @Param(name = "msg", type = "string")
            })
    public Object echo(String name, String msg, APIAction action) throws Exception {
        String content = someService.buildContent(name, msg);
        return content;
    }

    @Method(name = "info",
            needLogin = true,
            params = {
                   
            })
    public Object info(APIAction action) throws Exception {
        String userId = action.getUserPayload().getId();
        return userId;
    }

}
