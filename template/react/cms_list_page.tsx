import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { observer } from 'mobx-react';
import { IAdminStore, DATA_NAME } from '@shared/types';
import dayjs from 'dayjs';
import { useStore } from '@shared/store';
import SearchTablePage, { SearchFormControlAction, SearchFormControlType, SearchFormSchema, SearchFilter, SearchTablePageStore } from '@admin/components/SearchTablePage';
import { action } from 'mobx';
import { SearchResult } from '@ugeez/frontend-commons/lib/types';
import { Space, Popconfirm, Typography } from '@douyinfe/semi-ui';
import * as DATA_NAME_VARService from '../../services/DATA_NAME_VAR';
import Message from '@shared/components/Message';

type DATA_NAMESearchFilter = {} & SearchFilter;

class DATA_NAMEListStore extends SearchTablePageStore<DATA_NAME> {

    async doSearch(filter: DATA_NAMESearchFilter, page: number, pageSize: number): Promise<SearchResult<DATA_NAME>> {
        const result = await DATA_NAME_VARService.list(/*filter.keyword || '', */page, pageSize);
        return result;
    }

    @action
    async remove(ids: string[]): Promise<void> {
        for (let id of ids) {
            await DATA_NAME_VARService.remove(id);
        }
        this.refresh();
    }
}

const DATA_NAMEList = (): JSX.Element => {
    const store = useStore<IAdminStore>();
    const history = useHistory();
    const [viewStore] = useState<DATA_NAMEListStore>(new DATA_NAMEListStore());
    const [columns] = useState([
        TABLE_COLS
        {
            title: '操作',
            key: 'action',
            render(item) {
                return (
                    <Space spacing="tight">
                        <Typography.Text link={{ onClick: () => {
                            history.push(`/DATA_URL/detail?id=${item.id}`);
                        }}}>查看</Typography.Text>
                        <Popconfirm
                            title="确定是否要删除该数据？"
                            content="删除操作有可能造成业务问题, 被删除数据无法保证可被恢复。"
                            onConfirm={async () => {
                                await viewStore.remove([ item.id ]);
                                Message.success('数据已删除');
                            }}
                        >
                            <Typography.Text style={{ cursor: 'pointer' }} type="danger">删除</Typography.Text>
                        </Popconfirm>
                    </Space>
                );
            }
        }
    ]);

    const schema: SearchFormSchema<DATA_NAMESearchFilter> = {
        rows: [
            [
                {
                    name: 'keyword',
                    view: SearchFormControlType.Input,
                    size: 8,
                    placeholder: '请输入关键字搜索'
                },
                { action: SearchFormControlAction.Search },
                {
                    size: 6,
                    align: 'right',
                    views: [
                        {
                            view: SearchFormControlType.Button,
                            text: '新增DATA_LABEL',
                            onClick: () => {
                                history.push('/DATA_URL/create');
                            }
                        },
                        {
                            view: SearchFormControlType.Button,
                            // disabled: !usersStore.canSetGroup,
                            text: '设置分组',
                            onClick: () => {}
                        }
                    ]
                }
            ]
        ]
    };

    useEffect(() => {
        viewStore.refresh();
        return () => {
            viewStore.clear();
        };
    }, []);

    return (
        <SearchTablePage<DATA_NAME>
            store={viewStore}
            columns={columns}
            formSchema={schema}
            selectable={true}
            onError={(err) => {
                console.error(err);
            }}
        >
        </SearchTablePage>
    );
};

export default observer(DATA_NAMEList);
