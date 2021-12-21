package NAMESPACE;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FILE_NAMEDto {
    //DTO PROPS BEGINE
    private Long id;

    private Long userId;

    /**
     * 其他业务数据
     */
    private Map<String, Object> biz;
    //DTO PROPS END
}

<JS>

function build(entityDef) {

    const { javaCode, imports, javaCodeLines, sql, entityName, props, tableName, rootNamespace, namespace } = entityDef;

    const { findClassDefineLine, findPackageDefineLine, findIdProp, findAnnotation, findImport } = require('./parser/tools/javaParser');

    let code = originalCode;
    let classDefLineIndex = findClassDefineLine(javaCodeLines);
    let classDefLine = javaCodeLines[classDefLineIndex];

    let packageDefLineIndex = findPackageDefineLine(javaCodeLines);
    let packageDefLine = javaCodeLines[packageDefLineIndex];

    let propLines = [];

    for (let prop of props) {
        if (prop.field === 'deleted') continue;
        let comment = prop.label;
        propLines.push(`${comment ? `\/\/${comment}\n    ` : ''}private ${prop.javaType} ${prop.field};`);
    }

    for (let imp of imports) {
        if (imp.startsWith('java.') && !imp.startsWith('java.util.')) {
            code = code.replace(`import java.util.*;`, `import ${imp};\nimport java.util.*;`)
        }
    }

    code = code.substr(0, code.indexOf(`//DTO PROPS BEGINE`)) + '\n    ' + propLines.join('\n\n    ') + '\n' + code.substr(code.indexOf('//DTO PROPS END'));

    return {
        code,
        entityDef,
    };
}

</JS>
