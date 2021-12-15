package NAMESPACE;

import com.ugeez.commons.mybatisplus.service.IEnhanceService;
import ENTITY_NAMESPACE.ENTITY_NAME;

import java.util.*;

public interface ENTITY_NAMEService extends IEnhanceService<ENTITY_NAME> {

    ENTITY_NAME create(Long userId, Map<String, Object> biz);

    ENTITY_NAME getLatestByUserId(Long userId);
}

<JS>

function build(entityDef) {

    const { javaCode, imports, javaCodeLines, sql, entityName, props, tableName, rootNamespace, namespace } = entityDef;

    const utils = require('./utils');
    const { findClassDefineLine, findPackageDefineLine, findIdProp, findProp, findAnnotation, findImport } = require('./parser/tools/javaParser');

    let code = originalCode;

    let newCreateMethod = 'ENTITY_NAME create(';
    let tmp = [];
    let sep = ', ';
    if (props.length > 4) {
        sep = ',\n';
        for (let i = 0; i < '    ENTITY_NAME create('.length; i ++) {
            sep += ' ';
        }
    }
    for (let prop of props) {
        if (prop.field === 'id' || prop.field === 'deleted' || prop.field === 'createTime' ||prop.field === 'updateTime') continue;
        tmp.push(`${prop.javaType} ${prop.field}`);
    }
    newCreateMethod = `${newCreateMethod}${tmp.join(sep)});`;

    code = code.replace(`ENTITY_NAME create(Long userId, Map<String, Object> biz);`, newCreateMethod);
    
    let userIdProp = findProp(props, 'userId');
    if (!userIdProp) {
        code = code.replace(`ENTITY_NAME getLatestByUserId(Long userId);`, '');
    }

    for (let imp of imports) {
        if (imp.startsWith('java.') && !imp.startsWith('java.util.')) {
            code = code.replace(`import java.util.*;`, `import ${imp};\nimport java.util.*;`)
        }
    }
    
    return {
        code,
        entityDef,
    };
}

</JS>