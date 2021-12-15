package NAMESPACE;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.*;

import java.util.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FILE_NAMEUpdateReq {
    //DTO PROPS BEGINE
    @NotNull
    private Long id;

    @NotNull
    private Long userId;

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
        if (prop.field === 'createTime' || prop.field === 'updateTime' || prop.field === 'deleted') continue;
        let validateAnno = '@NotNull';
        if (prop.jsType) {
            if (prop.jsType === 'string') {
                validateAnno = '@NotBlank';
            }
        }
        if (prop.field === 'biz') {
            validateAnno = undefined;
        }
        propLines.push(`${validateAnno ? `${validateAnno}\n    ` : ''}private ${prop.javaType} ${prop.field};`);
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
