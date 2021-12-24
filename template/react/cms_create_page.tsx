import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { observer } from 'mobx-react';
import { Button, Col, Form, Row, Space } from '@douyinfe/semi-ui';
import { PageStore } from '@shared/store/PageStore';
import { DATA_NAME, IAdminStore } from '@shared/types';
import * as DATA_NAME_VARService from '../../../services/DATA_NAME_VAR';
import Message from '@shared/components/Message';
//APPEND_CODES
type DATA_NAMECreateFormValues = {
    PROPS_DEFINES
};

const defaultFormValues: DATA_NAMECreateFormValues = {
    PROPS_SET_DEFAULT
};

class DATA_NAMECreateStore extends PageStore<IAdminStore> {

    async doSubmit({ PROPS_ARGS }: DATA_NAMECreateFormValues): Promise<void> {
        const DATA_NAME_VAR: DATA_NAME = {
            id: '',
            PROPS_ARGS_SET
        };
        await DATA_NAME_VARService.create(DATA_NAME_VAR);
    }

}

const DATA_NAMECreate: React.FC = (): JSX.Element => {
    const history = useHistory();
    const [viewStore] = useState<DATA_NAMECreateStore>(new DATA_NAMECreateStore());
    const { loading } = viewStore;

    return <div>
        <div className="flex justify-center">
            <div className="flex-1" style={{ maxWidth: 640 }}>
                <Form
                    initValues={defaultFormValues}
                    onSubmit={async (values) => {
                        await viewStore.submit(values);
                        Message.success('DATA_LABEL创建成功');
                        history.replace('/DATA_URL');
                    }}
                >
                    
                    FORM_ITEMS

                    <Row className="mt-8">
                        <Col span={24}>
                            <Space spacing="loose" >
                                <Button
                                    size="large"
                                    onClick={() => {
                                        history.goBack();
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
                                    确认创建
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </Form>
            </div>
        </div>
    </div>;
};

export default observer(DATA_NAMECreate);
