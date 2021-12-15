package NAMESPACE;

import com.ugeez.commons.mybatisplus.dao.EnhanceBaseMapper;
import ENTITY_NAMESPACE.ENTITY_NAME;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ENTITY_NAMEMapper extends EnhanceBaseMapper<ENTITY_NAME> {
    //MAPPER METHODS BEGINE
    ENTITY_NAME selectLatestByUserId(@Param("userId") Long userId);
    //MAPPER METHODS END
}

<JS>

function build(entityDef) {

    const { javaCode, imports, javaCodeLines, sql, entityName, props, tableName, rootNamespace, namespace } = entityDef;

    const utils = require('./utils');
    const { findClassDefineLine, findPackageDefineLine, findIdProp, findProp, findAnnotation, findImport } = require('./parser/tools/javaParser');

    let code = originalCode;
    
    let userIdProp = findProp(props, 'userId');
    if (!userIdProp) {
        code = code.replace(`ENTITY_NAME selectLatestByUserId(@Param("userId") Long userId);`, '');
    }
    
    return {
        code,
        entityDef,
    };
}

</JS>