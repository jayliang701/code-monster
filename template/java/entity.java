package NAMESPACE;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.ugeez.commons.mybatisplus.entity.AbstractEntity;
import lombok.Data;

import java.util.*;

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

<JS>

function build(entityDef) {

    const { javaCode, imports, javaCodeLines, sql, entityName, props, tableName, rootNamespace, namespace } = entityDef;

    const { findClassDefineLine, findPackageDefineLine, findIdProp, findAnnotation, findImport } = require('./parser/tools/javaParser');

    let code = javaCode;
    let classDefLineIndex = findClassDefineLine(javaCodeLines);
    let classDefLine = javaCodeLines[classDefLineIndex];

    let packageDefLineIndex = findPackageDefineLine(javaCodeLines);
    let packageDefLine = javaCodeLines[packageDefLineIndex];

    let addImports = [];

    for (let prop of props) {
        if (prop.lineIndex < 0) continue;
        if (prop.type === 'map' || prop.type === 'list') {
            let ann = findAnnotation(prop.annotations, '@TableField');
            if (!ann) {
                ann = `@TableField(typeHandler = JacksonTypeHandler.class)`;
                prop.annotations.push(ann);

                let propLine = javaCodeLines[prop.lineIndex];
                code = code.replace(propLine, `    ${ann}\n${propLine}`);


                if (!findImport(imports, '.TableField')) {
                    addImports.push('import com.baomidou.mybatisplus.annotation.TableField;');
                    imports.push('com.baomidou.mybatisplus.annotation.TableField');
                }
                if (!findImport(imports, '.JacksonTypeHandler')) {
                    addImports.push('import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;');
                    imports.push('com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler');
                }
            }
        }
    }

    if (code.indexOf('@TableName(') < 0) {
        let tableNameAnno = `@TableName(value = "tb_${tableName}", resultMap = "${tableName}_result_map")`;
        code = code.replace(classDefLine, `${tableNameAnno}\n${classDefLine}`);

        if (!findImport(imports, '.TableName')) {
            addImports.push('import com.baomidou.mybatisplus.annotation.TableName;');
            imports.push('com.baomidou.mybatisplus.annotation.TableName');
        }
    }
    if (addImports && addImports.length > 0) {
        code = code.replace(packageDefLine, `${packageDefLine}\n\n${addImports.join('\n')}`);
    }

    let idProp = findIdProp(props);
    if (idProp && idProp.type === 'long') {
        if (code.indexOf('AbstractEntity<') < 0) {
            code = code.replace(classDefLine, `${classDefLine.trim().replace('{', '')}extends AbstractEntity<${entityName}> {`);
            code = code.replace(packageDefLine, `${packageDefLine}\n\nimport com.ugeez.commons.mybatisplus.entity.AbstractEntity;`);

            code = code.replace('\n' + idProp.lineText, '');
        }
    }

    for (let imp of imports) {
        if (imp.startsWith('java.') && !imp.startsWith('java.util.')) {
            code = code.replace(`import java.util.*;`, `import ${imp};\nimport java.util.*;`)
        }
    }

    code = code + `\n\n/*---------------------------------------- SQL -----------------------------------------\n`;
    code = code + sql;
    code = code + `\n---------------------------------------- SQL -----------------------------------------*/\n`;

    return {
        code,
        entityDef,
    };
}

</JS>