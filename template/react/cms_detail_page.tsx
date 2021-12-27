import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Button, Col, Form, Row, Space } from '@douyinfe/semi-ui';
import { PageStore } from '@shared/store/PageStore';
import { DATA_NAME, IAdminStore } from '@shared/types';
import * as DATA_NAME_VARService from '../../services/DATA_NAME_VAR';
import Message from '@shared/components/Message';
import { useQuery } from '@shared/hooks';
import { FormApi } from '@douyinfe/semi-ui/lib/es/form';
//APPEND_CODES
type DATA_NAMEDetailFormValues = {
    PROPS_DEFINES
};

const defaultFormValues: DATA_NAMEDetailFormValues = {
    PROPS_SET_DEFAULT
};

class DATA_NAMEDetailStore extends PageStore<IAdminStore> {

    detail: DATA_NAME;

    formApi: FormApi;

    setFormApi(formApi: FormApi) {
        this.formApi = formApi;
        this.updateFormValues();
    }

    updateFormValues() {
        const { formApi, detail } = this;
        if (formApi && detail) {
            formApi.setValues({
                FORM_VALUES_SET
            });
        }
    }

    async load(id: string) {
        const detail = await DATA_NAME_VARService.query(id);
        this.detail = detail;
        this.updateFormValues();
    }

    async doSubmit({ PROPS_ARGS }: DATA_NAMEDetailFormValues): Promise<void> {
        const DATA_NAME_VAR: DATA_NAME = {
            id: this.detail.id,
            biz: this.detail.biz,
            PROPS_ARGS_SET
        };
        await DATA_NAME_VARService.update(DATA_NAME_VAR);
    }

}

const DATA_NAMEDetail: React.FC = (): JSX.Element => {
    const { search } = useLocation();
    const query = useQuery();
    const history = useHistory();
    const [viewStore] = useState<DATA_NAMEDetailStore>(new DATA_NAMEDetailStore());
    const { loading } = viewStore;

    useEffect(() => {
        viewStore.load(query.get("id") as string);
    }, [ search ]);

    return <div>
        <div className="flex justify-center">
            <div className="flex-1" style={{ maxWidth: 640 }}>
                <Form
                    initValues={defaultFormValues}
                    getFormApi={(formApi) => {
                        viewStore.setFormApi(formApi);
                    }}
                    onSubmit={async (values) => {
                        await viewStore.submit(values);
                        Message.success('DATA_LABEL更新成功');
                    }}
                    labelPosition="left"
                    labelAlign="right"
                    labelWidth={160}
                >
                    FORM_ITEMS
                    <Row className="mt-8">
                        <Col span={24} className="text-center">
                            <Space spacing="loose" >
                                <Button
                                    size="large"
                                    onClick={() => {
                                        history.replace('/DATA_URL')
                                    }}
                                >
                                    返回上一级
                                </Button>
                                <Button
                                    theme='solid' type="primary"
                                    size="large"
                                    loading={loading}
                                    htmlType="submit"
                                >
                                    保存修改
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </div>
        </div>
    </div>;
};

export default observer(DATA_NAMEDetail);
