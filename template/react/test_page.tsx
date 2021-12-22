import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { observer } from 'mobx-react';
import { IAdminStore, Company } from '@shared/types';
import dayjs from 'dayjs';
import { useStore } from '@shared/store';
import SearchTablePage, { SearchFormControlAction, SearchFormControlType, SearchFormSchema, SearchFilter, SearchTablePageStore } from '@admin/components/SearchTablePage';
import { action } from 'mobx';
import { SearchResult } from '@ugeez/frontend-commons/lib/types';
import { Space, Popconfirm, Typography } from '@douyinfe/semi-ui';
import * as companyService from '../../../services/company';
import Message from '@shared/components/Message';

type CompanySearchFilter = {} & SearchFilter;

class CompanyListStore extends SearchTablePageStore<Company> {

    async doSearch(filter: CompanySearchFilter, page: number, pageSize: number): Promise<SearchResult<Company>> {
        const result = await companyService.list(/*filter.keyword || '', */page, pageSize);
        return result;
    }

    @action
    async remove(ids: string[]): Promise<void> {
        for (let id of ids) {
            await companyService.remove(id);
        }
        this.refresh();
    }
}

const CompanyList = (): JSX.Element => {
    const store = useStore<IAdminStore>();
    const history = useHistory();
    const [viewStore] = useState<CompanyListStore>(new CompanyListStore());
    const [columns] = useState([
        // {
        //     title: '公司ID',
        //     dataIndex: 'id',
        //     key: 'id'
        // },
        // {
        //     title: '公司名称',
        //     dataIndex: 'name',
        //     key: 'name'
        // },
        // {
        //     title: '省份',
        //     dataIndex: 'province',
        //     key: 'province'
        // },
        // {
        //     title: '城市',
        //     dataIndex: 'city',
        //     key: 'city'
        // },
        // {
        //     title: '注册时间',
        //     dataIndex: 'registryTime',
        //     key: 'registryTime',
        //     render(registryTime) {
        //         return dayjs(registryTime).format('YYYY-MM-DD');
        //     }
        // },
        // {
        //     title: '员工人数',
        //     dataIndex: 'employeeNum',
        //     key: 'employeeNum',
        // },
        // {
        //     title: '创建时间',
        //     dataIndex: 'createTime',
        //     key: 'createTime',
        //     render(createTime: number | undefined) {
        //         return createTime ? dayjs(createTime).format('YYYY-MM-DD') : '';
        //     }
        // },
        {
            title: 'id',
            dataIndex: 'id',
            key: 'id'
        },
        {
            title: '公司名称',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: '地址',
            dataIndex: 'address',
            key: 'address'
        },
        {
            title: '城市',
            dataIndex: 'city',
            key: 'city'
        },
        {
            title: '省份',
            dataIndex: 'province',
            key: 'province'
        },
        {
            title: '注册时间',
            dataIndex: 'registryTime',
            key: 'registryTime',
            render(registryTime?: number) {
                return registryTime ? dayjs(registryTime).format('YYYY-MM-DD') : '';
            }
        },
        {
            title: '员工人数',
            dataIndex: 'employeeNum',
            key: 'employeeNum'
        },
        {
            title: '公司类型',
            dataIndex: 'type',
            key: 'type',
            render(type: CompanyType) {
                //显示枚举类型对应的UI文字
                return type;
            }
        },
        {
            title: '操作',
            key: 'action',
            render(item) {
                return (
                    <Space spacing="tight">
                        <Typography.Text link={{ onClick: () => {
                            history.push(`/company/detail?id=${item.id}`);
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

    const schema: SearchFormSchema<CompanySearchFilter> = {
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
                            text: '新增公司',
                            onClick: () => {
                                history.push('/company/create');
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
        <SearchTablePage<Company>
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

export default observer(CompanyList);
