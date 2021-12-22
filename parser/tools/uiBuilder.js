

const utils = require('../../utils');

const buildFormItem = (prop, { appendCodes, readonly }) => {
    readonly = readonly || {};

    let code = '<Row gutter={24}>\n                        <Col span={24}>\n                            <Form.';

    let control = 'Input';
    let controlProps = [
        `field="${prop.field}"`,
        `label="${prop.label}"`
    ];
    if (prop.isDateTime) {
        control = 'DatePicker';
    } else if (!prop.isBasicType) {
        if (prop.typeDef && prop.typeDef.isEnum) {
            control = 'Select';
            /**
                optionList={[
                    { label: '有限责任公司', value: CompanyType.LIMIT },
                    { label: '合伙企业', value: CompanyType.PARTNERSHIP }
                ]}
             */
            
            let optionList = [];
            for (let enumItem of prop.typeDef.enums) {
                optionList.push(`{ label:\'${enumItem.label}\', value: ${prop.typeDef.name}.${enumItem.name} }`);
            }

            let optionListVarName = prop.typeDef.name.charAt(0).toLowerCase() + prop.typeDef.name.substr(1) + 'Options';

            appendCodes.push(`const ${optionListVarName} = [\n    ${optionList.join(',\n    ')}\n];`);

            controlProps.push(`optionList={${optionListVarName}}`);
        }
    } else {
        if (prop.type === 'number') {
            controlProps.push(`type="number"`);
        }
    }

    if (readonly[prop.field]) {
        controlProps.push(`readonly`);
    }

    code += control + '\n                                ';
    code += controlProps.join('\n                                ');
    code += `\n                            />\n`;
    code += `                        </Col>\n`;
    code += `                    </Row>`;

    return code;
}

module.exports = {
    buildFormItem,
};
