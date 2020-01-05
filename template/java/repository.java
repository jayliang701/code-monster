package NAMESPACE;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.SelectProvider;
import org.apache.ibatis.annotations.Update;
import org.apache.ibatis.annotations.UpdateProvider;

import ENTITY_NAMESPACE;

public interface FILE_NAME {

    @SelectProvider(type = SQLProvider.class, method = "find")
    List<ENTITY_CLASS> find(@Param("filter") Map<String, Object> filter);

    @Select("select * from ENTITY_TABLE where id = #{id}")
    ENTITY_CLASS findById(String id);

    @UpdateProvider(type = SQLProvider.class, method = "update")
    public int update(@Param("ups") Map<String, Object> ups);

    @SelectProvider(type = SQLProvider.class, method = "updateById")
    public int updateById(@Param("id") String id, @Param("ups") Map<String, Object> ups);

    @Delete("delete from ENTITY_TABLE where id = #{id}")  
    ENTITY_CLASS deleteById(String id);
    
}