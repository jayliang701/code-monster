package NAMESPACE;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.ugeez.commons.mybatisplus.entity.AbstractEntity;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
@TableName(value = "tb_TABLE_NAME", resultMap = "TABLE_NAME_result_map")
public class FILE_NAME extends AbstractEntity<FILE_NAME> {

    private Long userId;

    /**
     * 其他业务数据
     */
    @TableField(typeHandler= JacksonTypeHandler.class)
    private Map<String, Object> biz;
}
