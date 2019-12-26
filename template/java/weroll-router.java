package NAMESPACE;

import com.magicfish.weroll.annotation.Param;
import com.magicfish.weroll.annotation.Router;
import com.magicfish.weroll.annotation.RouterGroup;
import com.magicfish.weroll.net.PageAction;
import org.springframework.ui.Model;

@RouterGroup
public class FILE_NAME {

    @Router(path = "/", needLogin = false)
    public void renderIndexPage(Model model, PageAction action) {
        // String userId = action.getUserPayload().getId();
    }

    @Router(
        path = "/user", 
        needLogin = false,
        params = {
            @Param(name = "id", type = "string")
        }
    )
    public void renderUserPage(String id, Model model, PageAction action) {
        model.addAttribute("msg", "The user id is " + id);
    }

}