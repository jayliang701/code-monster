package NAMESPACE;

import ENTITY_NAMESPACE;

import org.apache.ibatis.annotations.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FILE_NAME {

    @SelectProvider(type = SqlProvider.class, method = "getStatement")
    List<ENTITY_CLASS> find(@Param("statement") String statement);

    @Select("select * from ENTITY_TABLE where id = #{id}")
    ENTITY_CLASS findById(String id);

    @UpdateProvider(type = SqlProvider.class, method = "getStatement")
    int update(@Param("statement") String statement);

    @DeleteProvider(type = SqlProvider.class, method = "getStatement")
    int delete(@Param("statement") String statement);
}