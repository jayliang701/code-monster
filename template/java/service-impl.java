package NAMESPACE;

import com.ugeez.commons.mybatisplus.service.impl.AbstractServiceImpl;
import INTERFACE_NAMESPACE.ENTITY_NAMEService;
import MAPPER_NAMESPACE.ENTITY_NAMEMapper;
import ENTITY_NAMESPACE.ENTITY_NAME;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ENTITY_NAMEServiceImpl extends AbstractServiceImpl<ENTITY_NAMEMapper, ENTITY_NAME> implements ENTITY_NAMEService {

    /*+ create +*/
    @Override
    public ENTITY_NAME create(Long userId, Map<String, Object> biz) {
        ENTITY_NAME doc = new ENTITY_NAME();
        doc.setUserId(userId);
        if (biz == null) {
            biz = new HashMap<>();
        }
        doc.setBiz(biz);

        this.save(doc);

        return doc;
    }
    /*- create -*/

    /*+ getLatestByUserId +*/
    @Override
    public ENTITY_NAME getLatestByUserId(Long userId) {
        return this.baseMapper.selectLatestByUserId(userId);
    }
    /*- getLatestByUserId -*/

}

<JS>

function build(entityDef) {

    const { javaCode, imports, javaCodeLines, sql, entityName, props, tableName, rootNamespace, namespace } = entityDef;

    const utils = require('./utils');
    const { findClassDefineLine, findPackageDefineLine, findIdProp, findProp, findAnnotation, findImport } = require('./parser/tools/javaParser');

    let code = originalCode;

    let newCreateMethod = '@Override\n    public ENTITY_NAME create(';
    let tmp = [];
    let sep = ', ';
    let indent = '        ';
    if (props.length > 4) {
        sep = ',\n';
        for (let i = 0; i < '    public ENTITY_NAME create('.length; i ++) {
            sep += ' ';
        }
    }
    for (let prop of props) {
        if (prop.field === 'id' || prop.field === 'deleted' || prop.field === 'createTime' ||prop.field === 'updateTime') continue;
        tmp.push(`${prop.javaType} ${prop.field}`);
    }
    newCreateMethod = `${newCreateMethod}${tmp.join(sep)}) {\n${indent}ENTITY_NAME doc = new ENTITY_NAME();\n`;

    for (let prop of props) {
        if (prop.field === 'id' || prop.field === 'deleted' || prop.field === 'createTime' ||prop.field === 'updateTime') continue;
        let param = prop.field;
        if (prop.type === 'map') {
            param = `${prop.field} == null ? new HashMap<>() : ${prop.field}`;
        } else if (prop.type === 'list') {
            param = `${prop.field} == null ? new ArrayList<>() : ${prop.field}`;
        }
        newCreateMethod += `${indent}doc.set${prop.field.charAt(0).toUpperCase() + prop.field.substr(1)}(${param});\n`;
    }

    newCreateMethod += `${indent}this.save(doc);\n${indent}return doc;\n    }`;

    // code = code.replace(`ENTITY_NAME create(Long userId, Map<String, Object> biz);`, newCreateMethod);

    let createStartIndex = code.indexOf('/*+ create +*/');
    code = code.substr(0, createStartIndex) + newCreateMethod + code.substr(code.indexOf('/*- create -*/') + 16);
    
    let userIdProp = findProp(props, 'userId');
    if (!userIdProp) {
        code = code.substr(0, code.indexOf(`/*+ getLatestByUserId +*/`)) + code.substr(code.indexOf('/*- getLatestByUserId -*/'));
    }
    
    code = code.replace(`/*+ getLatestByUserId +*/`, '').replace(`/*- getLatestByUserId -*/`, '');

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
