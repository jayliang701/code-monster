package NAMESPACE;

import com.ugeez.commons.mybatisplus.dao.EnhanceBaseMapper;
import ENTITY_NAMESPACE.ENTITY_NAME;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ENTITY_NAMEMapper extends EnhanceBaseMapper<ENTITY_NAME> {

    ENTITY_NAME selectLatestByUserId(@Param("userId") Long userId);

}