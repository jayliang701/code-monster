package NAMESPACE;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class FILE_NAMEDto {

    private Long userId;

    /**
     * 其他业务数据
     */
    private Map<String, Object> biz;
}
